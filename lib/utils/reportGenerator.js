import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";

/**
 * Generate CSV File from data
 */
export const downloadCSV = (data, filename) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle commas in strings
          return typeof value === "string" && value.includes(",")
            ? `"${value}"`
            : value;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate PDF Report
 */
export const downloadPDF = (title, sections = [], filename) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header -> Title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(title, pageWidth / 2, 20, { align: "center" });

  // Header -> Date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${format(new Date(), "PPP pp")}`, pageWidth / 2, 28, {
    align: "center",
  });

  let yPos = 40;

  sections.forEach((section) => {
    // Section Title
    if (section.title) {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0); // Black
      doc.text(section.title, 14, yPos);
      yPos += 10;
    }

    // Key Value Pairs (Metrics)
    if (section.metrics) {
      const startY = yPos;
      let xPos = 14;

      Object.entries(section.metrics).forEach(([key, value], index) => {
        // Simple metric text
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(`${key}: ${value}`, xPos, yPos);
        yPos += 7;
      });
      yPos += 5;
    }

    // Table Data
    if (section.table) {
      doc.autoTable({
        startY: yPos,
        head: [section.table.headers],
        body: section.table.rows,
        theme: "grid",
        headStyles: { fillColor: [66, 133, 244] }, // Blue header
        margin: { top: 10 },
      });
      yPos = doc.lastAutoTable.finalY + 15;
    }

    // Paragraph text
    if (section.text) {
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const splitText = doc.splitTextToSize(section.text, pageWidth - 28);
      doc.text(splitText, 14, yPos);
      yPos += splitText.length * 5 + 10;
    }
  });

  doc.save(`${filename}.pdf`);
};
