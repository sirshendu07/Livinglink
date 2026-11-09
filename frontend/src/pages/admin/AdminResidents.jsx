import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { 
  Users, CheckCircle2, XCircle, Search, ShieldAlert, 
  Home, Phone, Mail, Filter, AlertCircle, RefreshCw, Check
} from 'lucide-react';
import { userApi } from '../../services/api/userApi';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/forms/Input';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function AdminResidents() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedTower, setSelectedTower] = useState('ALL');
  
  // Suspend modal state
  const [suspendModalUser, setSuspendModalUser] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Fetch users
  const { data: userData, isLoading, refetch } = useQuery({
    queryKey: ['admin-residents', selectedStatus],
    queryFn: () => userApi.getUsers({ 
      role: 'OWNER',
      status: selectedStatus === 'ALL' ? undefined : selectedStatus,
      limit: 100 
    })
  });

  const residents = userData?.users || [];

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (userId) => userApi.approveOwner(userId),
    onSuccess: (updated) => {
      toast.success(`Owner ${updated.name} has been approved!`);
      queryClient.invalidateQueries({ queryKey: ['admin-residents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to approve owner');
    }
  });

  // Status mutation (Suspend / Activate)
  const statusMutation = useMutation({
    mutationFn: ({ userId, status, reason }) => userApi.updateStatus(userId, status, reason),
    onSuccess: (updated) => {
      toast.success(`User status updated to ${updated.status}`);
      setSuspendModalUser(null);
      setSuspendReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-residents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  });

  const filteredResidents = residents.filter((user) => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm) ||
      user.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.tower?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTower = selectedTower === 'ALL' || user.tower === selectedTower;
    return matchesSearch && matchesTower;
  });

  const towers = Array.from(new Set(residents.map(u => u.tower).filter(Boolean))).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Users className="w-7 h-7 text-accent" />
            Resident Admissions & Directory
          </h1>
          <p className="text-text-secondary text-sm">
            Review registration requests, approve new flat owners, and manage residency status.
          </p>
        </div>
        <Button 
          variant="secondary" 
          icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={() => refetch()}
        >
          Refresh Directory
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-muted pb-3">
        {[
          { label: 'All Residents', value: 'ALL' },
          { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Suspended', value: 'SUSPENDED' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setSelectedStatus(tab.value);
              setSearchParams(tab.value === 'ALL' ? {} : { status: tab.value });
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedStatus === tab.value
                ? 'bg-accent text-surface-main shadow-md shadow-accent/10'
                : 'bg-surface-card text-text-secondary hover:text-text-primary border border-border-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Tower Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8">
          <Input
            placeholder="Search by resident name, email, phone, tower, or flat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-text-secondary" />}
          />
        </div>
        <div className="sm:col-span-4">
          <select
            value={selectedTower}
            onChange={(e) => setSelectedTower(e.target.value)}
            className="w-full bg-surface-card border border-border-muted rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Towers</option>
            {towers.map(t => (
              <option key={t} value={t}>Tower {t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Residents Table / Cards */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : filteredResidents.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12 text-text-secondary" />}
          title="No residents found"
          description={searchTerm ? "No resident matches your search filter." : "No records currently under this status filter."}
        />
      ) : (
        <div className="bg-surface-card border border-border-muted rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary text-text-secondary uppercase tracking-wider text-[11px] border-b border-border-muted">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Resident</th>
                  <th className="py-3.5 px-4 font-semibold">Flat & Tower</th>
                  <th className="py-3.5 px-4 font-semibold">Contact</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Joined</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted/50 text-text-secondary">
                {filteredResidents.map((user) => (
                  <tr key={user._id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text-primary text-sm">{user.name}</div>
                      <div className="text-[11px] text-text-secondary font-mono">{user.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {user.tower && user.flatNumber ? (
                        <div className="flex items-center gap-1.5 font-medium text-text-primary">
                          <Home className="w-3.5 h-3.5 text-accent" />
                          <span>Tower {user.tower} - {user.flatNumber}</span>
                        </div>
                      ) : (
                        <span className="text-text-secondary italic">Not assigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <a href={`tel:${user.phone}`} className="hover:text-accent flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {user.phone || 'N/A'}
                      </a>
                    </td>

                    <td className="py-3.5 px-4">
                      {user.status === 'PENDING_APPROVAL' && (
                        <Badge variant="warning" className="animate-pulse">Pending Approval</Badge>
                      )}
                      {user.status === 'ACTIVE' && (
                        <Badge variant="success">Active</Badge>
                      )}
                      {user.status === 'SUSPENDED' && (
                        <Badge variant="danger">Suspended</Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {formatDate(user.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.status === 'PENDING_APPROVAL' && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-success hover:bg-success/90 text-surface-main font-semibold shadow-sm text-xs"
                            icon={<Check className="w-3.5 h-3.5" />}
                            loading={approveMutation.isPending && approveMutation.variables === user._id}
                            onClick={() => approveMutation.mutate(user._id)}
                          >
                            Approve
                          </Button>
                        )}

                        {user.status === 'ACTIVE' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-danger hover:bg-danger/10"
                            onClick={() => {
                              setSuspendModalUser(user);
                              setSuspendReason('');
                            }}
                          >
                            Suspend
                          </Button>
                        )}

                        {user.status === 'SUSPENDED' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs text-success border-success/30 hover:bg-success/10"
                            loading={statusMutation.isPending && statusMutation.variables?.userId === user._id}
                            onClick={() => statusMutation.mutate({ userId: user._id, status: 'ACTIVE' })}
                          >
                            Reactivate
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

      {/* Suspend Confirmation Modal */}
      <Modal
        isOpen={!!suspendModalUser}
        onClose={() => setSuspendModalUser(null)}
        title="Suspend Resident Account"
      >
        <div className="space-y-4">
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Suspending an account revokes amenity access card validity and locks the resident from voting or feed interactions.
            </span>
          </div>

          <div>
            <p className="text-sm text-text-primary mb-2">
              Resident: <strong>{suspendModalUser?.name}</strong> (Tower {suspendModalUser?.tower} - {suspendModalUser?.flatNumber})
            </p>
            <label className="block text-xs text-text-secondary mb-1">Reason for Account Suspension *</label>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g. Unresolved rule violation, severe noise complaint, legal hold..."
              rows={3}
              className="w-full bg-surface-secondary border border-border-muted rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setSuspendModalUser(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!suspendReason.trim()}
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate({ 
                userId: suspendModalUser?._id, 
                status: 'SUSPENDED',
                reason: suspendReason.trim()
              })}
            >
              Confirm Suspension
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
