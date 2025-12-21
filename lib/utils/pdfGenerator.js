import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

/**
 * Generate Contract PDF
 * @param {Object} contractData - Contract details
 * @param {string} outputPath - File path to save PDF
 * @returns {Promise<string>} - Path to generated PDF
 */
export async function generateContractPDF(contractData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      // Header
      doc
        .fontSize(20)
        .fillColor("#FF6644")
        .text("SERVICE AGREEMENT", { align: "center" })
        .moveDown();

      doc
        .fontSize(10)
        .fillColor("#000000")
        .text(`Contract No: ${contractData.contractNumber}`, { align: "right" })
        .text(
          `Date: ${new Date(contractData.createdAt).toLocaleDateString()}`,
          {
            align: "right",
          }
        )
        .moveDown(2);

      // Parties
      doc
        .fontSize(14)
        .fillColor("#FF6644")
        .text("BETWEEN", { underline: true })
        .moveDown(0.5);

      doc
        .fontSize(11)
        .fillColor("#000000")
        .text("On Road Vehicle Breakdown Service", { bold: true })
        .fontSize(9)
        .text("Provider of emergency vehicle assistance services")
        .text("Dhaka, Bangladesh")
        .moveDown()
        .text("(Hereinafter referred to as 'Service Provider')")
        .moveDown(1.5);

      doc.fontSize(14).fillColor("#FF6644").text("AND").moveDown(0.5);

      doc
        .fontSize(11)
        .fillColor("#000000")
        .text(contractData.user.name, { bold: true })
        .fontSize(9)
        .text(contractData.user.email)
        .text(contractData.user.phone || "")
        .moveDown()
        .text("(Hereinafter referred to as 'Client')")
        .moveDown(2);

      // Plan Details
      doc
        .fontSize(14)
        .fillColor("#FF6644")
        .text("PLAN DETAILS", { underline: true })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .fillColor("#000000")
        .text(`Plan: ${contractData.plan.name}`)
        .text(`Billing Cycle: ${contractData.pricing.billingCycle}`)
        .text(
          `Amount: ${
            contractData.pricing.currency
          } ${contractData.pricing.amount.toLocaleString()}`
        )
        .text(
          `Contract Period: ${new Date(
            contractData.startDate
          ).toLocaleDateString()} to ${new Date(
            contractData.endDate
          ).toLocaleDateString()}`
        )
        .moveDown(2);

      // Terms & Conditions
      doc
        .fontSize(14)
        .fillColor("#FF6644")
        .text("TERMS & CONDITIONS", { underline: true })
        .moveDown(0.5);

      doc.fontSize(9).fillColor("#000000").text(contractData.terms, {
        align: "justify",
      });

      if (contractData.customTerms) {
        doc.moveDown().text(contractData.customTerms, { align: "justify" });
      }

      doc.moveDown(2);

      // SLA & Features
      if (contractData.metadata) {
        doc
          .fontSize(12)
          .fillColor("#FF6644")
          .text("SERVICE LEVEL AGREEMENT", { underline: true })
          .moveDown(0.5);

        doc.fontSize(9).fillColor("#000000");
        if (contractData.metadata.slaMinutes) {
          doc.text(
            `Response Time: ${contractData.metadata.slaMinutes} minutes`
          );
        }
        if (contractData.metadata.dedicatedSupport) {
          doc.text("24/7 Dedicated Support: Included");
        }
        if (contractData.metadata.customFeatures?.length > 0) {
          doc.text("Custom Features:");
          contractData.metadata.customFeatures.forEach((feature) => {
            doc.text(`  • ${feature}`);
          });
        }
        doc.moveDown(2);
      }

      // Signature Section
      doc.addPage();
      doc
        .fontSize(14)
        .fillColor("#FF6644")
        .text("SIGNATURES", { underline: true, align: "center" })
        .moveDown(2);

      // Service Provider Signature
      doc
        .fontSize(10)
        .fillColor("#000000")
        .text("Service Provider", { align: "left" })
        .moveDown(3)
        .text("_______________________", { align: "left" })
        .text("Authorized Signature", { align: "left" })
        .text(`Date: ${new Date().toLocaleDateString()}`, { align: "left" });

      // Client Signature
      const clientY = doc.y - 100;
      doc
        .fontSize(10)
        .text("Client", { align: "right" })
        .moveDown(3)
        .text("_______________________", { align: "right" });

      if (contractData.signedBy?.signature) {
        doc.text(`Signed by: ${contractData.signedBy.name}`, {
          align: "right",
        });
        if (contractData.signedAt) {
          doc.text(
            `Date: ${new Date(contractData.signedAt).toLocaleDateString()}`,
            { align: "right" }
          );
        }
      } else {
        doc.text("Signature", { align: "right" }).text("Date: ___________", {
          align: "right",
        });
      }

      // Footer
      doc
        .fontSize(8)
        .fillColor("#888888")
        .text(
          "This is a computer-generated contract and is valid without physical signature.",
          50,
          doc.page.height - 50,
          { align: "center", width: doc.page.width - 100 }
        );

      doc.end();

      stream.on("finish", () => resolve(outputPath));
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Invoice PDF
 * @param {Object} invoiceData - Invoice details
 * @param {string} outputPath - File path to save PDF
 * @returns {Promise<string>} - Path to generated PDF
 */
export async function generateInvoicePDF(invoiceData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      // Header with company name
      doc
        .fontSize(24)
        .fillColor("#FF6644")
        .text("INVOICE", { align: "center" })
        .moveDown();

      doc
        .fontSize(10)
        .fillColor("#000000")
        .text("On Road Vehicle Breakdown Service", { align: "center" })
        .text("Dhaka, Bangladesh", { align: "center" })
        .moveDown(2);

      // Invoice details
      doc
        .fontSize(10)
        .text(`Invoice No: ${invoiceData.invoiceNumber}`, { align: "right" })
        .text(`Date: ${new Date(invoiceData.createdAt).toLocaleDateString()}`, {
          align: "right",
        });

      if (invoiceData.dueDate) {
        doc.text(
          `Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString()}`,
          { align: "right" }
        );
      }

      doc.text(`Status: ${invoiceData.status.toUpperCase()}`, {
        align: "right",
      });
      doc.moveDown(2);

      // Bill To section
      doc
        .fontSize(12)
        .fillColor("#FF6644")
        .text("BILL TO:", { underline: true })
        .moveDown(0.5);

      doc.fontSize(10).fillColor("#000000");
      if (invoiceData.billingAddress) {
        doc
          .text(invoiceData.billingAddress.name || invoiceData.user.name)
          .text(invoiceData.billingAddress.email || invoiceData.user.email)
          .text(
            invoiceData.billingAddress.phone || invoiceData.user.phone || ""
          )
          .text(invoiceData.billingAddress.address || "")
          .text(
            `${invoiceData.billingAddress.city || ""} ${
              invoiceData.billingAddress.postalCode || ""
            }`
          );
      } else {
        doc
          .text(invoiceData.user.name)
          .text(invoiceData.user.email)
          .text(invoiceData.user.phone || "");
      }

      doc.moveDown(2);

      // Table header
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 250;
      const col3 = 350;
      const col4 = 450;

      doc
        .fontSize(10)
        .fillColor("#FFFFFF")
        .rect(col1, tableTop, 500, 25)
        .fill("#FF6644");

      doc
        .fillColor("#FFFFFF")
        .text("Description", col1 + 5, tableTop + 8)
        .text("Qty", col2 + 5, tableTop + 8)
        .text("Unit Price", col3 + 5, tableTop + 8)
        .text("Amount", col4 + 5, tableTop + 8);

      // Table rows
      let y = tableTop + 30;
      doc.fillColor("#000000");

      invoiceData.items.forEach((item, i) => {
        if (y > doc.page.height - 150) {
          doc.addPage();
          y = 50;
        }

        doc
          .fontSize(9)
          .text(item.description, col1 + 5, y, { width: 190 })
          .text(item.quantity.toString(), col2 + 5, y)
          .text(
            `${invoiceData.currency} ${item.unitPrice.toLocaleString()}`,
            col3 + 5,
            y
          )
          .text(
            `${invoiceData.currency} ${item.amount.toLocaleString()}`,
            col4 + 5,
            y
          );

        y += 25;

        if (i < invoiceData.items.length - 1) {
          doc
            .moveTo(col1, y - 5)
            .lineTo(550, y - 5)
            .stroke("#CCCCCC");
        }
      });

      // Totals section
      y += 10;
      const totalsX = 350;

      doc
        .fontSize(10)
        .text("Subtotal:", totalsX, y, { width: 90, align: "right" })
        .text(
          `${invoiceData.currency} ${invoiceData.subtotal.toLocaleString()}`,
          totalsX + 100,
          y
        );

      y += 20;
      if (invoiceData.discount > 0) {
        doc
          .text("Discount:", totalsX, y, { width: 90, align: "right" })
          .text(
            `- ${
              invoiceData.currency
            } ${invoiceData.discount.toLocaleString()}`,
            totalsX + 100,
            y
          );
        y += 20;
      }

      if (invoiceData.tax.amount > 0) {
        doc
          .text(`Tax (${invoiceData.tax.rate}%):`, totalsX, y, {
            width: 90,
            align: "right",
          })
          .text(
            `${
              invoiceData.currency
            } ${invoiceData.tax.amount.toLocaleString()}`,
            totalsX + 100,
            y
          );
        y += 20;
      }

      doc
        .fontSize(12)
        .fillColor("#FF6644")
        .text("Total:", totalsX, y, { width: 90, align: "right" })
        .text(
          `${invoiceData.currency} ${invoiceData.total.toLocaleString()}`,
          totalsX + 100,
          y,
          { bold: true }
        );

      // Payment info
      if (invoiceData.status === "paid" && invoiceData.paidAt) {
        y += 40;
        doc
          .fontSize(10)
          .fillColor("#28A745")
          .rect(50, y, 500, 40)
          .fillAndStroke("#E8F5E9", "#28A745");

        doc
          .fillColor("#28A745")
          .text(
            `✓ PAID on ${new Date(invoiceData.paidAt).toLocaleDateString()}`,
            60,
            y + 12,
            { bold: true }
          );

        if (invoiceData.paymentId) {
          doc.text(`Transaction ID: ${invoiceData.paymentId}`, 60, y + 27);
        }
      }

      // Notes
      if (invoiceData.notes) {
        y += 60;
        doc
          .fontSize(10)
          .fillColor("#000000")
          .text("Notes:", 50, y, { underline: true })
          .fontSize(9)
          .text(invoiceData.notes, 50, y + 15, { width: 500 });
      }

      // Footer
      doc
        .fontSize(8)
        .fillColor("#888888")
        .text("Thank you for your business!", 50, doc.page.height - 50, {
          align: "center",
          width: 500,
        });

      doc.end();

      stream.on("finish", () => resolve(outputPath));
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}
