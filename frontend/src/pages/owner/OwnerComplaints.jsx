import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Plus, CheckCircle2, Clock, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/forms/Input';
import Select from '../../components/forms/Select';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { complaintApi } from '../../services/api/complaintApi';
import { COMPLAINT_CATEGORY } from '../../constants';
import { formatDate } from '../../utils/formatters';

const complaintSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM')
});

export const OwnerComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      category: 'PLUMBING',
      priority: 'MEDIUM'
    }
  });

  const fetchComplaints = async () => {
    try {
      const data = await complaintApi.getMyComplaints({ limit: 50 });
      setComplaints(data?.items || []);
    } catch {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await complaintApi.createComplaint(data);
      toast.success('Complaint ticket submitted successfully!');
      setIsCreateModalOpen(false);
      reset();
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-muted">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">Resident Helpdesk</h2>
          <p className="text-xs text-text-secondary mt-1">
            Submit service requests, maintenance tickets, and track resolution timelines.
          </p>
        </div>

        <Button icon={Plus} onClick={() => setIsCreateModalOpen(true)}>
          Raise New Complaint
        </Button>
      </div>

      {loading ? (
        <Loader message="Loading complaints..." />
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No complaints filed"
          description="Everything seems to be working smoothly in your flat."
          actionLabel="File a request"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <Card key={c._id} className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-muted/60">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-accent font-mono">#{c.complaintNumber}</span>
                  <Badge status={c.category} />
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      c.priority === 'URGENT'
                        ? 'bg-status-danger/20 text-status-danger'
                        : 'bg-bg-elevated text-text-secondary border border-border-muted'
                    }`}
                  >
                    {c.priority} Priority
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge status={c.status} />
                  <span className="text-[11px] text-text-secondary">{formatDate(c.createdAt)}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-text-primary mb-1">{c.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">{c.description}</p>
              </div>

              {/* Admin notes & resolution details */}
              {(c.adminNotes || c.resolutionDetails || c.assignedTo) && (
                <div className="p-3.5 rounded-xl bg-bg-elevated border border-border-muted text-xs space-y-1.5">
                  {c.assignedTo && (
                    <div className="flex items-center gap-2 text-text-secondary">
                      <UserCheck className="w-3.5 h-3.5 text-accent" />
                      <span>Assigned Staff: <strong className="text-text-primary">{c.assignedTo.name}</strong></span>
                    </div>
                  )}
                  {c.adminNotes && (
                    <p className="text-text-secondary">
                      <strong className="text-text-primary">Admin Note:</strong> {c.adminNotes}
                    </p>
                  )}
                  {c.resolutionDetails && (
                    <p className="text-status-success font-medium">
                      <strong>Resolution Details:</strong> {c.resolutionDetails}
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* New Complaint Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Submit New Helpdesk Complaint"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Complaint Title"
            placeholder="e.g. Water seepage in bedroom wall"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Category"
              options={Object.keys(COMPLAINT_CATEGORY).map((key) => ({
                value: key,
                label: key.replace('_', ' ')
              }))}
              error={errors.category?.message}
              {...register('category')}
            />

            <Select
              label="Priority Level"
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' }
              ]}
              error={errors.priority?.message}
              {...register('priority')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Detailed Description</label>
            <textarea
              rows={4}
              placeholder="Provide exact location and nature of the issue..."
              className="w-full bg-bg-card border border-border-muted rounded-lg p-3 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
              {...register('description')}
            />
            {errors.description && <p className="mt-1 text-xs text-status-danger">{errors.description.message}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OwnerComplaints;
