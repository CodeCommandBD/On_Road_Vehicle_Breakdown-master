import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generateInvoicePDF = async (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on("data", (buffer) => buffers.push(buffer));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // Header
      doc
        .fillColor("#444444")
        .fontSize(20)
        .text("On-Road Help", 110, 57)
        .fontSize(10)
        .text("123 Main Street", 200, 65, { align: "right" })
        .text("Dhaka, Bangladesh, 1000", 200, 80, { align: "right" })
        .moveDown();

      // Invoice Details
      doc
        .fontSize(20)
        .text("Invoice", 50, 160)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(`Invoice Number: ${invoice.invoiceNumber}`, 50, 200)
        .text(
          `Date: ${new Date(invoice.createdAt).toLocaleDateString()}`,
          50,
          215
        )
        .text(
          `Due Date: ${
            invoice.dueDate
              ? new Date(invoice.dueDate).toLocaleDateString()
              : "Due on Receipt"
          }`,
          50,
          230
        )
        .text(`Balance Due: ${invoice.total} ${invoice.currency}`, 50, 245)
        .font("Helvetica")
        .moveDown();

      // Billing Details
      doc
        .text(`Bill To:`, 300, 200)
        .font("Helvetica-Bold")
        .text(invoice.billingAddress?.name || "N/A", 300, 215)
        .font("Helvetica")
        .text(invoice.billingAddress?.email || "", 300, 230)
        .text(invoice.billingAddress?.phone || "", 300, 245)
        .moveDown();

      // Table Header
      const tableTop = 330;
      doc.font("Helvetica-Bold");
      doc
        .text("Item", 50, tableTop)
        .text("Quantity", 300, tableTop)
        .text("Unit Cost", 370, tableTop, { width: 90, align: "right" })
        .text("Line Total", 470, tableTop, { width: 90, align: "right" });

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Table Rows
      let i = 0;
      doc.font("Helvetica");
      invoice.items.forEach((item, index) => {
        const y = tableTop + 25 + index * 25;
        doc
          .text(item.description, 50, y)
          .text(item.quantity.toString(), 300, y)
          .text(item.unitPrice.toFixed(2), 370, y, {
            width: 90,
            align: "right",
          })
          .text(item.amount.toFixed(2), 470, y, { width: 90, align: "right" });
        i = index;
      });

      const subtotalPosition = tableTop + 25 + (i + 1) * 25 + 20;
      doc
        .moveTo(50, subtotalPosition - 10)
        .lineTo(550, subtotalPosition - 10)
        .stroke();

      // Totals
      doc.font("Helvetica-Bold");
      doc.text("Subtotal:", 370, subtotalPosition, {
        width: 90,
        align: "right",
      });
      doc.text(invoice.subtotal.toFixed(2), 470, subtotalPosition, {
        width: 90,
        align: "right",
      });

      if (invoice.tax?.amount > 0) {
        doc.text("Tax:", 370, subtotalPosition + 15, {
          width: 90,
          align: "right",
        });
        doc.text(invoice.tax.amount.toFixed(2), 470, subtotalPosition + 15, {
          width: 90,
          align: "right",
        });
      }

      const totalPosition = subtotalPosition + 35;
      doc.fontSize(12);
      doc.text("Total:", 370, totalPosition, { width: 90, align: "right" });
      doc.text(invoice.total.toFixed(2), 470, totalPosition, {
        width: 90,
        align: "right",
      });

      // Footer
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(
          "Thank you for your business!",
          50,
          doc.page.height - 50, // Bottom of page
          { align: "center", width: 500 }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
