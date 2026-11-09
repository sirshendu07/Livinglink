import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Sparkles, Plus, Edit3, ShieldAlert, Clock, CheckCircle2, 
  XCircle, Search, RefreshCw, Key, FileText, ToggleLeft, ToggleRight
} from 'lucide-react';
import { amenityApi } from '../../services/api/amenityApi';
import { userApi } from '../../services/api/userApi';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/forms/Input';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function AdminAmenities() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('AMENITIES'); // 'AMENITIES' | 'LOGS'

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  // Amenity Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [openingTime, setOpeningTime] = useState('06:00');
  const [closingTime, setClosingTime] = useState('22:00');
  const [monthlyPriceRupees, setMonthlyPriceRupees] = useState('1200');
  const [quarterlyPriceRupees, setQuarterlyPriceRupees] = useState('3200');

  // Override Form State
  const [overrideUserId, setOverrideUserId] = useState('');
  const [overrideAmenityId, setOverrideAmenityId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  // Fetch all amenities
  const { data: amenities = [], isLoading: isLoadingAmenities, refetch: refetchAmenities } = useQuery({
    queryKey: ['admin-amenities'],
    queryFn: () => amenityApi.getAllAdmin()
  });

  // Fetch access entry logs
  const { data: logsData, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['admin-amenity-logs'],
    queryFn: () => amenityApi.getEntryLogs({ limit: 50 }),
    enabled: activeTab === 'LOGS'
  });

  // Fetch users for override dropdown
  const { data: usersData } = useQuery({
    queryKey: ['admin-users-override'],
    queryFn: () => userApi.getUsers({ role: 'OWNER', limit: 100 }),
    enabled: isOverrideModalOpen
  });

  const entryLogs = logsData?.logs || [];
  const users = usersData?.users || [];

  // Create Amenity Mutation
  const createMutation = useMutation({
    mutationFn: (data) => amenityApi.createAmenity(data),
    onSuccess: () => {
      toast.success('Amenity facility created!');
      setIsCreateModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-amenities'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create amenity');
    }
  });

  // Update Amenity Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => amenityApi.updateAmenity(id, data),
    onSuccess: () => {
      toast.success('Amenity updated successfully!');
      setEditingAmenity(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-amenities'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update amenity');
    }
  });

  // Emergency Override Mutation
  const overrideMutation = useMutation({
    mutationFn: (data) => amenityApi.adminOverride(data),
    onSuccess: () => {
      toast.success('Emergency pass override granted and audited!');
      setIsOverrideModalOpen(false);
      setOverrideReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-amenity-logs'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Override failed');
    }
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setOpeningTime('06:00');
    setClosingTime('22:00');
    setMonthlyPriceRupees('1200');
    setQuarterlyPriceRupees('3200');
  };

  const handleOpenEdit = (a) => {
    setEditingAmenity(a);
    setName(a.name);
    setDescription(a.description || '');
    setOpeningTime(a.openingTime || '06:00');
    setClosingTime(a.closingTime || '22:00');
    const monthPlan = a.plans?.find(p => p.planId === 'PER_MONTH');
    const quarterPlan = a.plans?.find(p => p.planId === 'THREE_MONTHS');
    setMonthlyPriceRupees(monthPlan ? String(monthPlan.priceInPaise / 100) : '1200');
    setQuarterlyPriceRupees(quarterPlan ? String(quarterPlan.priceInPaise / 100) : '3200');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Amenity name is required');

    const plans = [
      {
        planId: 'PER_MONTH',
        name: 'Monthly Pass',
        durationDays: 30,
        priceInPaise: Math.round(Number(monthlyPriceRupees) * 100),
        isActive: true
      },
      {
        planId: 'THREE_MONTHS',
        name: 'Quarterly Pass',
        durationDays: 90,
        priceInPaise: Math.round(Number(quarterlyPriceRupees) * 100),
        isActive: true
      }
    ];

    const payload = {
      name: name.trim(),
      description: description.trim(),
      openingTime,
      closingTime,
      plans
    };

    if (editingAmenity) {
      updateMutation.mutate({ id: editingAmenity._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleToggleActive = (amenity) => {
    updateMutation.mutate({
      id: amenity._id,
      data: { isActive: !amenity.isActive }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-accent" />
            Society Amenities & Access Passes
          </h1>
          <p className="text-text-secondary text-sm">
            Manage sports clubs, fitness centers, subscription rates, and access audit logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            icon={<RefreshCw className={`w-4 h-4 ${isLoadingAmenities ? 'animate-spin' : ''}`} />}
            onClick={() => refetchAmenities()}
          >
            Refresh
          </Button>
          <Button 
            variant="secondary" 
            icon={<Key className="w-4 h-4 text-warning" />}
            onClick={() => setIsOverrideModalOpen(true)}
          >
            Admin Override Pass
          </Button>
          <Button 
            variant="primary" 
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
          >
            Add Facility
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border-muted pb-3">
        <button
          onClick={() => setActiveTab('AMENITIES')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'AMENITIES'
              ? 'bg-accent text-surface-main'
              : 'bg-surface-card text-text-secondary hover:text-text-primary border border-border-muted'
          }`}
        >
          All Facilities ({amenities.length})
        </button>
        <button
          onClick={() => setActiveTab('LOGS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'LOGS'
              ? 'bg-accent text-surface-main'
              : 'bg-surface-card text-text-secondary hover:text-text-primary border border-border-muted'
          }`}
        >
          Turnstile / Scan Logs
        </button>
      </div>

      {/* AMENITIES TAB */}
      {activeTab === 'AMENITIES' && (
        <>
          {isLoadingAmenities ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          ) : amenities.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="w-12 h-12 text-text-secondary" />}
              title="No society amenities registered"
              description="Add your first amenity facility (e.g. Swimming Pool, Gymnasium, Squash Court)."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {amenities.map((amenity) => (
                <Card key={amenity._id} className="border border-border-muted p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-text-primary text-base">
                          {amenity.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{amenity.openingTime} &mdash; {amenity.closingTime}</span>
                        </div>
                      </div>
                      <Badge variant={amenity.isActive ? 'success' : 'danger'}>
                        {amenity.isActive ? 'Operational' : 'Closed / Maintenance'}
                      </Badge>
                    </div>

                    <p className="text-xs text-text-secondary line-clamp-2 mb-4 leading-relaxed">
                      {amenity.description || 'Premium residential clubhouse facility.'}
                    </p>

                    {/* Subscription Rates */}
                    <div className="p-3 rounded-xl bg-surface-secondary border border-border-muted text-xs space-y-1.5 mb-4">
                      <div className="font-semibold text-text-secondary text-[11px] uppercase tracking-wider">
                        Subscription Tariff
                      </div>
                      {(amenity.plans || []).map((p) => (
                        <div key={p.planId} className="flex justify-between items-center text-xs">
                          <span className="text-text-primary">{p.name}</span>
                          <span className="font-mono font-bold text-accent">{formatCurrency(p.priceInPaise)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border-muted/50 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleToggleActive(amenity)}
                      className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1"
                    >
                      {amenity.isActive ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-success" /> Mark Under Maintenance
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-danger" /> Re-open Facility
                        </>
                      )}
                    </button>

                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit3 className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenEdit(amenity)}
                    >
                      Edit
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* SCAN LOGS TAB */}
      {activeTab === 'LOGS' && (
        <div>
          {isLoadingLogs ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          ) : entryLogs.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-12 h-12 text-text-secondary" />}
              title="No access logs recorded"
              description="Turnstile scans and security guard QR verifications will be recorded here."
            />
          ) : (
            <div className="bg-surface-card border border-border-muted rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-secondary text-text-secondary uppercase tracking-wider text-[11px] border-b border-border-muted">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Resident</th>
                    <th className="py-3.5 px-4 font-semibold">Amenity</th>
                    <th className="py-3.5 px-4 font-semibold">Decision</th>
                    <th className="py-3.5 px-4 font-semibold">Verified By</th>
                    <th className="py-3.5 px-4 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-muted/50 text-text-secondary">
                  {entryLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-text-primary">
                        {log.user?.name || 'Resident'}
                        <span className="block text-[11px] text-text-secondary font-mono">
                          Flat {log.user?.flatNumber || '-'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-text-primary">
                        {log.amenity?.name || 'Facility'}
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant={log.granted ? 'success' : 'danger'}>
                          {log.granted ? 'Granted' : 'Denied'}
                        </Badge>
                        {log.reason && (
                          <span className="block text-[10px] text-danger mt-0.5">{log.reason}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-text-secondary font-mono text-[11px]">
                        {log.verifiedBy?.name || 'Gate Scanner'}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        {formatDateTime(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Amenity Modal */}
      <Modal
        isOpen={isCreateModalOpen || !!editingAmenity}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingAmenity(null);
          resetForm();
        }}
        title={editingAmenity ? `Edit ${editingAmenity.name}` : 'Register New Amenity Facility'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Facility Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Olympic Swimming Pool, Tennis Court, Gymnasium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Overview of equipment, coaching, and facilities..."
              rows={3}
              className="w-full bg-surface-secondary border border-border-muted rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Opening Time *</label>
              <Input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Closing Time *</label>
              <Input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="p-3.5 bg-surface-secondary border border-border-muted rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Subscription Rates (₹)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Monthly Pass (₹) *</label>
                <Input
                  type="number"
                  value={monthlyPriceRupees}
                  onChange={(e) => setMonthlyPriceRupees(e.target.value)}
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Quarterly Pass (₹) *</label>
                <Input
                  type="number"
                  value={quarterlyPriceRupees}
                  onChange={(e) => setQuarterlyPriceRupees(e.target.value)}
                  required
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border-muted">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingAmenity(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingAmenity ? 'Save Facility' : 'Create Facility'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Emergency Admin Override Modal */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Admin Emergency Amenity Access Override"
      >
        <div className="space-y-4">
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-xl text-warning text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Grants 1-time bypass access to an amenity without an active paid subscription. Audited with your Admin ID.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Target Resident *</label>
            <select
              value={overrideUserId}
              onChange={(e) => setOverrideUserId(e.target.value)}
              className="w-full bg-surface-secondary border border-border-muted rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent"
            >
              <option value="">Select Resident...</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} (Tower {u.tower} - {u.flatNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Amenity Facility *</label>
            <select
              value={overrideAmenityId}
              onChange={(e) => setOverrideAmenityId(e.target.value)}
              className="w-full bg-surface-secondary border border-border-muted rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent"
            >
              <option value="">Select Amenity...</option>
              {amenities.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Mandatory Override Justification *</label>
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Society sports day competition, trial guest pass, technical card issue..."
              rows={3}
              className="w-full bg-surface-secondary border border-border-muted rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border-muted">
            <Button variant="ghost" onClick={() => setIsOverrideModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!overrideUserId || !overrideAmenityId || overrideReason.trim().length < 5}
              loading={overrideMutation.isPending}
              onClick={() => overrideMutation.mutate({
                userId: overrideUserId,
                amenityId: overrideAmenityId,
                overrideReason: overrideReason.trim()
              })}
            >
              Authorize Pass Override
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
