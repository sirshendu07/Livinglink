import React, { useState, useEffect } from 'react';
import { Users, Check, X, ShieldAlert, Clock, LogIn, LogOut, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { visitorApi } from '../../services/api/visitorApi';
import { formatDate, formatDateTime } from '../../utils/formatters';

export const OwnerVisitors = () => {
  const { socket } = useSocket();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchVisitors = async () => {
    try {
      const data = await visitorApi.getMyRequests({ limit: 50 });
      setVisitors(data?.items || []);
    } catch {
      toast.error('Failed to load visitor requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  // Real-time visitor arrival listener
  useEffect(() => {
    const unsubArrival = socket.on('visitor:approval:request', (newReq) => {
      setVisitors((prev) => [newReq, ...prev]);
    });

    return () => {
      unsubArrival();
    };
  }, [socket]);

  const handleDecision = async (id, decision) => {
    let rejectionReason = '';
    if (decision === 'REJECT') {
      rejectionReason = prompt('Reason for rejecting visitor entry:') || 'Not permitted by resident';
    }

    setActionLoadingId(id);
    try {
      await visitorApi.respondToRequest(id, decision, rejectionReason);
      toast.success(`Visitor entry request has been ${decision === 'APPROVE' ? 'Approved' : 'Rejected'}`);
      setVisitors((prev) =>
        prev.map((v) => (v._id === id ? { ...v, status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED' } : v))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update approval status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingList = visitors.filter((v) => v.status === 'PENDING');
  const historyList = visitors.filter((v) => v.status !== 'PENDING');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-muted">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">Gate Visitor Management</h2>
          <p className="text-xs text-text-secondary mt-1">
            Authorize delivery partners, cabs, and personal guests arriving at the security checkpoints.
          </p>
        </div>
      </div>

      {loading ? (
        <Loader message="Loading gate visitor logs..." />
      ) : (
        <div className="space-y-8">
          {/* Section 1: Pending Approvals (High Visibility) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-status-warning animate-ping" />
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Waiting at the Gate ({pendingList.length})
              </h3>
            </div>

            {pendingList.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-border-muted rounded-xl bg-bg-card/40">
                <p className="text-xs text-text-secondary">No visitors currently awaiting entry authorization.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingList.map((vis) => (
                  <Card key={vis._id} className="border-l-4 border-l-status-warning p-5 space-y-4 shadow-card">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-text-primary">{vis.visitorName}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/25">
                            {vis.category}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary mt-1 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-accent" />
                          <span>{vis.visitorPhone}</span>
                        </p>
                      </div>

                      <span className="text-[10px] font-mono font-bold text-text-secondary px-2 py-1 rounded bg-bg-elevated border border-border-muted">
                        {vis.visitorCode}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-bg-elevated border border-border-muted text-xs space-y-1">
                      <p className="text-text-secondary">
                        <strong className="text-text-primary">Purpose:</strong> {vis.purpose || 'General Visit'}
                      </p>
                      {vis.vehicleNumber && (
                        <p className="text-text-secondary">
                          <strong className="text-text-primary">Vehicle:</strong> {vis.vehicleNumber}
                        </p>
                      )}
                      <p className="text-[11px] text-text-secondary">
                        Arrived: {formatDateTime(vis.createdAt)}
                      </p>
                    </div>

                    {/* Immediate Action Buttons */}
                    <div className="flex items-center gap-3 pt-1">
                      <Button
                        size="md"
                        variant="primary"
                        icon={Check}
                        className="flex-1 font-bold text-xs"
                        loading={actionLoadingId === vis._id}
                        onClick={() => handleDecision(vis._id, 'APPROVE')}
                      >
                        APPROVE ENTRY
                      </Button>
                      <Button
                        size="md"
                        variant="danger"
                        icon={X}
                        className="flex-1 font-bold text-xs"
                        loading={actionLoadingId === vis._id}
                        onClick={() => handleDecision(vis._id, 'REJECT')}
                      >
                        REJECT
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Visitor History & Active Inside */}
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">
              Recent Visitor History
            </h3>

            {historyList.length === 0 ? (
              <p className="text-xs text-text-secondary">No previous visitor records found.</p>
            ) : (
              <div className="divide-y divide-border-muted/60 bg-bg-card border border-border-muted rounded-xl overflow-hidden">
                {historyList.map((vis) => (
                  <div key={vis._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary">{vis.visitorName}</span>
                        <Badge status={vis.status} />
                        <span className="text-[10px] text-text-secondary uppercase bg-bg-elevated px-2 py-0.5 rounded border border-border-muted">
                          {vis.category}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary">
                        {vis.visitorPhone} • Purpose: {vis.purpose || 'Visit'}
                      </p>
                    </div>

                    <div className="text-left sm:text-right text-xs text-text-secondary">
                      <p>{formatDateTime(vis.createdAt)}</p>
                      {vis.entryTimestamp && (
                        <p className="text-[11px] text-status-success font-medium">
                          Entered: {formatDateTime(vis.entryTimestamp)}
                        </p>
                      )}
                      {vis.exitTimestamp && (
                        <p className="text-[11px] text-text-secondary">
                          Exited: {formatDateTime(vis.exitTimestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerVisitors;
