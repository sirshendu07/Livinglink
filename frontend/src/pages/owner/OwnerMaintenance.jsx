import React, { useState, useEffect } from 'react';
import { CreditCard, Download, Receipt, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/forms/Input';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { maintenanceApi } from '../../services/api/maintenanceApi';
import { paymentApi } from '../../services/api/paymentApi';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const OwnerMaintenance = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pay Modal State
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentPassphrase, setPaymentPassphrase] = useState('LivingLinkDemoPay2026!');
  const [payLoading, setPayLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchInvoices = async () => {
    try {
      const data = await maintenanceApi.getMyInvoices({ limit: 50 });
      setInvoices(data?.items || []);
    } catch {
      toast.error('Failed to load maintenance bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleOpenPay = (inv) => {
    setSelectedInvoice(inv);
    setIsPayModalOpen(true);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setPayLoading(true);
    try {
      const idempotencyKey = `maint-pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      await paymentApi.payMaintenance({
        invoiceId: selectedInvoice._id,
        paymentPassphrase,
        idempotencyKey
      });

      toast.success('Maintenance bill paid successfully! Receipt generated.');
      setIsPayModalOpen(false);
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment simulation failed');
    } finally {
      setPayLoading(false);
    }
  };

  const handleDownloadReceipt = async (inv) => {
    if (!inv.payment?._id && !inv.payment) {
      toast.error('No receipt available for unpaid invoice');
      return;
    }

    const paymentId = inv.payment?._id || inv.payment;
    setDownloadingId(inv._id);
    try {
      await paymentApi.downloadReceipt(paymentId, inv.invoiceNumber);
      toast.success('PDF receipt downloaded');
    } catch {
      toast.error('Failed to download receipt PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const totalDuesInPaise = invoices
    .filter((inv) => inv.status === 'UNPAID' || inv.status === 'OVERDUE')
    .reduce((acc, curr) => acc + (curr.amountInPaise - (curr.waiverAmountInPaise || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-muted">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">Maintenance & Invoices</h2>
          <p className="text-xs text-text-secondary mt-1">
            Review monthly society maintenance charges, pay dues, and download official receipts.
          </p>
        </div>

        {totalDuesInPaise > 0 && (
          <div className="p-3 px-4 rounded-xl bg-status-danger/10 border border-status-danger/30 flex items-center gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-status-danger tracking-wider block">Total Outstanding Dues</span>
              <span className="text-base font-bold text-status-danger">{formatCurrency(totalDuesInPaise)}</span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <Loader message="Loading invoices..." />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No maintenance invoices"
          description="Your flat currently has no issued maintenance bills."
        />
      ) : (
        <div className="space-y-4">
          {invoices.map((inv) => {
            const isPaid = inv.status === 'PAID';
            const netAmountInPaise = inv.amountInPaise - (inv.waiverAmountInPaise || 0);

            return (
              <Card key={inv._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-primary">Invoice #{inv.invoiceNumber}</span>
                    <Badge status={inv.status} />
                  </div>

                  <p className="text-xs text-text-secondary">
                    Billing Month: <span className="text-text-primary font-medium">{inv.billingMonth}</span> • Due Date: {formatDate(inv.dueDate)}
                  </p>

                  {inv.waiverAmountInPaise > 0 && (
                    <p className="text-[11px] text-accent">
                      Adjustment / Waiver applied: -{formatCurrency(inv.waiverAmountInPaise)} ({inv.waiverReason})
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-border-muted/60">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-text-secondary uppercase tracking-wider block">Payable Amount</span>
                    <span className="text-base font-bold text-text-primary">{formatCurrency(netAmountInPaise)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPaid ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={Download}
                        loading={downloadingId === inv._id}
                        onClick={() => handleDownloadReceipt(inv)}
                      >
                        Receipt (PDF)
                      </Button>
                    ) : (
                      <Button size="sm" variant="primary" icon={CreditCard} onClick={() => handleOpenPay(inv)}>
                        Pay Bill
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pay Maintenance Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Pay Maintenance Bill"
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePaySubmit} className="space-y-4">
          <div className="p-4 rounded-xl bg-bg-elevated border border-border-muted space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-text-secondary">Invoice Number:</span>
              <span className="font-semibold text-text-primary">#{selectedInvoice?.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Billing Month:</span>
              <span className="font-semibold text-text-primary">{selectedInvoice?.billingMonth}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border-muted/60 text-sm">
              <span className="font-bold text-text-primary">Total Payable:</span>
              <span className="font-bold text-accent">
                {formatCurrency(
                  (selectedInvoice?.amountInPaise || 0) - (selectedInvoice?.waiverAmountInPaise || 0)
                )}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-status-warning/10 border border-status-warning/30 text-[11px] text-status-warning">
            ⚠️ <strong>Demo Simulation Mode:</strong> Enter the payment secret to mark this invoice paid and generate an official PDFKit receipt.
          </div>

          <Input
            label="Demo Payment Passphrase"
            type="password"
            value={paymentPassphrase}
            onChange={(e) => setPaymentPassphrase(e.target.value)}
            placeholder="LivingLinkDemoPay2026!"
            required
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsPayModalOpen(false)} disabled={payLoading}>
              Cancel
            </Button>
            <Button type="submit" loading={payLoading}>
              Confirm Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OwnerMaintenance;
