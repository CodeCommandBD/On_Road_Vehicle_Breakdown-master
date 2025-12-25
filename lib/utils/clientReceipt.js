import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const downloadReceiptPDF = (booking) => {
  const doc = new jsPDF();
  const invoiceData = {
    invoiceNumber: booking.bookingNumber,
    createdAt: booking.createdAt,
    status: booking.status,
    user: booking.user,
    currency: "BDT",
    subtotal: booking.actualCost || booking.estimatedCost,
    total: booking.actualCost || booking.estimatedCost,
    discount: 0,
    tax: { amount: 0 },
    paidAt: booking.updatedAt, // Approximate if not stored
    paymentInfo: booking.paymentInfo,
  };

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
  doc.text(`Invoice No: ${invoiceData.invoiceNumber}`, 200, 50, {
    align: "right",
  });
  doc.text(
    `Date: ${new Date(invoiceData.createdAt).toLocaleDateString()}`,
    200,
    55,
    { align: "right" }
  );

  if (invoiceData.status) {
    doc.text(`Status: ${invoiceData.status.toUpperCase()}`, 200, 60, {
      align: "right",
    });
  }

  // Bill To (Left Side)
  doc.setFontSize(12);
  doc.setTextColor(255, 102, 68);
  doc.text("BILL TO:", 14, 50);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  let customerY = 56;
  doc.text(invoiceData.user?.name || "Customer", 14, customerY);
  customerY += 5;
  if (invoiceData.user?.email) {
    doc.text(invoiceData.user.email, 14, customerY);
    customerY += 5;
  }
  if (invoiceData.user?.phone) {
    doc.text(invoiceData.user.phone, 14, customerY);
  }

  // Table Data
  const tableColumn = ["Description", "Qty", "Unit Price", "Amount"];
  const tableRows = [];

  // Base Service
  tableRows.push([
    booking.serviceName || "Vehicle Service",
    1,
    `${invoiceData.currency} ${booking.estimatedCost}`,
    `${invoiceData.currency} ${booking.estimatedCost}`,
  ]);

  // Bill Items
  if (booking.billItems && booking.billItems.length > 0) {
    booking.billItems.forEach((item) => {
      tableRows.push([
        item.description,
        1,
        `${invoiceData.currency} ${item.amount}`,
        `${invoiceData.currency} ${item.amount}`,
      ]);
    });
  }

  // Towing
  if (booking.towingRequested) {
    tableRows.push([
      "Towing Service",
      1,
      `${invoiceData.currency} ${booking.towingCost}`,
      `${invoiceData.currency} ${booking.towingCost}`,
    ]);
  }

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

  // Recalculate total based on rows for accuracy
  // But using booking.actualCost is safer as it's the final DB record

  doc.text(
    `Subtotal: ${invoiceData.currency} ${invoiceData.subtotal}`,
    rightMargin,
    finalY,
    { align: "right" }
  );

  let currentY = finalY + 7;
  doc.setFontSize(12);
  doc.setTextColor(255, 102, 68);
  doc.text(
    `Total: ${invoiceData.currency} ${invoiceData.total}`,
    rightMargin,
    currentY,
    { align: "right" }
  );

  // Payment Status
  if (booking.isPaid) {
    currentY += 15;
    doc.setFillColor(232, 245, 233); // Light green bg
    doc.rect(14, currentY, 180, 25, "F");

    doc.setFontSize(12);
    doc.setTextColor(40, 167, 69); // Green text
    doc.text(`PAID`, 20, currentY + 10);

    if (booking.updatedAt) {
      doc.setFontSize(10);
      doc.text(
        `Date: ${new Date(booking.updatedAt).toLocaleDateString()}`,
        20,
        currentY + 18
      );
    }
    if (invoiceData.paymentInfo?.transactionId) {
      doc.text(
        `TrxID: ${invoiceData.paymentInfo.transactionId}`,
        100,
        currentY + 18
      );
    } else if (booking.paymentMethod === "manual") {
      doc.text(`Method: Manual/Cash`, 100, currentY + 18);
    }
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Thank you for your business!", 105, pageHeight - 15, {
    align: "center",
  });

  // Save
  doc.save(`receipt-${booking.bookingNumber}.pdf`);
};
