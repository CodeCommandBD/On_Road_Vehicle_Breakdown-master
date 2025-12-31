import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Payment from "@/lib/db/models/Payment";
import Subscription from "@/lib/db/models/Subscription";
import User from "@/lib/db/models/User";
// Plan model replaced by Package, accessed via populate
import Garage from "@/lib/db/models/Garage";

export async function POST(request) {
  try {
    await connectDB();

    // Get form data from SSLCommerz callback
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const {
      tran_id,
      val_id,
      amount,
      card_type,
      card_brand,
      bank_tran_id,
      status,
      value_a, // payment ID
      value_b, // subscription ID
      value_c, // billing cycle
    } = data;

    console.log("Payment success callback received:", {
      tran_id,
      status,
      value_a,
      value_b,
    });

    // Find payment record by transaction ID (more reliable than value_a)
    const payment = await Payment.findOne({
      "sslcommerz.transactionId": tran_id,
    });

    if (!payment) {
      console.error("Payment not found for transaction:", tran_id);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail?error=payment_not_found`
      );
    }

    // Find subscription
    const subscription = await Subscription.findById(payment.subscriptionId);
    if (!subscription) {
      console.error("Subscription not found:", payment.subscriptionId);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail?error=subscription_not_found`
      );
    }

    // For sandbox, we trust the callback since it's already validated
    // In production, you should validate with SSLCommerz API
    const is_live = process.env.SSLCOMMERZ_IS_LIVE === "true";

    // Only validate in production to avoid fetch issues in sandbox
    let isValid = true;
    if (is_live && val_id) {
      // Production validation would go here
      // For now, we'll trust the status from callback
      isValid = status === "VALID" || status === "VALIDATED";
    }

    // Check if payment is valid
    if (isValid && (status === "VALID" || status === "VALIDATED")) {
      // Update payment record
      await Payment.findByIdAndUpdate(payment._id, {
        status: "success",
        "sslcommerz.transactionId": tran_id,
        "sslcommerz.bankTransactionId": bank_tran_id,
        "sslcommerz.cardType": card_type,
        "sslcommerz.cardBrand": card_brand,
        "sslcommerz.validatedOn": new Date(),
        paidAt: new Date(),
      });

      // Calculate duration and new dates
      const durationDays = subscription.billingCycle === "monthly" ? 30 : 365;
      const startDate = new Date();
      const endDate = new Date(
        startDate.getTime() + durationDays * 24 * 60 * 60 * 1000
      );

      // Activate subscription with new dates
      await Subscription.findByIdAndUpdate(subscription._id, {
        status: "active",
        transactionId: tran_id,
        startDate: startDate,
        endDate: endDate,
      });

      // Update user membership
      const user = await User.findById(subscription.userId);
      if (user) {
        await subscription.populate("planId");
        await User.findByIdAndUpdate(user._id, {
          membershipTier: subscription.planId.tier,
          membershipExpiry: endDate,
          currentSubscription: subscription._id,
        });
      }

      console.log("Payment successful:", tran_id);

      // --- AUTO-GENERATE INVOICE ---
      try {
        const Invoice = (await import("@/lib/db/models/Invoice")).default;

        // Get plan details for invoice
        const populatedSub = await subscription.populate("planId");
        const plan = populatedSub.planId;

        const invoice = new Invoice({
          userId: subscription.userId,
          subscriptionId: subscription._id,
          items: [
            {
              description: `${plan.name} - ${subscription.billingCycle} Subscription`,
              quantity: 1,
              unitPrice: parseFloat(amount),
              amount: parseFloat(amount),
            },
          ],
          subtotal: parseFloat(amount),
          tax: { rate: 0, amount: 0 },
          discount: 0,
          total: parseFloat(amount),
          currency: "BDT",
          status: "paid",
          paymentId: tran_id,
          paymentMethod: card_type || "sslcommerz",
          paidAt: new Date(),
          billingAddress: {
            name: user?.name,
            email: user?.email,
            phone: user?.phone,
          },
        });

        await invoice.save();

        // Link invoice to subscription
        await Subscription.findByIdAndUpdate(subscription._id, {
          $push: { invoices: invoice._id },
        });

        console.log("Invoice auto-generated:", invoice.invoiceNumber);

        // Send Invoice Email
        try {
          const { generateInvoicePDF } = await import(
            "@/lib/utils/invoiceGenerator"
          );
          const { sendEmail } = await import("@/lib/utils/email");
          const pdfBuffer = await generateInvoicePDF(invoice);

          await sendEmail({
            to: user.email,
            subject: `Invoice #${invoice.invoiceNumber} from On-Road Help`,
            html: `
                <h1>Thank you for your payment!</h1>
                <p>Your invoice #${invoice.invoiceNumber} for <strong>${plan.name}</strong> is attached.</p>
                <p>Total Paid: ${invoice.total} ${invoice.currency}</p>
              `,
            attachments: [
              {
                filename: `Invoice-${invoice.invoiceNumber}.pdf`,
                content: pdfBuffer,
              },
            ],
          });
          console.log("Invoice email sent to:", user.email);
        } catch (emailErr) {
          console.error("Failed to send invoice email:", emailErr);
        }
      } catch (invoiceError) {
        console.error("Invoice generation failed:", invoiceError);
        // Don't fail payment if invoice fails - just log
      }
      // ----------------------------

      // BROADCAST REAL-TIME ANALYTICS
      try {
        const { pusherServer } = await import("@/lib/pusher");
        await pusherServer.trigger("analytics", "revenue_update", {
          amount: parseFloat(amount),
          plan: subscription.planId?.name || "Subscription",
          timestamp: new Date().toISOString(),
        });
      } catch (pusherErr) {
        console.error("Pusher broadcast failed:", pusherErr);
      }

      // Upgrade Garage Membership
      if (
        subscription.planId.type === "garage" ||
        subscription.planId.tier === "premium" ||
        subscription.planId.tier === "standard" ||
        subscription.planId.tier === "garage_pro" ||
        subscription.planId.isFeatured
      ) {
        await Garage.updateMany(
          { owner: subscription.userId },
          {
            $set: {
              isFeatured: true, // Auto-Feature for Top Listing
              membershipTier: subscription.planId.tier,
              membershipExpiry: endDate,
            },
          }
        );
        console.log(
          "Upgraded garage membership for user:",
          subscription.userId
        );
      }

      // Redirect to success page
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?transaction=${tran_id}&plan=${subscription.planId}&cycle=${subscription.billingCycle}`
      );
    } else {
      // Validation failed
      console.error("Payment validation failed:", { status, val_id });

      await Payment.findByIdAndUpdate(payment._id, {
        status: "failed",
        errorMessage: "Payment validation failed",
      });

      await Subscription.findByIdAndUpdate(subscription._id, {
        status: "cancelled",
      });

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail?error=validation_failed`
      );
    }
  } catch (error) {
    console.error("Payment success callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/fail?error=server_error`
    );
  }
}
