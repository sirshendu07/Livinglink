import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Building2, Users, CreditCard, ShieldAlert, AlertTriangle, 
  CheckCircle2, DollarSign, Activity, FileText, ArrowUpRight,
  TrendingUp, Sparkles, RefreshCw
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { analyticsApi } from '../../services/api/analyticsApi';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const CHART_COLORS = ['#B8E0C1', '#78A9DD', '#E9B766', '#F07178', '#A78BFA'];

export default function AdminDashboard() {
  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => analyticsApi.getDashboard(),
    refetchInterval: 30000
  });

  const society = dashboard?.society || {};
  const maintenance = dashboard?.maintenance || {};
  const amenities = dashboard?.amenities || {};
  const complaints = dashboard?.complaints || {};
  const gate = dashboard?.gate || {};
  const sos = dashboard?.sos || {};

  // Format monthly collection data for chart
  const monthlyChartData = (maintenance?.monthlyCollection || []).map((m) => ({
    month: m._id || 'Month',
    Billed: (m.billed || 0) / 100,
    Collected: (m.collected || 0) / 100
  }));

  // Format complaints by status
  const complaintChartData = (complaints?.byStatus || []).map((c) => ({
    name: c._id || 'Unknown',
    value: c.count || 0
  }));

  return (
    <div className="space-y-6">
      {/* Active Emergency Alert Banner if any SOS is active */}
      {sos?.activeAlerts > 0 && (
        <div className="p-4 rounded-xl bg-danger/10 border-2 border-danger/40 flex items-center justify-between text-danger animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-sm tracking-wide">
                EMERGENCY ALERT: {sos.activeAlerts} ACTIVE SOS CALL{sos.activeAlerts > 1 ? 'S' : ''}
              </h3>
              <p className="text-xs text-text-primary mt-0.5">
                Resident distress panic alarm active. Immediate security dispatch required.
              </p>
            </div>
          </div>
          <Link to="/admin/sos">
            <Button variant="danger" size="sm" className="font-bold">
              Dispatch Console &rarr;
            </Button>
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Executive Society Operations
          </h1>
          <p className="text-text-secondary text-sm">
            Real-time financial telemetry, resident admissions, facilities, and perimeter security.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={() => refetch()}
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Executive Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Maintenance Collected"
          value={formatCurrency(maintenance?.totalCollectedInPaise || 0)}
          icon={<DollarSign className="w-5 h-5 text-success" />}
          change={
            maintenance?.totalBilledInPaise > 0 
              ? `${Math.round(((maintenance.totalCollectedInPaise || 0) / maintenance.totalBilledInPaise) * 100)}% collection efficiency`
              : 'Zero billed'
          }
          trend="up"
        />

        <StatCard
          title="Total Outstanding Dues"
          value={formatCurrency(maintenance?.totalOutstandingInPaise || 0)}
          icon={<CreditCard className="w-5 h-5 text-warning" />}
          change={`${maintenance?.totalDefaultersCount || 0} overdue flat${(maintenance?.totalDefaultersCount || 0) !== 1 ? 's' : ''}`}
          trend="neutral"
        />

        <StatCard
          title="Pending Approvals"
          value={formatNumber(society?.pendingApprovals || 0)}
          icon={<Users className="w-5 h-5 text-accent" />}
          change={society?.pendingApprovals > 0 ? "Admissions awaiting review" : "All verified"}
          trend={society?.pendingApprovals > 0 ? "down" : "neutral"}
        />

        <StatCard
          title="Campus Visitors Today"
          value={formatNumber(gate?.today?.totalVisitors || 0)}
          icon={<Building2 className="w-5 h-5 text-info" />}
          change={`${gate?.currentlyInside || 0} currently on premises`}
          trend="neutral"
        />
      </div>

      {/* Quick Access Action Bar */}
      <div className="flex flex-wrap items-center gap-2 py-1">
        <span className="text-xs font-semibold text-text-secondary mr-2 uppercase tracking-wider">Quick Actions:</span>
        <Link to="/admin/maintenance">
          <Button variant="secondary" size="sm" className="text-xs">
            + Generate Invoices
          </Button>
        </Link>
        <Link to="/admin/notices">
          <Button variant="secondary" size="sm" className="text-xs">
            + Broadcast Notice
          </Button>
        </Link>
        <Link to="/admin/residents?status=PENDING_APPROVAL">
          <Button variant="secondary" size="sm" className="text-xs">
            Review Registrations ({society?.pendingApprovals || 0})
          </Button>
        </Link>
        <Link to="/admin/staff">
          <Button variant="secondary" size="sm" className="text-xs">
            + Add Security / Admin Staff
          </Button>
        </Link>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Maintenance Invoicing & Collection Trend */}
        <Card className="lg:col-span-8 p-5 border border-border-muted flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-text-primary text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                Maintenance Collection Analytics (₹)
              </h3>
              <p className="text-xs text-text-secondary">
                Monthly comparison between total billed demand vs actual receipts.
              </p>
            </div>
            <Link to="/admin/maintenance" className="text-xs text-accent hover:underline flex items-center gap-0.5">
              View Ledger <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full">
            {monthlyChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-secondary text-xs">
                No billing cycles recorded yet. Generate invoices to populate trend data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#78A9DD" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#78A9DD" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B8E0C1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#B8E0C1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#89939E" fontSize={11} tickLine={false} />
                  <YAxis stroke="#89939E" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#151A20', borderColor: '#252D36', borderRadius: '8px', color: '#F1F3F5' }}
                    formatter={(val) => [`₹${val}`, '']}
                  />
                  <Area type="monotone" dataKey="Billed" stroke="#78A9DD" strokeWidth={2} fillOpacity={1} fill="url(#colorBilled)" />
                  <Area type="monotone" dataKey="Collected" stroke="#B8E0C1" strokeWidth={2} fillOpacity={1} fill="url(#colorCollected)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex items-center justify-center gap-6 text-xs text-text-secondary pt-3 border-t border-border-muted/50 mt-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#78A9DD]"></span>
              <span>Billed Amount</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#B8E0C1]"></span>
              <span>Collected Amount</span>
            </div>
          </div>
        </Card>

        {/* Complaints Breakdown */}
        <Card className="lg:col-span-4 p-5 border border-border-muted flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-text-primary text-base flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-warning" />
              Grievance Resolution
            </h3>
            <p className="text-xs text-text-secondary mb-4">
              Breakdown of total {complaints?.totalComplaints || 0} work tickets.
            </p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            {complaintChartData.length === 0 ? (
              <p className="text-xs text-text-secondary">No grievances logged.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complaintChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {complaintChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#151A20', borderColor: '#252D36', borderRadius: '8px', color: '#F1F3F5' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-border-muted/50 text-xs">
            {complaintChartData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-text-secondary">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></span>
                  {item.name}
                </span>
                <span className="font-mono text-text-primary font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Society Snapshot Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Flats & Demographics */}
        <Card className="p-4 border border-border-muted">
          <h4 className="text-xs font-semibold uppercase text-text-secondary tracking-wider mb-3">
            Society Composition
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border-muted/30">
              <span className="text-text-secondary">Total Society Flats</span>
              <span className="font-mono font-semibold text-text-primary">{society?.totalFlats || 0}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border-muted/30">
              <span className="text-text-secondary">Approved Owners</span>
              <span className="font-mono font-semibold text-text-primary">{society?.totalOwners || 0}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-text-secondary">Security Force</span>
              <span className="font-mono font-semibold text-text-primary">{society?.totalSecurity || 0}</span>
            </div>
          </div>
        </Card>

        {/* Facilities & Memberships */}
        <Card className="p-4 border border-border-muted">
          <h4 className="text-xs font-semibold uppercase text-text-secondary tracking-wider mb-3">
            Amenities & Passes
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border-muted/30">
              <span className="text-text-secondary">Active Subscriptions</span>
              <span className="font-mono font-semibold text-success">{amenities?.activeSubscriptions || 0}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border-muted/30">
              <span className="text-text-secondary">Expired Subscriptions</span>
              <span className="font-mono font-semibold text-text-secondary">{amenities?.expiredSubscriptions || 0}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-text-secondary">Revenue Generating Amenities</span>
              <span className="font-mono font-semibold text-accent">{amenities?.revenueByAmenity?.length || 0}</span>
            </div>
          </div>
        </Card>

        {/* Perimeter & Security */}
        <Card className="p-4 border border-border-muted">
          <h4 className="text-xs font-semibold uppercase text-text-secondary tracking-wider mb-3">
            Perimeter Security
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border-muted/30">
              <span className="text-text-secondary">Gate Entries Today</span>
              <span className="font-mono font-semibold text-text-primary">{gate?.today?.approved || 0}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border-muted/30">
              <span className="text-text-secondary">Gate Rejections Today</span>
              <span className="font-mono font-semibold text-danger">{gate?.today?.rejected || 0}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-text-secondary">Average SOS Response</span>
              <span className="font-mono font-semibold text-info">{sos?.averageResponseTimeSeconds || 0}s</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
