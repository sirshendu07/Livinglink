import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, Search, Clock, Home, Phone, Car, 
  AlertTriangle, CheckCircle2, XCircle, RefreshCw, ShieldAlert
} from 'lucide-react';
import { visitorApi } from '../../services/api/visitorApi';
import { useSocket } from '../../context/SocketContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/forms/Input';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { formatDateTime, getRelativeTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function AdminVisitors() {
  const queryClient = useQueryClient();
  const { on, off } = useSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [towerFilter, setTowerFilter] = useState('ALL');

  // Override modal
  const [overrideVisitor, setOverrideVisitor] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');

  // Visitors query
  const { data: visitorsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-all-visitors', statusFilter, towerFilter],
    queryFn: () => visitorApi.getAllVisitors({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      tower: towerFilter === 'ALL' ? undefined : towerFilter,
      limit: 100
    })
  });

  const visitors = visitorsData?.visitors || [];

  // Socket updates
  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-visitors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    };

    on('visitor:request:created', handleUpdate);
    on('visitor:approved', handleUpdate);
    on('visitor:rejected', handleUpdate);
    on('visitor:entered', handleUpdate);
    on('visitor:exited', handleUpdate);
    on('visitor:status:updated', handleUpdate);

    return () => {
      off('visitor:request:created', handleUpdate);
      off('visitor:approved', handleUpdate);
      off('visitor:rejected', handleUpdate);
      off('visitor:entered', handleUpdate);
      off('visitor:exited', handleUpdate);
      off('visitor:status:updated', handleUpdate);
    };
  }, [on, off, queryClient]);

  // Override mutation
  const overrideMutation = useMutation({
    mutationFn: ({ id, reason }) => visitorApi.adminOverride(id, reason),
    onSuccess: () => {
      toast.success('Visitor emergency entry authorized and logged');
      setOverrideVisitor(null);
      setOverrideReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-all-visitors'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Override failed');
    }
  });

  const filteredVisitors = visitors.filter((v) => {
    const query = searchTerm.toLowerCase();
    return (
      v.name?.toLowerCase().includes(query) ||
      v.phone?.includes(query) ||
      v.flatNumber?.toLowerCase().includes(query) ||
      v.tower?.toLowerCase().includes(query) ||
      v.vehicleNumber?.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ENTERED':
        return <Badge variant="info">Inside Campus</Badge>;
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Awaiting Approval</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      case 'EXITED':
        return <Badge variant="default">Exited</Badge>;
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
            Perimeter Gate Access Logs
          </h1>
          <p className="text-text-secondary text-sm">
            Society-wide visitor movements, resident authorizations, and emergency security overrides.
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

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6">
          <Input
            placeholder="Search visitor name, phone, plate, or flat..."
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
            <option value="ENTERED">Currently Inside</option>
            <option value="APPROVED">Approved Passes</option>
            <option value="PENDING">Pending Approval</option>
            <option value="REJECTED">Rejected Requests</option>
            <option value="EXITED">Exited Records</option>
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

      {/* Visitors Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : filteredVisitors.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12 text-text-secondary" />}
          title="No visitor logs found"
          description="Visitor entries recorded at the guardhouse will be presented here in real-time."
        />
      ) : (
        <div className="bg-surface-card border border-border-muted rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary text-text-secondary uppercase tracking-wider text-[11px] border-b border-border-muted">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Visitor</th>
                  <th className="py-3.5 px-4 font-semibold">Destination Flat</th>
                  <th className="py-3.5 px-4 font-semibold">Vehicle</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Check-in Time</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted/50 text-text-secondary">
                {filteredVisitors.map((v) => (
                  <tr key={v._id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text-primary text-sm">{v.name}</div>
                      <div className="text-[11px] text-text-secondary font-mono">
                        {v.phone} &bull; {v.purpose || 'Guest'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-text-primary">
                      <div className="flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-accent" />
                        <span>Tower {v.tower} - Flat {v.flatNumber}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {v.vehicleNumber ? (
                        <span className="flex items-center gap-1 text-text-primary">
                          <Car className="w-3.5 h-3.5 text-text-secondary" />
                          {v.vehicleNumber}
                        </span>
                      ) : (
                        <span className="text-text-secondary italic">Pedestrian</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(v.status)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {formatDateTime(v.enteredAt || v.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {v.status === 'PENDING' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-warning hover:bg-warning/10"
                          onClick={() => {
                            setOverrideVisitor(v);
                            setOverrideReason('');
                          }}
                        >
                          Override Entry
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Emergency Override Modal */}
      <Modal
        isOpen={!!overrideVisitor}
        onClose={() => setOverrideVisitor(null)}
        title="Administrative Gate Access Override"
      >
        <div className="space-y-4">
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              This will bypass flat approval and log immediate access authorization with your Admin ID.
            </span>
          </div>

          <div>
            <p className="text-sm text-text-primary mb-1">
              Visitor: <strong>{overrideVisitor?.name}</strong> for Flat {overrideVisitor?.flatNumber}
            </p>
            <label className="block text-xs text-text-secondary mb-1">Override Justification *</label>
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Authorized emergency services, government delivery, verbal confirmation..."
              rows={3}
              className="w-full bg-surface-secondary border border-border-muted rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setOverrideVisitor(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={overrideReason.trim().length < 5}
              loading={overrideMutation.isPending}
              onClick={() => overrideMutation.mutate({ 
                id: overrideVisitor?._id, 
                reason: overrideReason.trim() 
              })}
            >
              Confirm Admin Override
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
