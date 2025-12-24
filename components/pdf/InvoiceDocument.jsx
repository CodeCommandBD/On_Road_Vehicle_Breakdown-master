import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  companyName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e85d04", // Orange-600
  },
  companyDetails: {
    fontSize: 10,
    color: "#555",
    marginTop: 4,
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    textTransform: "uppercase",
  },
  invoiceInfo: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    color: "#777",
    width: 60,
    textAlign: "right",
    marginRight: 10,
  },
  value: {
    fontSize: 10,
    color: "#333",
    fontWeight: "bold",
  },
  billTo: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  billText: {
    fontSize: 10,
    color: "#555",
    lineHeight: 1.5,
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: "#e0e0e0",
    marginTop: 20,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableColHeader: {
    width: "75%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: "#e0e0e0",
    backgroundColor: "#f9f9f9",
    padding: 8,
  },
  tableColHeaderAmount: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: "#e0e0e0",
    backgroundColor: "#f9f9f9",
    padding: 8,
  },
  tableCol: {
    width: "75%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: "#e0e0e0",
    padding: 8,
  },
  tableColAmount: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: "#e0e0e0",
    padding: 8,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#333",
  },
  tableCell: {
    fontSize: 10,
    color: "#555",
  },
  totalSection: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 4,
  },
  totalLabel: {
    width: 100,
    fontSize: 10,
    color: "#777",
    textAlign: "right",
    marginRight: 10,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    textAlign: "right",
    width: 80,
  },
  grandTotal: {
    fontSize: 14,
    color: "#e85d04",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    textAlign: "center",
    color: "#aaa",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
});

const InvoiceDocument = ({ payment, user }) => {
  const invoiceDate = new Date(payment.createdAt).toLocaleDateString();
  const invoiceNumber = `INV-${payment._id.substring(0, 8).toUpperCase()}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>On-Road Help</Text>
            <Text style={styles.companyDetails}>Dhaka, Bangladesh</Text>
            <Text style={styles.companyDetails}>support@onroadhelp.com</Text>
            <Text style={styles.companyDetails}>+880 1XXX-XXXXXX</Text>
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Invoice No:</Text>
              <Text style={styles.value}>{invoiceNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Date:</Text>
              <Text style={styles.value}>{invoiceDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Status:</Text>
              <Text style={[styles.value, { color: "green" }]}>PAID</Text>
            </View>
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.billTo}>
          <Text style={styles.sectionTitle}>Bill To:</Text>
          <Text style={styles.billText}>{user?.name || "Valued Customer"}</Text>
          <Text style={styles.billText}>{user?.email || ""}</Text>
          <Text style={styles.billText}>{user?.phone || ""}</Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Description</Text>
            </View>
            <View style={styles.tableColHeaderAmount}>
              <Text style={[styles.tableCellHeader, { textAlign: "right" }]}>
                Amount
              </Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>
                {payment.metadata?.description || "Service Payment"}
              </Text>
              <Text style={[styles.tableCell, { fontSize: 8, color: "#999" }]}>
                Transaction ID: {payment.sslcommerz?.transactionId || "N/A"}
              </Text>
            </View>
            <View style={styles.tableColAmount}>
              <Text style={[styles.tableCell, { textAlign: "right" }]}>
                BDT {payment.amount}
              </Text>
            </View>
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>BDT {payment.amount}</Text>
            </View>
            <View style={[styles.totalRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.totalLabel, styles.grandTotal]}>Total:</Text>
              <Text style={[styles.totalValue, styles.grandTotal]}>
                BDT {payment.amount}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This is a computer-generated invoice and valid without signature.
          Thank you for choosing On-Road Vehicle Breakdown Assistance.
        </Text>
      </Page>
    </Document>
  );
};

export default InvoiceDocument;
