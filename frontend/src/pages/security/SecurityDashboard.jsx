import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  UserPlus,
  Clock,
  LogIn,
  QrCode,
  ShieldAlert,
  ArrowRight,
  PhoneCall,
  CheckCircle2
} from 'lucide-react';
import Card, { CardHeader } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import { visitorApi } from '../../services/api/visitorApi';
import { sosApi } from '../../services/api/sosApi';
import { formatTimeAgo } from '../../utils/formatters';

export const SecurityDashboard = () => {
  const [visitors, setVisitors] = useState([]);
  const [activeSos, setActiveSos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGateData = async () => {
    try {
      const [visitorData, sosData] = await Promise.all([
        visitorApi.getAllVisitors({ limit: 30 }),
        sosApi.getActiveAlerts()
      ]);
      setVisitors(visitorData?.items || []);
      setActiveSos(sosData || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateData();
  }, []);

  const pendingApprovals = visitors.filter((v) => v.status === 'PENDING');
  const insideSociety = visitors.filter((v) => v.status === 'ENTERED');

  return (
    <div className="space-y-6">
      {/* Critical Active Emergency SOS Banner (High Alert) */}
      {activeSos.length > 0 && (
        <div className="p-4 rounded-xl bg-status-danger/20 border-2 border-status-danger text-status-danger animate-pulse flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider">
                ACTIVE SOS EMERGENCY ALERT ({activeSos.length})
              </h4>
              <p className="text-xs text-text-primary mt-0.5">
                Location: {activeSos[0].flat ? `${activeSos[0].flat.tower}-${activeSos[0].flat.flatNumber}` : 'Premises'} • {activeSos[0].notes}
              </p>
            </div>
          </div>
          <Link to="/security/sos">
            <Button size="sm" variant="danger">
              Respond Now
            </Button>
          </Link>
        </div>
      )}

      {/* Gate Quick Action Buttons (Optimized for Large Touch Targets) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/security/new-visitor" className="w-full">
          <div className="p-4 rounded-xl bg-accent text-[#0B0D10] font-bold text-center hover:bg-accent-hover transition-all flex flex-col items-center gap-2 shadow-glow">
            <UserPlus className="w-6 h-6" />
            <span className="text-xs">Register Visitor</span>
          </div>
        </Link>

        <Link to="/security/approvals" className="w-full">
          <div className="p-4 rounded-xl bg-bg-card border border-border-muted hover:border-accent text-text-primary font-bold text-center transition-all flex flex-col items-center gap-2">
            <div className="relative">
              <Clock className="w-6 h-6 text-status-warning" />
              {pendingApprovals.length > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-status-danger text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingApprovals.length}
                </span>
              )}
            </div>
            <span className="text-xs">Approvals</span>
          </div>
        </Link>

        <Link to="/security/active-visitors" className="w-full">
          <div className="p-4 rounded-xl bg-bg-card border border-border-muted hover:border-accent text-text-primary font-bold text-center transition-all flex flex-col items-center gap-2">
            <LogIn className="w-6 h-6 text-status-info" />
            <span className="text-xs">Inside ({insideSociety.length})</span>
          </div>
        </Link>

        <Link to="/security/verify-amenity" className="w-full">
          <div className="p-4 rounded-xl bg-bg-card border border-border-muted hover:border-accent text-text-primary font-bold text-center transition-all flex flex-col items-center gap-2">
            <QrCode className="w-6 h-6 text-accent" />
            <span className="text-xs">Verify QR Pass</span>
          </div>
        </Link>
      </div>

      {/* Gate Overview Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Pending Approvals"
          value={pendingApprovals.length}
          subtitle="Awaiting resident confirmation"
          icon={Clock}
        />
        <StatCard
          title="Currently Inside"
          value={insideSociety.length}
          subtitle="Visitors on society grounds"
          icon={LogIn}
        />
        <StatCard
          title="Total Visitors Logged"
          value={visitors.length}
          subtitle="Gate checkpoint records"
          icon={Shield}
        />
      </div>

      {/* Pending Visitors Actionable List */}
      <Card>
        <CardHeader
          title="Pending Approvals at Gate"
          subtitle="Real-time gate arrivals waiting for resident decision"
          action={
            <Link to="/security/approvals" className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />

        {pendingApprovals.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-border-muted rounded-xl">
            <CheckCircle2 className="w-7 h-7 text-status-success mx-auto mb-2 opacity-70" />
            <p className="text-xs text-text-secondary">No visitors currently pending approval at the gate.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingApprovals.map((vis) => (
              <div
                key={vis._id}
                className="p-3.5 rounded-xl bg-bg-elevated border border-border-muted flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-primary">{vis.visitorName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/25">
                      {vis.category}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    Destination: <strong className="text-text-primary">{vis.destinationFlat?.tower}-{vis.destinationFlat?.flatNumber}</strong> • Phone: {vis.visitorPhone}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-status-warning font-semibold animate-pulse">
                    Awaiting Approval
                  </span>
                  <Link to="/security/approvals">
                    <Button size="sm" variant="secondary">
                      Check Status
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SecurityDashboard;
