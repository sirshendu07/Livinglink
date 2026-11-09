import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, Search, Filter, AlertCircle, Clock, CheckCircle2, 
  Home, Phone, User, RefreshCw, MessageSquare, ShieldAlert
} from 'lucide-react';
import { complaintApi } from '../../services/api/complaintApi';
import { userApi } from '../../services/api/userApi';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/forms/Input';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatDateTime, getRelativeTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function AdminComplaints() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Update Status Modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');
  const [adminNotes, setAdminNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  // Complaints Query
  const { data: complaintsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-complaints', statusFilter, priorityFilter],
    queryFn: () => complaintApi.getAllAdmin({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
      limit: 100
    })
  });

  // Staff Query for Assignment
  const { data: staffData } = useQuery({
    queryKey: ['admin-staff-list'],
    queryFn: () => userApi.getUsers({ role: 'SECURITY', limit: 50 }),
    enabled: !!selectedComplaint
  });

  const complaints = complaintsData?.complaints || [];
  const staff = staffData?.users || [];

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => complaintApi.updateStatus(id, data),
    onSuccess: (updated) => {
      toast.success(`Complaint status changed to ${updated.status}`);
      setSelectedComplaint(null);
      setAdminNotes('');
      setAssignedTo('');
      queryClient.invalidateQueries({ queryKey: ['admin-complaints'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update complaint');
    }
  });

  const handleOpenUpdate = (complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setAdminNotes(complaint.adminNotes || '');
    setAssignedTo(complaint.assignedTo?._id || '');
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      id: selectedComplaint._id,
      data: {
        status: newStatus,
        adminNotes: adminNotes.trim() || undefined,
        assignedTo: assignedTo || undefined
      }
    });
  };

  const filteredComplaints = complaints.filter((c) => {
    const titleMatch = c.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const descMatch = c.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const residentMatch = c.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const flatMatch = c.owner?.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || descMatch || residentMatch || flatMatch;
  });

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'URGENT':
        return <Badge variant="danger" className="animate-pulse">URGENT</Badge>;
      case 'HIGH':
        return <Badge variant="warning">High</Badge>;
      case 'MEDIUM':
        return <Badge variant="info">Medium</Badge>;
      case 'LOW':
      default:
        return <Badge variant="default">Low</Badge>;
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'RESOLVED':
        return <Badge variant="success">Resolved</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning">In Progress</Badge>;
      case 'OPEN':
        return <Badge variant="danger">Open</Badge>;
      case 'REJECTED':
        return <Badge variant="default">Closed / Rejected</Badge>;
      default:
        return <Badge variant="default">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <FileText className="w-7 h-7 text-accent" />
            Resident Grievances & Work Tickets
          </h1>
          <p className="text-text-secondary text-sm">
            Triage facility maintenance, security incidents, noise issues, and assign field staff.
          </p>
        </div>
        <Button 
          variant="secondary" 
          icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={() => refetch()}
        >
          Refresh Tickets
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6">
          <Input
            placeholder="Search tickets by title, description, resident, or flat..."
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
            <option value="OPEN">Open (New)</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div className="sm:col-span-3">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full bg-surface-card border border-border-muted rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-12 h-12 text-success" />}
          title="No grievances matching filter"
          description="All resident complaints have been addressed or none submitted under this category."
        />
      ) : (
        <div className="space-y-3">
          {filteredComplaints.map((c) => (
            <Card key={c._id} className="border border-border-muted hover:border-border-muted/80 p-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(c.status)}
                    {getPriorityBadge(c.priority)}
                    <span className="text-xs bg-surface-secondary px-2.5 py-0.5 rounded-md font-mono text-text-secondary uppercase">
                      {c.category}
                    </span>
                    <span className="text-xs text-text-secondary font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {getRelativeTime(c.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-text-primary">
                    {c.title}
                  </h3>

                  <p className="text-xs text-text-secondary whitespace-pre-line leading-relaxed max-w-3xl">
                    {c.description}
                  </p>

                  {/* Resident Info */}
                  <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-text-secondary border-t border-border-muted/40">
                    <span className="flex items-center gap-1 text-text-primary font-medium">
                      <Home className="w-3.5 h-3.5 text-accent" />
                      Tower {c.owner?.tower} &mdash; Flat {c.owner?.flatNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-text-secondary" />
                      {c.owner?.name}
                    </span>
                    {c.owner?.phone && (
                      <a href={`tel:${c.owner.phone}`} className="flex items-center gap-1 text-accent font-mono hover:underline">
                        <Phone className="w-3.5 h-3.5" />
                        {c.owner.phone}
                      </a>
                    )}
                    {c.assignedTo && (
                      <span className="text-info font-medium">
                        Assigned to: {c.assignedTo.name}
                      </span>
                    )}
                  </div>

                  {c.adminNotes && (
                    <div className="p-2.5 rounded-lg bg-surface-secondary text-xs text-text-primary border border-border-muted">
                      <strong>Admin Resolution Notes:</strong> {c.adminNotes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 md:flex-col md:items-end flex-shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs font-semibold"
                    onClick={() => handleOpenUpdate(c)}
                  >
                    Update Ticket
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Update Ticket Modal */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title={`Manage Ticket: ${selectedComplaint?.title}`}
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Ticket Status *</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full bg-surface-secondary border border-border-muted rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent"
            >
              <option value="OPEN">Open (Needs Attention)</option>
              <option value="IN_PROGRESS">In Progress (Work Assigned)</option>
              <option value="RESOLVED">Resolved (Work Completed)</option>
              <option value="REJECTED">Rejected / Closed (Not Actionable)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Assign Security / Maintenance Staff</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full bg-surface-secondary border border-border-muted rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent"
            >
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Official Resolution & Work Notes</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Provide technician findings, expected resolution time, or closure reasons..."
              rows={4}
              className="w-full bg-surface-secondary border border-border-muted rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border-muted">
            <Button type="button" variant="ghost" onClick={() => setSelectedComplaint(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={updateMutation.isPending}>
              Save Updates
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
