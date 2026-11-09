import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CreditCard, Plus, Layers, Search, Filter, Download, 
  CheckCircle2, Clock, AlertTriangle, ShieldAlert, RefreshCw, FileText
} from 'lucide-react';
import { maintenanceApi } from '../../services/api/maintenanceApi';
import { paymentApi } from '../../services/api/paymentApi';
import { userApi } from '../../services/api/userApi';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/forms/Input';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function AdminMaintenance() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [towerFilter, setTowerFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [waiverInvoice, setWaiverInvoice] = useState(null);

  // Bulk Invoice Form State
  const [bulkMonth, setBulkMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [bulkAmountRupees, setBulkAmountRupees] = useState('3500');
  const [bulkDueDate, setBulkDueDate] = useState('');
  const [bulkTower, setBulkTower] = useState('');

  // Single Invoice Form State
  const [singleFlatId, setSingleFlatId] = useState('');
  const [singleMonth, setSingleMonth] = useState(new Date().toISOString().slice(0, 7));
  const [singleAmountRupees, setSingleAmountRupees] = useState('3500');
  const [singleDueDate, setSingleDueDate] = useState('');

  // Waiver Form State
  const [waiverAmountRupees, setWaiverAmountRupees] = useState('');
  const [waiverReason, setWaiverReason] = useState('');

  // Invoices Query
  const { data: invoicesData, isLoading, refetch } = useQuery({
    queryKey: ['admin-invoices', statusFilter, towerFilter],
    queryFn: () => maintenanceApi.getAllAdmin({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      tower: towerFilter === 'ALL' ? undefined : towerFilter,
      limit: 100
    })
  });

  // Flats query for single invoice creation
  const { data: flatsData } = useQuery({
    queryKey: ['admin-flats-selection'],
    queryFn: () => userApi.getFlats({ limit: 100 }),
    enabled: isSingleModalOpen
  });

  const invoices = invoicesData?.items || [];
  const flats = flatsData?.items || [];

  // Bulk Invoice Mutation
  const bulkMutation = useMutation({
    mutationFn: (data) => maintenanceApi.generateBulkInvoices(data),
    onSuccess: (res) => {
      toast.success(`Generated ${res.generatedCount} invoices for cycle ${res.billingMonth}!`);
      setIsBulkModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to generate bulk invoices');
    }
  });

  // Single Invoice Mutation
  const singleMutation = useMutation({
    mutationFn: (data) => maintenanceApi.createInvoice(data),
    onSuccess: () => {
      toast.success('Invoice created successfully!');
      setIsSingleModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create invoice');
    }
  });

  // Waiver Mutation
  const waiverMutation = useMutation({
    mutationFn: ({ invoiceId, data }) => maintenanceApi.recordWaiver(invoiceId, data),
    onSuccess: () => {
      toast.success('Waiver/Adjustment applied successfully!');
      setWaiverInvoice(null);
      setWaiverAmountRupees('');
      setWaiverReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to record waiver');
    }
  });

  const handleBulkSubmit = (e) => {
    e.preventDefault();
    if (!bulkDueDate) return toast.error('Please pick a due date');
    bulkMutation.mutate({
      billingMonth: bulkMonth,
      amountInPaise: Math.round(Number(bulkAmountRupees) * 100),
      dueDate: new Date(bulkDueDate).toISOString(),
      tower: bulkTower ? bulkTower : undefined
    });
  };

  const handleSingleSubmit = (e) => {
    e.preventDefault();
    if (!singleFlatId) return toast.error('Please select a target flat');
    if (!singleDueDate) return toast.error('Please pick a due date');
    singleMutation.mutate({
      flatId: singleFlatId,
      billingMonth: singleMonth,
      amountInPaise: Math.round(Number(singleAmountRupees) * 100),
      dueDate: new Date(singleDueDate).toISOString()
    });
  };

  const handleWaiverSubmit = (e) => {
    e.preventDefault();
    if (!waiverAmountRupees || Number(waiverAmountRupees) <= 0) {
      return toast.error('Enter valid waiver amount');
    }
    if (waiverReason.trim().length < 5) {
      return toast.error('Reason must be at least 5 characters');
    }
    waiverMutation.mutate({
      invoiceId: waiverInvoice._id,
      data: {
        waiverAmountInPaise: Math.round(Number(waiverAmountRupees) * 100),
        reason: waiverReason.trim()
      }
    });
  };

  const handleDownloadReceipt = async (paymentId) => {
    try {
      toast.loading('Generating official receipt...', { id: 'receipt' });
      const blob = await paymentApi.downloadReceipt(paymentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt-${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Receipt downloaded', { id: 'receipt' });
    } catch (err) {
      toast.error('Failed to download receipt', { id: 'receipt' });
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const flatNo = inv.flat?.flatNumber?.toLowerCase() || '';
    const tower = inv.flat?.tower?.toLowerCase() || '';
    const invoiceNo = inv.invoiceNumber?.toLowerCase() || '';
    const month = inv.billingMonth?.toLowerCase() || '';
    const query = searchTerm.toLowerCase();
    return flatNo.includes(query) || tower.includes(query) || invoiceNo.includes(query) || month.includes(query);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success">Paid</Badge>;
      case 'OVERDUE':
        return <Badge variant="danger" className="animate-pulse">Overdue</Badge>;
      case 'UNPAID':
        return <Badge variant="warning">Unpaid</Badge>;
      case 'WAIVED':
        return <Badge variant="info">Waived</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-accent" />
            Society Maintenance Invoicing & Financials
          </h1>
          <p className="text-text-secondary text-sm">
            Generate monthly billing demands, record audited fee waivers, and inspect receipts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="secondary" 
            icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button 
            variant="secondary" 
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsSingleModalOpen(true)}
          >
            Single Invoice
          </Button>
          <Button 
            variant="primary" 
            icon={<Layers className="w-4 h-4" />}
            onClick={() => setIsBulkModalOpen(true)}
          >
            Bulk Generate Demand
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6">
          <Input
            placeholder="Search by invoice #, flat (e.g. A-101), or month..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-text-secondary" />}
          />
        </div>
        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-surface-card border border-border-muted rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
        <div className="sm:col-span-3">
          <select
            value={towerFilter}
            onChange={(e) => setTowerFilter(e.target.value)}
            className="w-full bg-surface-card border border-border-muted rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Towers</option>
            <option value="A">Tower A</option>
            <option value="B">Tower B</option>
            <option value="C">Tower C</option>
            <option value="D">Tower D</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-12 h-12 text-text-secondary" />}
          title="No maintenance invoices found"
          description="Click 'Bulk Generate Demand' to raise society dues for all residents."
        />
      ) : (
        <div className="bg-surface-card border border-border-muted rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary text-text-secondary uppercase tracking-wider text-[11px] border-b border-border-muted">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Invoice #</th>
                  <th className="py-3.5 px-4 font-semibold">Flat Location</th>
                  <th className="py-3.5 px-4 font-semibold">Billing Cycle</th>
                  <th className="py-3.5 px-4 font-semibold">Amount (₹)</th>
                  <th className="py-3.5 px-4 font-semibold">Due Date</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted/50 text-text-secondary">
                {filteredInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-text-primary">
                      {inv.invoiceNumber}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-text-primary">
                      Tower {inv.flat?.tower} &mdash; Flat {inv.flat?.flatNumber}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {inv.billingMonth}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-text-primary">
                      {formatCurrency(inv.amountInPaise)}
                      {inv.waiverAmountInPaise > 0 && (
                        <span className="block text-[10px] text-accent font-normal">
                          (-{formatCurrency(inv.waiverAmountInPaise)} waiver)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {formatDate(inv.dueDate)}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(inv.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.status === 'PAID' && inv.payment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-accent hover:underline flex items-center gap-1"
                            onClick={() => handleDownloadReceipt(inv.payment._id || inv.payment)}
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </Button>
                        )}

                        {inv.status !== 'PAID' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs border-border-muted hover:border-warning hover:text-warning"
                            onClick={() => {
                              setWaiverInvoice(inv);
                              setWaiverAmountRupees('');
                              setWaiverReason('');
                            }}
                          >
                            Apply Waiver
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Generate Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Generate Bulk Society Maintenance Demand"
      >
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <p className="text-xs text-text-secondary">
            This will automatically create maintenance bills for all occupied flats in the designated sector.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Billing Month (YYYY-MM) *</label>
              <Input
                type="month"
                value={bulkMonth}
                onChange={(e) => setBulkMonth(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Amount per Flat (₹) *</label>
              <Input
                type="number"
                value={bulkAmountRupees}
                onChange={(e) => setBulkAmountRupees(e.target.value)}
                required
                min="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Payment Due Date *</label>
              <Input
                type="date"
                value={bulkDueDate}
                onChange={(e) => setBulkDueDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Tower Filter (Optional)</label>
              <select
                value={bulkTower}
                onChange={(e) => setBulkTower(e.target.value)}
                className="w-full bg-surface-secondary border border-border-muted rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent"
              >
                <option value="">All Towers (Whole Society)</option>
                <option value="A">Tower A</option>
                <option value="B">Tower B</option>
                <option value="C">Tower C</option>
                <option value="D">Tower D</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border-muted">
            <Button type="button" variant="ghost" onClick={() => setIsBulkModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={bulkMutation.isPending}>
              Generate Cycle Invoices
            </Button>
          </div>
        </form>
      </Modal>

      {/* Single Invoice Modal */}
      <Modal
        isOpen={isSingleModalOpen}
        onClose={() => setIsSingleModalOpen(false)}
        title="Raise Individual Flat Invoice"
      >
        <form onSubmit={handleSingleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Target Flat *</label>
            <select
              value={singleFlatId}
              onChange={(e) => setSingleFlatId(e.target.value)}
              required
              className="w-full bg-surface-secondary border border-border-muted rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent"
            >
              <option value="">Select Flat...</option>
              {flats.map((f) => (
                <option key={f._id} value={f._id}>
                  Tower {f.tower} - {f.flatNumber} {f.residents?.[0] ? `(${f.residents[0].name})` : '(Vacant)'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Billing Month *</label>
              <Input
                type="month"
                value={singleMonth}
                onChange={(e) => setSingleMonth(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Amount (₹) *</label>
              <Input
                type="number"
                value={singleAmountRupees}
                onChange={(e) => setSingleAmountRupees(e.target.value)}
                required
                min="50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Due Date *</label>
            <Input
              type="date"
              value={singleDueDate}
              onChange={(e) => setSingleDueDate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border-muted">
            <Button type="button" variant="ghost" onClick={() => setIsSingleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={singleMutation.isPending}>
              Create Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Waiver Modal */}
      <Modal
        isOpen={!!waiverInvoice}
        onClose={() => setWaiverInvoice(null)}
        title={`Apply Waiver / Adjustment — Invoice ${waiverInvoice?.invoiceNumber}`}
      >
        <form onSubmit={handleWaiverSubmit} className="space-y-4">
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-xl text-warning text-xs">
            Total Billed: <strong>{formatCurrency(waiverInvoice?.amountInPaise || 0)}</strong>.
            Applying a full waiver will mark this invoice as PAID in the system ledger.
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Waiver Amount (₹) *</label>
            <Input
              type="number"
              value={waiverAmountRupees}
              onChange={(e) => setWaiverAmountRupees(e.target.value)}
              placeholder="e.g. 500 or full invoice value"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Audited Justification / Reason *</label>
            <textarea
              value={waiverReason}
              onChange={(e) => setWaiverReason(e.target.value)}
              placeholder="e.g. Resident served on committee / plumbing damage discount approved by RWA..."
              rows={3}
              required
              className="w-full bg-surface-secondary border border-border-muted rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border-muted">
            <Button type="button" variant="ghost" onClick={() => setWaiverInvoice(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={waiverMutation.isPending}>
              Record Audited Waiver
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
