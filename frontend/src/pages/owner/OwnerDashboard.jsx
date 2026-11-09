import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Dumbbell,
  AlertCircle,
  Users,
  Bell,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card, { CardHeader } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import NoticeBanner from '../../components/ui/NoticeBanner';
import { noticeApi } from '../../services/api/noticeApi';
import { maintenanceApi } from '../../services/api/maintenanceApi';
import { visitorApi } from '../../services/api/visitorApi';
import { complaintApi } from '../../services/api/complaintApi';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const OwnerDashboard = () => {
  const { user } = useAuth();
  const [urgentNotice, setUrgentNotice] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [pendingVisitors, setPendingVisitors] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [noticeData, maintData, visitorData, complaintData] = await Promise.all([
          noticeApi.getPublished({ limit: 5 }),
          maintenanceApi.getMyInvoices({ limit: 3 }),
          visitorApi.getMyRequests({ status: 'PENDING', limit: 5 }),
          complaintApi.getMyComplaints({ limit: 5 })
        ]);

        const urgent = noticeData?.items?.find((n) => n.category === 'URGENT');
        setUrgentNotice(urgent || null);
        setInvoices(maintData?.items || []);
        setPendingVisitors(visitorData?.items || []);
        setComplaints(complaintData?.items || []);
      } catch {
        // Handle gracefully
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const hasUnpaidInvoice = invoices.some((i) => i.status === 'UNPAID' || i.status === 'OVERDUE');

  return (
    <div className="space-y-6">
      {/* Top Banner & Resident Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-muted/60">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">
            {user?.flat ? `${user.flat.tower} • Flat ${user.flat.flatNumber}` : 'Resident Portal'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mt-0.5">
            Good day, {user?.name}
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Society operations are normal. Check your maintenance status and gate approvals below.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/owner/maintenance">
            <Button size="sm" variant={hasUnpaidInvoice ? 'danger' : 'secondary'} icon={CreditCard}>
              {hasUnpaidInvoice ? 'Pay Maintenance Dues' : 'View Maintenance'}
            </Button>
          </Link>
          <Link to="/owner/visitors">
            <Button size="sm" variant="primary" icon={Users}>
              Visitor Gate
            </Button>
          </Link>
        </div>
      </div>

      {/* Urgent Society Notice Alert Banner */}
      {urgentNotice && <NoticeBanner notice={urgentNotice} linkTo="/owner/notices" />}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Maintenance Status"
          value={hasUnpaidInvoice ? 'Dues Pending' : 'Clear'}
          subtitle={hasUnpaidInvoice ? 'Action required for amenity access' : 'No overdue bills'}
          icon={CreditCard}
        />
        <StatCard
          title="Gate Approvals"
          value={pendingVisitors.length}
          subtitle={pendingVisitors.length > 0 ? 'Visitors waiting at gate' : 'No pending gate requests'}
          icon={Users}
        />
        <StatCard
          title="My Complaints"
          value={complaints.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length}
          subtitle="Active tickets in progress"
          icon={AlertCircle}
        />
        <StatCard
          title="Society Notices"
          value="Updated"
          subtitle="Check board for circulars"
          icon={Bell}
        />
      </div>

      {/* Two Column Grid: Pending Approvals & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Visitor Approvals (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Pending Gate Visitors"
              subtitle="Real-time arrivals waiting at society security gates"
              action={
                <Link to="/owner/visitors" className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold">
                  <span>Manage All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />

            {pendingVisitors.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border-muted rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-status-success mx-auto mb-2 opacity-80" />
                <h5 className="text-xs font-semibold text-text-primary">No visitors waiting at the gate</h5>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  When a delivery partner, guest, or cab arrives, approval requests will appear here instantly.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingVisitors.map((vis) => (
                  <div
                    key={vis._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-bg-elevated border border-border-muted gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-primary">{vis.visitorName}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/25">
                          {vis.category}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-1">
                        Purpose: {vis.purpose || 'General Visit'} • Code: {vis.visitorCode}
                      </p>
                    </div>

                    <Link to="/owner/visitors">
                      <Button size="sm" variant="primary">
                        Review & Respond
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Invoices Card */}
          <Card>
            <CardHeader
              title="Recent Maintenance Bills"
              subtitle="Society dues and utility billing history"
              action={
                <Link to="/owner/maintenance" className="text-xs text-accent hover:underline font-semibold">
                  All Invoices
                </Link>
              }
            />

            <div className="divide-y divide-border-muted/50">
              {invoices.length === 0 ? (
                <p className="text-xs text-text-secondary py-4 text-center">No invoice records generated yet.</p>
              ) : (
                invoices.map((inv) => (
                  <div key={inv._id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-text-primary">Invoice #{inv.invoiceNumber}</p>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        Billing Month: {inv.billingMonth} • Due: {formatDate(inv.dueDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-text-primary">{formatCurrency(inv.amountInPaise)}</p>
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded mt-0.5 ${
                          inv.status === 'PAID'
                            ? 'bg-status-success/15 text-status-success'
                            : 'bg-status-danger/15 text-status-danger'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Quick Shortcuts & Society Services */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Quick Actions" subtitle="Resident shortcuts" />
            <div className="grid grid-cols-1 gap-2.5">
              <Link
                to="/owner/amenities"
                className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated border border-border-muted hover:border-accent/40 transition-colors"
              >
                <div className="p-2 rounded-lg bg-accent/15 text-accent">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-text-primary">Amenities & Digital Pass</h5>
                  <p className="text-[11px] text-text-secondary">Gym & Games room subscriptions</p>
                </div>
              </Link>

              <Link
                to="/owner/complaints"
                className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated border border-border-muted hover:border-accent/40 transition-colors"
              >
                <div className="p-2 rounded-lg bg-status-info/15 text-status-info">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-text-primary">Raise a Complaint</h5>
                  <p className="text-[11px] text-text-secondary">Plumbing, electrical, security</p>
                </div>
              </Link>

              <Link
                to="/owner/feed"
                className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated border border-border-muted hover:border-accent/40 transition-colors"
              >
                <div className="p-2 rounded-lg bg-accent/15 text-accent">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-text-primary">Society Group Feed</h5>
                  <p className="text-[11px] text-text-secondary">Chat with neighbors & committee</p>
                </div>
              </Link>
            </div>
          </Card>

          {/* Recent Complaints progress */}
          <Card>
            <CardHeader
              title="Active Complaints"
              action={
                <Link to="/owner/complaints" className="text-xs text-accent hover:underline font-semibold">
                  View All
                </Link>
              }
            />
            {complaints.length === 0 ? (
              <p className="text-xs text-text-secondary py-3 text-center">No active complaint tickets.</p>
            ) : (
              <div className="space-y-3">
                {complaints.slice(0, 3).map((cmp) => (
                  <div key={cmp._id} className="p-3 rounded-lg bg-bg-elevated border border-border-muted">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-text-primary truncate max-w-[180px]">{cmp.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-bg-card border border-border-muted text-accent">
                        {cmp.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary line-clamp-1">{cmp.description}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
