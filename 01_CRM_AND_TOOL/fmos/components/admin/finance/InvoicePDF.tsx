"use client";

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { gstBreakdown } from '@/lib/finance/gst';

const BRAND = '#42CA80';
const BRAND_DEEP = '#1E7A4F';
const BRAND_SOFT = '#ECFAF3';
const INK = '#0F172A';
const SLATE = '#64748B';
const SLATE_LIGHT = '#94A3B8';
const LINE = '#E2E8F0';

const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 100,
    paddingHorizontal: 0,
    fontSize: 9.5,
    fontFamily: 'Helvetica',
    color: '#334155',
    lineHeight: 1.5,
  },
  brandBar: {
    height: 6,
    backgroundColor: BRAND,
  },
  body: {
    paddingHorizontal: 48,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 36,
    marginBottom: 28,
  },
  brandName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: INK,
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  brandSubtitle: {
    fontSize: 8,
    color: SLATE,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  brandMeta: {
    fontSize: 8,
    color: SLATE_LIGHT,
    marginTop: 6,
  },
  invoiceTitle: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: INK,
    letterSpacing: 2,
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_DEEP,
    textAlign: 'right',
    marginTop: 4,
  },
  statusChip: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 3,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  /* Meta + billing band */
  infoBand: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 18,
    marginBottom: 28,
    gap: 24,
  },
  infoColumn: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: SLATE_LIGHT,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: INK,
  },
  infoSubvalue: {
    fontSize: 8.5,
    color: SLATE,
    marginTop: 1.5,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 8.5,
    color: SLATE,
  },
  dateValue: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: INK,
  },

  /* Table */
  table: {
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: INK,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableRowAlt: {
    backgroundColor: '#FAFBFC',
  },
  colDesc: { flex: 4 },
  colPrice: { flex: 1.4, textAlign: 'right' },
  cellDesc: {
    fontSize: 9.5,
    color: '#334155',
  },
  cellAmount: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: INK,
  },

  /* Summary */
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    marginBottom: 32,
  },
  summaryBox: {
    width: 220,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  summaryLabel: {
    fontSize: 9,
    color: SLATE,
  },
  summaryValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: INK,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: BRAND_SOFT,
    borderRadius: 4,
  },
  summaryTotalLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_DEEP,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryTotalValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_DEEP,
  },

  /* Payment panel */
  paymentPanel: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 6,
    padding: 16,
    gap: 24,
  },
  paymentColumn: {
    flex: 1,
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  paymentKey: {
    fontSize: 8.5,
    color: SLATE,
    width: 90,
  },
  paymentValue: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: INK,
  },
  termsText: {
    fontSize: 8.5,
    color: SLATE,
    lineHeight: 1.6,
  },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerInner: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: LINE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7.5,
    color: SLATE_LIGHT,
  },
  footerBrand: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_DEEP,
  },
});

interface BusinessSettings {
  business_name?: string;
  gstin?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  email?: string;
  phone?: string;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  ifsc?: string;
  gst_rate?: number;
  payment_terms_days?: number;
}

interface InvoicePDFProps {
  invoice: any;
  settings?: BusinessSettings;
}

