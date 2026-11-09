import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ShieldCheck, Shield, UserPlus, Phone, Mail, 
  Lock, RefreshCw, CheckCircle2, XCircle, Search
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

export default function AdminStaff() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('SECURITY');

  // Query Staff
  const { data: staffData, isLoading, refetch } = useQuery({
    queryKey: ['admin-staff-accounts'],
    queryFn: async () => {
      const [admins, guards] = await Promise.all([
        userApi.getUsers({ role: 'ADMIN', limit: 50 }),
        userApi.getUsers({ role: 'SECURITY', limit: 50 })
      ]);
      return [...(admins?.users || []), ...(guards?.users || [])];
    }
  });

  const staffMembers = staffData || [];

  // Create Staff Mutation
  const createMutation = useMutation({
    mutationFn: (data) => userApi.createStaff(data),
    onSuccess: (newStaff) => {
      toast.success(`Account created for ${newStaff.name} (${newStaff.role})!`);
      setIsAddModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-staff-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create staff account');
    }
  });

  // Status Mutation
  const statusMutation = useMutation({
    mutationFn: ({ userId, status }) => userApi.updateStatus(userId, status),
    onSuccess: (updated) => {
      toast.success(`Account updated to ${updated.status}`);
      queryClient.invalidateQueries({ queryKey: ['admin-staff-accounts'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  });

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole('SECURITY');
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      return toast.error('All fields are required');
    }
    if (password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }

    createMutation.mutate({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      role
    });
  };

  const filteredStaff = staffMembers.filter((s) => {
    const matchesSearch = 
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone?.includes(searchTerm);
    
    if (roleFilter === 'ALL') return matchesSearch;
    return matchesSearch && s.role === roleFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-accent" />
            Security Force & Administration Staff
          </h1>
          <p className="text-text-secondary text-sm">
            Issue credentialed access for perimeter security guards and society trustees.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button 
            variant="primary" 
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
          >
            Create Staff Account
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8">
          <Input
            placeholder="Search staff by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-text-secondary" />}
          />
        </div>
        <div className="sm:col-span-4">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-surface-card border border-border-muted rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Roles</option>
            <option value="SECURITY">Security Officers</option>
            <option value="ADMIN">Society Administrators</option>
          </select>
        </div>
      </div>

      {/* Staff Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : filteredStaff.length === 0 ? (
        <EmptyState
          icon={<Shield className="w-12 h-12 text-text-secondary" />}
          title="No staff personnel found"
          description="Click 'Create Staff Account' to provision access for guards and admins."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((person) => (
            <Card key={person._id} className="border border-border-muted p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      person.role === 'ADMIN' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-info/10 text-info border border-info/20'
                    }`}>
                      {person.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary text-base">
                        {person.name}
                      </h3>
                      <Badge variant={person.role === 'ADMIN' ? 'accent' : 'info'} className="mt-0.5">
                        {person.role === 'ADMIN' ? 'Administrator' : 'Security Guard'}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant={person.status === 'ACTIVE' ? 'success' : 'danger'}>
                    {person.status}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-text-secondary pt-3 border-t border-border-muted/50 font-mono">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-text-secondary" />
                    <span>{person.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-text-secondary" />
                    <a href={`tel:${person.phone}`} className="hover:text-accent">
                      {person.phone}
                    </a>
                  </div>
                  <div className="text-[11px] text-text-secondary/70 pt-1 font-sans">
                    Joined: {formatDate(person.createdAt)}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border-muted/50 flex justify-end">
                {person.status === 'ACTIVE' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-danger hover:bg-danger/10"
                    loading={statusMutation.isPending && statusMutation.variables?.userId === person._id}
                    onClick={() => {
                      if (confirm(`Suspend access for ${person.name}?`)) {
                        statusMutation.mutate({ userId: person._id, status: 'SUSPENDED' });
                      }
                    }}
                  >
                    Revoke Access
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs text-success border-success/30 hover:bg-success/10"
                    loading={statusMutation.isPending && statusMutation.variables?.userId === person._id}
                    onClick={() => statusMutation.mutate({ userId: person._id, status: 'ACTIVE' })}
                  >
                    Reactivate Account
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="Provision Staff / Officer Account"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <p className="text-xs text-text-secondary">
            Staff accounts are pre-approved without flat requirements and have dedicated portal access.
          </p>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">System Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-surface-secondary border border-border-muted rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent"
            >
              <option value="SECURITY">Security Guard (Gate Operations, Turnstile Scanner, SOS)</option>
              <option value="ADMIN">System Administrator (Full Management Oversight)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Full Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar (Main Gate Officer)"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Official Email *</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="guard.gate1@livinglink.io"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Mobile Number *</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Initial Password *</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border-muted">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createMutation.isPending}
            >
              Provision Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
