"use client";

import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register fallback fonts if needed, but standard ones are safe.
// Font.register({ family: 'Helvetica', fontWeight: 'normal' });

const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#334155',
    lineHeight: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: 'column',
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    letterSpacing: -1,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  invoiceDetails: {
    textAlign: 'right',
  },
  invoiceLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  invoiceInfo: {
    fontSize: 10,
    color: '#64748b',
  },
  billingSection: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 40,
  },
  billingColumn: {
    flex: 1,
  },
  billingLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  billingValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  billingSubvalue: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  table: {
    marginBottom: 40,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomV: 1,
    borderBottomColor: '#e2e8f0',
    padding: '8 12',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#f1f5f9',
    padding: '12 12',
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  summaryBox: {
    width: 200,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 10,
    borderTop: 2,
    borderTopColor: '#1e293b',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  summaryTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  footer: {
    marginTop: 60,
    borderTop: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 20,
  },
  footerTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#64748b',
    lineHeight: 1.8,
  },
});

interface InvoicePDFProps {
  invoice: any;
}

const InvoicePDF = ({ invoice }: InvoicePDFProps) => {
  const lineItems = invoice.invoice_line_items || [];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.brandName}>FortuneMarq</Text>
            <Text style={styles.brandSubtitle}>Agency Operations</Text>
            <Text style={[styles.brandSubtitle, { marginTop: 4, letterSpacing: 0, color: '#94a3b8' }]}>GST: 29AAAAA0000A1Z5 (Mock)</Text>
          </View>
          <View style={styles.invoiceDetails}>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceInfo}>Reference: {invoice.invoice_number}</Text>
            <Text style={styles.invoiceInfo}>Issued: {new Date(invoice.issue_date).toLocaleDateString()}</Text>
            <Text style={styles.invoiceInfo}>Due Date: {new Date(invoice.due_date).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Billing */}
        <View style={styles.billingSection}>
          <View style={styles.billingColumn}>
            <Text style={styles.billingLabel}>Bill From</Text>
            <Text style={styles.billingValue}>FortuneMarq Solutions LLP</Text>
            <Text style={styles.billingSubvalue}>#123 Innovation Hub, MG Road</Text>
            <Text style={styles.billingSubvalue}>Bangalore, Karnataka 560001</Text>
            <Text style={styles.billingSubvalue}>billing@fortunemarq.com</Text>
          </View>
          <View style={styles.billingColumn}>
            <Text style={styles.billingLabel}>Bill To</Text>
            <Text style={styles.billingValue}>{invoice.clients?.business_name}</Text>
            <Text style={styles.billingSubvalue}>{invoice.clients?.city || "Office HQ"}</Text>
            <Text style={styles.billingSubvalue}>{invoice.clients?.email || "N/A"}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Amount</Text>
          </View>
          {lineItems.map((item: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
          {/* If no line items, fallback to a single row from main invoice if necessary, 
              but usually invoice_line_items will be there. */}
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST (18%)</Text>
              <Text style={styles.summaryValue}>{formatCurrency(invoice.gst_amount)}</Text>
            </View>
            <View style={styles.summaryTotalRow}>
              <Text style={[styles.summaryLabel, { fontWeight: 'bold' }]}>TOTAL (INR)</Text>
              <Text style={styles.summaryTotalValue}>{formatCurrency(invoice.total_amount)}</Text>
            </View>
          </View>
        </View>

        {/* Footer / Instructions */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Payment Instructions</Text>
          <Text style={styles.footerText}>Bank: HDFC Bank Ltd</Text>
          <Text style={styles.footerText}>Account Name: FortuneMarq Solutions LLP</Text>
          <Text style={styles.footerText}>Account Number: 50200012345678 (Mock)</Text>
          <Text style={styles.footerText}>IFSC: HDFC0001234</Text>
          <Text style={[styles.footerText, { marginTop: 10 }]}>Terms: Please pay within 15 days of issue date. For any queries, contact support@fortunemarq.com.</Text>
        </View>

      </Page>
    </Document>
  );
};

export default InvoicePDF;
