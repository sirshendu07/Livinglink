import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, CheckCircle2, XCircle, Clock, Search, LogIn, LogOut, 
  Phone, Home, Car, AlertTriangle, ShieldCheck, RefreshCw
} from 'lucide-react';
import { visitorApi } from '../../services/api/visitorApi';
import { useSocket } from '../../context/SocketContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/forms/Input';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { formatDateTime, getRelativeTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function VisitorApprovals() {
  const queryClient = useQueryClient();
  const { on, off } = useSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  // Fetch visitors
  const { data: visitorsData, isLoading, refetch } = useQuery({
    queryKey: ['security-visitors'],
    queryFn: () => visitorApi.getAllVisitors({ limit: 100 }),
    refetchInterval: 10000 // periodic background refresh
  });

  const visitors = visitorsData?.visitors || [];

  // Listen to live socket events for visitors
  useEffect(() => {
    const handleVisitorCreated = (data) => {
      toast('New visitor at the gate!', { icon: '🚪' });
      queryClient.invalidateQueries({ queryKey: ['security-visitors'] });
    };

    const handleVisitorApproved = (data) => {
      toast.success(`Flat ${data.flatNumber || ''} APPROVED visitor: ${data.name || 'Visitor'}`);
      queryClient.invalidateQueries({ queryKey: ['security-visitors'] });
    };

    const handleVisitorRejected = (data) => {
      toast.error(`Flat ${data.flatNumber || ''} REJECTED visitor: ${data.name || 'Visitor'}`);
      queryClient.invalidateQueries({ queryKey: ['security-visitors'] });
    };

    on('visitor:request:created', handleVisitorCreated);
    on('visitor:approved', handleVisitorApproved);
    on('visitor:rejected', handleVisitorRejected);
    on('visitor:status:updated', () => queryClient.invalidateQueries({ queryKey: ['security-visitors'] }));

    return () => {
      off('visitor:request:created', handleVisitorCreated);
      off('visitor:approved', handleVisitorApproved);
      off('visitor:rejected', handleVisitorRejected);
      off('visitor:status:updated');
    };
  }, [on, off, queryClient]);

  // Mark entry mutation
  const enterMutation = useMutation({
    mutationFn: (id) => visitorApi.markEntered(id),
    onSuccess: (updated) => {
      toast.success(`Entry logged for ${updated.name}`);
      queryClient.invalidateQueries({ queryKey: ['security-visitors'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to mark entry');
    }
  });

  // Mark exit mutation
  const exitMutation = useMutation({
    mutationFn: (id) => visitorApi.markExited(id),
    onSuccess: (updated) => {
      toast.success(`Exit logged for ${updated.name}`);
      queryClient.invalidateQueries({ queryKey: ['security-visitors'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to mark exit');
    }
  });

  // Emergency override mutation
  const overrideMutation = useMutation({
    mutationFn: ({ id, reason }) => visitorApi.adminOverride(id, reason),
    onSuccess: () => {
      toast.success('Visitor granted emergency override');
      setIsOverrideModalOpen(false);
      setOverrideReason('');
      queryClient.invalidateQueries({ queryKey: ['security-visitors'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Override failed');
    }
  });

  const filteredVisitors = visitors.filter((v) => {
    const matchesSearch = 
      v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.phone?.includes(searchTerm) ||
      v.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.tower?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && v.status === statusFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning" className="animate-pulse">Awaiting Approval</Badge>;
      case 'APPROVED':
        return <Badge variant="success">Approved by Owner</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      case 'ENTERED':
        return <Badge variant="info">Currently Inside</Badge>;
      case 'EXITED':
        return <Badge variant="default">Exited Premises</Badge>;
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
            <Users className="w-7 h-7 text-accent" />
            Gate Visitor Queue & Approvals
          </h1>
          <p className="text-text-secondary text-sm">
            Monitor real-time resident responses, verify passes, and log entry/exit.
          </p>
        </div>
        <Button 
          variant="secondary" 
          icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={() => refetch()}
        >
          Refresh Live
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8">
          <Input
            placeholder="Search visitor name, phone, flat (e.g. A-402), or vehicle plate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-text-secondary" />}
          />
        </div>
        <div className="sm:col-span-4 flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-surface-card border border-border-muted rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved (Ready for Entry)</option>
            <option value="ENTERED">Inside (Ready for Exit)</option>
            <option value="REJECTED">Rejected</option>
            <option value="EXITED">Completed History</option>
          </select>
        </div>
      </div>

      {/* Visitor List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : filteredVisitors.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12 text-text-secondary" />}
          title="No visitors in this queue"
          description="New visitor requests created at the guard house will appear here instantaneously."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVisitors.map((visitor) => (
            <Card 
              key={visitor._id} 
              className={`border transition-all duration-200 ${
                visitor.status === 'APPROVED' ? 'border-success/40 bg-surface-card/90 shadow-lg shadow-success/5' :
                visitor.status === 'PENDING' ? 'border-warning/30 bg-surface-card' :
                'border-border-muted bg-surface-card'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-semibold text-text-primary text-base flex items-center gap-2">
                    {visitor.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{getRelativeTime(visitor.createdAt)}</span>
                  </div>
                </div>
                {getStatusBadge(visitor.status)}
              </div>

              {/* Visitor Details */}
              <div className="space-y-2 text-xs text-text-secondary border-t border-border-muted/50 pt-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-text-primary font-medium">
                    <Home className="w-3.5 h-3.5 text-accent" />
                    Tower {visitor.tower} - Flat {visitor.flatNumber}
                  </span>
                  <span className="bg-surface-elevated px-2 py-0.5 rounded text-[11px] font-mono">
                    {visitor.purpose || 'Guest'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-text-secondary" />
                  <a href={`tel:${visitor.phone}`} className="hover:text-accent font-mono">
                    {visitor.phone}
                  </a>
                </div>

                {visitor.vehicleNumber && (
                  <div className="flex items-center gap-1.5 font-mono text-text-secondary">
                    <Car className="w-3.5 h-3.5" />
                    <span>Plate: {visitor.vehicleNumber}</span>
                  </div>
                )}

                {visitor.rejectionReason && (
                  <div className="p-2 rounded bg-danger/10 border border-danger/20 text-danger text-[11px] mt-2">
                    <strong>Rejection Reason:</strong> {visitor.rejectionReason}
                  </div>
                )}
              </div>

              {/* Action Buttons based on status */}
              <div className="mt-4 pt-3 border-t border-border-muted flex items-center gap-2">
                {visitor.status === 'APPROVED' && (
                  <Button
                    variant="primary"
                    className="w-full bg-success hover:bg-success/90 text-surface-main font-semibold shadow-md shadow-success/10"
                    icon={<LogIn className="w-4 h-4" />}
                    loading={enterMutation.isPending && enterMutation.variables === visitor._id}
                    onClick={() => enterMutation.mutate(visitor._id)}
                  >
                    Allow Entry
                  </Button>
                )}

                {visitor.status === 'ENTERED' && (
                  <Button
                    variant="secondary"
                    className="w-full border-border-muted hover:border-danger hover:text-danger text-text-secondary"
                    icon={<LogOut className="w-4 h-4" />}
                    loading={exitMutation.isPending && exitMutation.variables === visitor._id}
                    onClick={() => exitMutation.mutate(visitor._id)}
                  >
                    Log Gate Exit
                  </Button>
                )}

                {visitor.status === 'PENDING' && (
                  <div className="w-full flex items-center gap-2">
                    <div className="flex-1 text-center py-1.5 px-2 rounded bg-warning/10 text-warning text-xs font-medium">
                      Waiting for flat resident...
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Emergency Guard Override"
                      className="text-xs text-text-secondary hover:text-danger"
                      onClick={() => {
                        setSelectedVisitor(visitor);
                        setIsOverrideModalOpen(true);
                      }}
                    >
                      Override
                    </Button>
                  </div>
                )}

                {['REJECTED', 'EXITED'].includes(visitor.status) && (
                  <div className="w-full text-center py-1 text-xs text-text-secondary italic">
                    {visitor.status === 'REJECTED' ? 'Request closed (Denied)' : `Exited at ${formatDateTime(visitor.exitedAt || visitor.updatedAt)}`}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Emergency Override Modal */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => {
          setIsOverrideModalOpen(false);
          setOverrideReason('');
        }}
        title="Gate Security Override"
      >
        <div className="space-y-4">
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Overrides bypass resident authorization. This action is permanently audited in the security logs with your Guard ID.
            </span>
          </div>

          <div>
            <p className="text-sm text-text-primary mb-1">
              Visitor: <strong>{selectedVisitor?.name}</strong> for Flat {selectedVisitor?.flatNumber}
            </p>
            <label className="block text-xs text-text-secondary mb-1">Reason for Emergency Entry</label>
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Verified by phone call, emergency repair crew, medical team..."
              rows={3}
              className="w-full bg-surface-secondary border border-border-muted rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsOverrideModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!overrideReason.trim()}
              loading={overrideMutation.isPending}
              onClick={() => overrideMutation.mutate({ id: selectedVisitor?._id, reason: overrideReason })}
            >
              Authorize Emergency Entry
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
