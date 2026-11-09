import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  AlertTriangle, Phone, Home, CheckCircle2, Clock, ShieldAlert, 
  Check, FileText, RefreshCw, Volume2 
} from 'lucide-react';
import { sosApi } from '../../services/api/sosApi';
import { useSocket } from '../../context/SocketContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { formatDateTime, getRelativeTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function SecuritySos() {
  const queryClient = useQueryClient();
  const { on, off } = useSocket();
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  // Active Alerts
  const { data: activeAlerts = [], isLoading: isLoadingActive, refetch: refetchActive } = useQuery({
    queryKey: ['security-active-sos'],
    queryFn: () => sosApi.getActiveAlerts(),
    refetchInterval: 5000
  });

  // Past History
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['security-sos-history'],
    queryFn: () => sosApi.getHistory({ limit: 20 })
  });

  const historyAlerts = historyData?.alerts || [];

  // Socket updates
  useEffect(() => {
    const handleSosTriggered = (data) => {
      toast.error(`EMERGENCY SOS: Flat ${data.flatNumber || ''} triggered distress alert!`, {
        duration: 10000,
        icon: '🚨'
      });
      queryClient.invalidateQueries({ queryKey: ['security-active-sos'] });
    };

    const handleSosUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['security-active-sos'] });
      queryClient.invalidateQueries({ queryKey: ['security-sos-history'] });
    };

    on('sos:alert', handleSosTriggered);
    on('sos:status:updated', handleSosUpdated);

    return () => {
      off('sos:alert', handleSosTriggered);
      off('sos:status:updated', handleSosUpdated);
    };
  }, [on, off, queryClient]);

  // Acknowledge mutation
  const acknowledgeMutation = useMutation({
    mutationFn: (id) => sosApi.acknowledgeSos(id, 'Guard dispatched to flat location'),
    onSuccess: (updated) => {
      toast.success('SOS Alert Acknowledged. Security team dispatched.');
      queryClient.invalidateQueries({ queryKey: ['security-active-sos'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to acknowledge');
    }
  });

  // Resolve mutation
  const resolveMutation = useMutation({
    mutationFn: ({ id, resolutionNotes }) => sosApi.resolveSos(id, resolutionNotes),
    onSuccess: () => {
      toast.success('SOS incident marked resolved');
      setIsResolveModalOpen(false);
      setResolutionNotes('');
      queryClient.invalidateQueries({ queryKey: ['security-active-sos'] });
      queryClient.invalidateQueries({ queryKey: ['security-sos-history'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to resolve incident');
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
              <ShieldAlert className="w-7 h-7 text-danger" />
              Emergency Response Console
            </h1>
            {activeAlerts.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-danger/20 border border-danger/40 text-danger font-mono text-xs font-bold animate-pulse">
                {activeAlerts.length} ACTIVE INCIDENT{activeAlerts.length > 1 ? 'S' : ''}
              </span>
            )}
          </div>
          <p className="text-text-secondary text-sm">
            Immediate 24/7 alert monitoring for resident panic signals and distress dispatches.
          </p>
        </div>
        <Button 
          variant="secondary" 
          icon={<RefreshCw className={`w-4 h-4 ${isLoadingActive ? 'animate-spin' : ''}`} />}
          onClick={() => refetchActive()}
        >
          Check Now
        </Button>
      </div>

      {/* ACTIVE ALERTS SECTION */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            {activeAlerts.length > 0 && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${activeAlerts.length > 0 ? 'bg-danger' : 'bg-success'}`}></span>
          </span>
          Active Distress Signals
        </h2>

        {activeAlerts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-surface-card border border-border-muted flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-text-primary">No Active Emergency Signals</h3>
            <p className="text-xs text-text-secondary mt-1">
              All resident sectors report clear. If an owner triggers their SOS button, this monitor will alarm instantly.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeAlerts.map((alert) => (
              <Card 
                key={alert._id} 
                className="border-2 border-danger/60 bg-danger/5 shadow-xl shadow-danger/10 p-5 animate-pulse-subtle"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-md bg-danger text-surface-main font-bold text-xs uppercase tracking-wider">
                        SOS TRIGGERED
                      </span>
                      <span className="text-xs text-danger font-mono font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {getRelativeTime(alert.createdAt)}
                      </span>
                      <Badge variant={alert.status === 'ACKNOWLEDGED' ? 'warning' : 'danger'}>
                        {alert.status}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <Home className="w-5 h-5 text-danger" />
                        Tower {alert.tower} &mdash; Flat {alert.flatNumber}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mt-1">
                        <span className="text-text-primary font-medium">
                          Resident: {alert.resident?.name || 'Resident'}
                        </span>
                        {alert.resident?.phone && (
                          <a 
                            href={`tel:${alert.resident.phone}`} 
                            className="flex items-center gap-1 text-accent hover:underline font-mono"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {alert.resident.phone}
                          </a>
                        )}
                      </div>
                    </div>

                    {alert.notes && (
                      <p className="text-xs bg-surface-main/60 p-2.5 rounded-lg border border-border-muted text-text-primary font-mono">
                        &quot;{alert.notes}&quot;
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 min-w-[200px]">
                    {alert.status !== 'ACKNOWLEDGED' && (
                      <Button
                        variant="secondary"
                        className="bg-warning/20 border-warning/40 text-warning hover:bg-warning/30 font-semibold"
                        icon={<Check className="w-4 h-4" />}
                        loading={acknowledgeMutation.isPending && acknowledgeMutation.variables === alert._id}
                        onClick={() => acknowledgeMutation.mutate(alert._id)}
                      >
                        Acknowledge Alert
                      </Button>
                    )}

                    <Button
                      variant="primary"
                      className="bg-success hover:bg-success/90 text-surface-main font-semibold shadow-md shadow-success/10"
                      icon={<CheckCircle2 className="w-4 h-4" />}
                      onClick={() => {
                        setSelectedAlert(alert);
                        setIsResolveModalOpen(true);
                      }}
                    >
                      Resolve Incident
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* RESOLUTION MODAL */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => {
          setIsResolveModalOpen(false);
          setResolutionNotes('');
        }}
        title="Resolve Emergency Incident"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Resolving distress call for <strong>Tower {selectedAlert?.tower} - Flat {selectedAlert?.flatNumber}</strong> ({selectedAlert?.resident?.name}).
          </p>

          <div>
            <label className="block text-xs text-text-secondary mb-1">
              Incident Resolution Report / Security Summary *
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Guard visited flat, confirmed accidental button press / medical team assisted..."
              rows={4}
              className="w-full bg-surface-secondary border border-border-muted rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!resolutionNotes.trim()}
              loading={resolveMutation.isPending}
              onClick={() => resolveMutation.mutate({ 
                id: selectedAlert?._id, 
                resolutionNotes: resolutionNotes.trim() 
              })}
            >
              Confirm Incident Resolved
            </Button>
          </div>
        </div>
      </Modal>

      {/* RECENT RESOLVED INCIDENTS */}
      <div className="pt-6 border-t border-border-muted">
        <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-text-secondary" />
          Resolved Incident History
        </h2>

        {isLoadingHistory ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
          </div>
        ) : historyAlerts.length === 0 ? (
          <p className="text-xs text-text-secondary">No prior incident logs found.</p>
        ) : (
          <div className="space-y-3">
            {historyAlerts.map((incident) => (
              <div 
                key={incident._id}
                className="p-4 rounded-xl bg-surface-card border border-border-muted flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">
                      Tower {incident.tower} - Flat {incident.flatNumber}
                    </span>
                    <Badge variant="success">RESOLVED</Badge>
                  </div>
                  <p className="text-text-secondary mt-1">
                    {incident.resolutionNotes || 'No summary notes logged.'}
                  </p>
                </div>
                <div className="text-right text-text-secondary font-mono flex-shrink-0">
                  <div>{formatDateTime(incident.resolvedAt || incident.updatedAt)}</div>
                  <div className="text-[11px] text-accent">By: {incident.resolvedBy?.name || 'Security Guard'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
