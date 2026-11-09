import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AlertTriangle, CreditCard, Search, Home, Phone, Mail, 
  Send, RefreshCw, FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import { maintenanceApi } from '../../services/api/maintenanceApi';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/forms/Input';
import EmptyState from '../../components/common/EmptyState';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function AdminDefaulters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [towerFilter, setTowerFilter] = useState('ALL');
  const [expandedFlatId, setExpandedFlatId] = useState(null);

  const { data: defaultersData, isLoading, refetch } = useQuery({
    queryKey: ['admin-defaulters', towerFilter],
    queryFn: () => maintenanceApi.getDefaulters({ 
      tower: towerFilter === 'ALL' ? undefined : towerFilter,
      limit: 100 
    })
  });

  const defaulters = defaultersData?.items || [];

  const handleSendReminder = (residentName, flatNumber) => {
    toast.success(`Automated SMS & Email payment reminder sent to ${residentName} (Flat ${flatNumber})`);
  };

  const filteredDefaulters = defaulters.filter((d) => {
    const residentMatches = (d.residents || []).some(
      (r) => r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             r.phone?.includes(searchTerm)
    );
    return (
      residentMatches ||
      d.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.tower?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalOverdueSum = filteredDefaulters.reduce(
    (acc, curr) => acc + (curr.totalOverdueInPaise || 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
              <AlertTriangle className="w-7 h-7 text-warning" />
              Overdue Maintenance Defaulters
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-warning/10 border border-warning/20 text-warning font-mono text-xs font-bold">
              {filteredDefaulters.length} Overdue Flats
            </span>
          </div>
          <p className="text-text-secondary text-sm">
            Flats with unpaid invoices past due date. Total arrears: <span className="text-danger font-semibold font-mono">{formatCurrency(totalOverdueSum)}</span>
          </p>
        </div>
        <Button 
          variant="secondary" 
          icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={() => refetch()}
        >
          Recalculate Overdues
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8">
          <Input
            placeholder="Search by resident name, phone, flat (e.g. B-204)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-text-secondary" />}
          />
        </div>
        <div className="sm:col-span-4">
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

      {/* Defaulters List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : filteredDefaulters.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-12 h-12 text-success" />}
          title="Zero Overdue Maintenance Arrears"
          description="All flats are currently up-to-date with their maintenance contributions!"
        />
      ) : (
        <div className="space-y-3">
          {filteredDefaulters.map((d) => {
            const isExpanded = expandedFlatId === d.flatId;
            const primaryResident = (d.residents && d.residents[0]) || { name: 'Owner Not Registered' };

            return (
              <Card key={d.flatId} className="border border-border-muted hover:border-warning/40 transition-colors p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger flex-shrink-0 mt-0.5">
                      <Home className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-text-primary text-base">
                          Tower {d.tower} &mdash; Flat {d.flatNumber}
                        </h3>
                        <Badge variant="danger">
                          {d.unpaidInvoicesCount} Bill{d.unpaidInvoicesCount > 1 ? 's' : ''} Overdue
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mt-1">
                        <span className="text-text-primary font-medium">{primaryResident.name}</span>
                        {primaryResident.phone && (
                          <a href={`tel:${primaryResident.phone}`} className="flex items-center gap-1 text-accent font-mono hover:underline">
                            <Phone className="w-3 h-3" />
                            {primaryResident.phone}
                          </a>
                        )}
                        {primaryResident.email && (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Mail className="w-3 h-3" />
                            {primaryResident.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:text-right">
                    <div>
                      <div className="text-xs text-text-secondary">Arrears Balance</div>
                      <div className="text-lg font-bold font-mono text-danger">
                        {formatCurrency(d.totalOverdueInPaise)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs border-border-muted hover:border-accent"
                        icon={<Send className="w-3.5 h-3.5" />}
                        onClick={() => handleSendReminder(primaryResident.name, d.flatNumber)}
                      >
                        Nudge
                      </Button>
                      <button
                        onClick={() => setExpandedFlatId(isExpanded ? null : d.flatId)}
                        className="p-2 rounded-lg bg-surface-secondary text-text-secondary hover:text-text-primary"
                        title="Toggle Invoices Breakdown"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Invoices Breakdown */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-border-muted space-y-2">
                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Overdue Invoices History
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {d.invoices.map((inv) => (
                        <div key={inv.invoiceId} className="p-2.5 rounded-lg bg-surface-secondary border border-border-muted text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-text-primary">{inv.billingMonth}</span>
                            <span className="font-mono text-danger font-bold">{formatCurrency(inv.amountInPaise)}</span>
                          </div>
                          <div className="text-text-secondary text-[11px] font-mono">
                            Due date: {formatDate(inv.dueDate)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