const InvoicePDF = ({ invoice, settings }: InvoicePDFProps) => {
  const lineItems = invoice.invoice_line_items || [];
  const biz = {
    business_name: settings?.business_name || "FortuneMarq Media & Marketing",
    gstin: settings?.gstin || "29ICWPS9816Q1ZS",
    address_line1: settings?.address_line1 || "Galaxy Mall, Floor 1, Shop 43",
    address_line2: settings?.address_line2 || "JC Nagar",
    city: settings?.city || "Hubli",
    state: settings?.state || "Karnataka",
    pincode: settings?.pincode || "580020",
    email: settings?.email || "fortunemarq@gmail.com",
    phone: settings?.phone || "+91 93530 82656",
    bank_name: settings?.bank_name || "Karnataka Bank",
    account_name: settings?.account_name || "FortuneMarq Media & Marketing",
    account_number: settings?.account_number || "0332202500001101",
    ifsc: settings?.ifsc || "KARB0000332",
    gst_rate: settings?.gst_rate ?? 18,
    payment_terms_days: settings?.payment_terms_days || 15,
  };

  const gstLines = gstBreakdown(invoice.gst_amount, biz.gst_rate, !!invoice.is_interstate);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const status = (invoice.status || '').toLowerCase();
  const statusStyle =
    status === 'paid'
      ? { backgroundColor: BRAND_SOFT, color: BRAND_DEEP }
      : status === 'overdue'
        ? { backgroundColor: '#FEF2F2', color: '#DC2626' }
        : { backgroundColor: '#F1F5F9', color: SLATE };
  const statusText = status === 'paid' ? 'Paid' : status === 'overdue' ? 'Overdue' : 'Payment Due';

  return (
    <Document
      title={`Invoice ${invoice.invoice_number}`}
      author={biz.business_name}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.brandBar} fixed />

        <View style={styles.body}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.brandName}>{biz.business_name}</Text>
              <Text style={styles.brandSubtitle}>Digital Marketing Agency</Text>
              <Text style={styles.brandMeta}>GSTIN: {biz.gstin}</Text>
              <Text style={styles.brandMeta}>{biz.phone} · {biz.email}</Text>
            </View>
            <View>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
              <Text style={[styles.statusChip, statusStyle]}>{statusText}</Text>
            </View>
          </View>

          {/* Billing + dates band */}
          <View style={styles.infoBand}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>From</Text>
              <Text style={styles.infoValue}>{biz.business_name}</Text>
              <Text style={styles.infoSubvalue}>{biz.address_line1}</Text>
              <Text style={styles.infoSubvalue}>{biz.address_line2}, {biz.city} — {biz.pincode}</Text>
              <Text style={styles.infoSubvalue}>{biz.state}, India</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Billed To</Text>
              <Text style={styles.infoValue}>{invoice.clients?.business_name}</Text>
              {invoice.clients?.city ? (
                <Text style={styles.infoSubvalue}>{invoice.clients.city}</Text>
              ) : null}
              {invoice.clients?.email ? (
                <Text style={styles.infoSubvalue}>{invoice.clients.email}</Text>
              ) : null}
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Details</Text>
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Issued</Text>
                <Text style={styles.dateValue}>{formatDate(invoice.issue_date)}</Text>
              </View>
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Due</Text>
                <Text style={styles.dateValue}>{formatDate(invoice.due_date)}</Text>
              </View>
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Terms</Text>
                <Text style={styles.dateValue}>Net {biz.payment_terms_days} days</Text>
              </View>
            </View>
          </View>

          {/* Line items */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
              <Text style={[styles.tableHeaderText, styles.colPrice]}>Amount</Text>
            </View>
            {lineItems.map((item: any, i: number) => (
              <View
                key={i}
                style={i % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
                wrap={false}
              >
                <Text style={[styles.cellDesc, styles.colDesc]}>{item.description}</Text>
                <Text style={[styles.cellAmount, styles.colPrice]}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
          </View>

          {/* Summary */}
          <View style={styles.summarySection}>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatCurrency(invoice.subtotal)}</Text>
              </View>
              {(invoice.gst_amount || 0) > 0 &&
                gstLines.map((line: { label: string; amount: number }) => (
                  <View key={line.label} style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{line.label}</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(line.amount)}</Text>
                  </View>
                ))}
              <View style={styles.summaryTotalRow}>
                <Text style={styles.summaryTotalLabel}>Total Due</Text>
                <Text style={styles.summaryTotalValue}>{formatCurrency(invoice.total_amount)}</Text>
              </View>
            </View>
          </View>

          {/* Payment details */}
          <View style={styles.paymentPanel} wrap={false}>
            <View style={styles.paymentColumn}>
              <Text style={styles.infoLabel}>Pay By Bank Transfer</Text>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentKey}>Bank</Text>
                <Text style={styles.paymentValue}>{biz.bank_name}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentKey}>Account Name</Text>
                <Text style={styles.paymentValue}>{biz.account_name}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentKey}>Account No.</Text>
                <Text style={styles.paymentValue}>{biz.account_number}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentKey}>IFSC</Text>
                <Text style={styles.paymentValue}>{biz.ifsc}</Text>
              </View>
            </View>
            <View style={styles.paymentColumn}>
              <Text style={styles.infoLabel}>Terms & Notes</Text>
              <Text style={styles.termsText}>
                Please settle this invoice within {biz.payment_terms_days} days of the issue date.
                Quote the invoice number {invoice.invoice_number} as the payment reference.
              </Text>
              <Text style={[styles.termsText, { marginTop: 6 }]}>
                Questions? Write to {biz.email} or call {biz.phone}.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerInner}>
            <Text style={styles.footerText}>
              {biz.business_name} · {biz.city}, {biz.state} · GSTIN {biz.gstin}
            </Text>
            <Text style={styles.footerBrand}>Thank you for your business</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
