import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generate Invoice PDF using jsPDF
 * @param {Object} invoiceData - Invoice details
 * @param {string} outputPath - File path to save PDF
 * @returns {Promise<string>} - Path to generated PDF
 */
export async function generateInvoicePDF(invoiceData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(22);
      doc.setTextColor(255, 102, 68); // #FF6644
      doc.text("INVOICE", 105, 20, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("On Road Vehicle Breakdown Service", 105, 30, { align: "center" });
      doc.text("Dhaka, Bangladesh", 105, 35, { align: "center" });

      // Invoice Details (Right Side)
      doc.setFontSize(10);
      doc.text(`Invoice No: ${invoiceData.invoiceNumber}`, 200, 50, { align: "right" });
      doc.text(`Date: ${new Date(invoiceData.createdAt).toLocaleDateString()}`, 200, 55, { align: "right" });
      
      if (invoiceData.status) {
        doc.text(`Status: ${invoiceData.status.toUpperCase()}`, 200, 60, { align: "right" });
      }

      // Bill To (Left Side)
      doc.setFontSize(12);
      doc.setTextColor(255, 102, 68);
      doc.text("BILL TO:", 14, 50);
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      let customerY = 56;
      doc.text(invoiceData.billingAddress?.name || invoiceData.user.name, 14, customerY);
      customerY += 5;
      doc.text(invoiceData.billingAddress?.email || invoiceData.user.email, 14, customerY);
      
      if (invoiceData.user.phone) {
        customerY += 5;
        doc.text(invoiceData.billingAddress?.phone || invoiceData.user.phone, 14, customerY);
      }

      // Table
      const tableColumn = ["Description", "Qty", "Unit Price", "Amount"];
      const tableRows = [];

      invoiceData.items.forEach(item => {
        const row = [
            item.description,
            item.quantity,
            `${invoiceData.currency} ${item.unitPrice}`,
            `${invoiceData.currency} ${item.amount}`
        ];
        tableRows.push(row);
      });

      autoTable(doc, {
        startY: 75,
        head: [tableColumn],
        body: tableRows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [255, 102, 68] }, // #FF6644
        margin: { top: 75 },
      });

      // Totals
      const finalY = doc.lastAutoTable.finalY + 10;
      const rightMargin = 195;
      
      doc.text(`Subtotal: ${invoiceData.currency} ${invoiceData.subtotal}`, rightMargin, finalY, { align: "right" });
      
      let currentY = finalY;

      if (invoiceData.tax?.amount > 0) {
        currentY += 5;
        doc.text(`Tax: ${invoiceData.currency} ${invoiceData.tax.amount}`, rightMargin, currentY, { align: "right" });
      }

      if (invoiceData.discount > 0) {
        currentY += 5;
        doc.text(`Discount: -${invoiceData.currency} ${invoiceData.discount}`, rightMargin, currentY, { align: "right" });
      }

      currentY += 7;
      doc.setFontSize(12);
      doc.setTextColor(255, 102, 68);
      doc.text(`Total: ${invoiceData.currency} ${invoiceData.total}`, rightMargin, currentY, { align: "right" });

      // Payment Status
      if (invoiceData.status === 'paid') {
         currentY += 15;
         doc.setFillColor(232, 245, 233); // Light green bg
         doc.rect(14, currentY, 180, 25, 'F');
         
         doc.setFontSize(12);
         doc.setTextColor(40, 167, 69); // Green text
         doc.text(`PAID`, 20, currentY + 10);
         
         if (invoiceData.paidAt) {
             doc.setFontSize(10);
             doc.text(`Paid on: ${new Date(invoiceData.paidAt).toLocaleDateString()}`, 20, currentY + 18);
         }
         if (invoiceData.paymentId) {
             doc.text(`TrxID: ${invoiceData.paymentId}`, 100, currentY + 18);
         }
      }

      // Notes
      if (invoiceData.notes) {
          const pageHeight = doc.internal.pageSize.height;
          doc.setFontSize(9);
          doc.setTextColor(100);
          doc.text(`Notes: ${invoiceData.notes}`, 14, pageHeight - 30);
      }
      
      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Thank you for your business!", 105, pageHeight - 15, { align: "center" });

      // Save
      doc.save(outputPath);
      resolve(outputPath);
    } catch (error) {
      reject(error);
    }
  });
}
