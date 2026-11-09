import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, Pin, Trash2, Edit3, Eye, Plus, Search, 
  Calendar, CheckCircle2, Clock, AlertTriangle, RefreshCw
} from 'lucide-react';
import { noticeApi } from '../../services/api/noticeApi';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/forms/Input';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function AdminNotices() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [selectedReaderNotice, setSelectedReaderNotice] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [isPinned, setIsPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');

  // Fetch all notices for admin
  const { data: noticesData, isLoading, refetch } = useQuery({
    queryKey: ['admin-notices'],
    queryFn: () => noticeApi.getAllAdmin({ limit: 100 })
  });

  const notices = noticesData?.notices || [];

  // Readership data query
  const { data: readerData, isLoading: isLoadingReaders } = useQuery({
    queryKey: ['notice-readers', selectedReaderNotice?._id],
    queryFn: () => noticeApi.getReaders(selectedReaderNotice._id),
    enabled: !!selectedReaderNotice
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => noticeApi.createNotice(data),
    onSuccess: () => {
      toast.success('Notice published to community!');
      setIsCreateModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-notices'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to publish notice');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => noticeApi.updateNotice(id, data),
    onSuccess: () => {
      toast.success('Notice updated successfully!');
      setEditingNotice(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-notices'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update notice');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => noticeApi.deleteNotice(id),
    onSuccess: () => {
      toast.success('Notice deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-notices'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete notice');
    }
  });

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('GENERAL');
    setIsPinned(false);
    setExpiresAt('');
  };

  const handleOpenEdit = (n) => {
    setEditingNotice(n);
    setTitle(n.title);
    setContent(n.content);
    setCategory(n.category);
    setIsPinned(n.isPinned);
    setExpiresAt(n.expiresAt ? n.expiresAt.split('T')[0] : '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      return toast.error('Title and content are required');
    }

    const payload = {
      title: title.trim(),
      content: content.trim(),
      category,
      isPinned,
      expiresAt: expiresAt || undefined
    };

    if (editingNotice) {
      updateMutation.mutate({ id: editingNotice._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredNotices = notices.filter((n) => {
    const matchesSearch = 
      n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (categoryFilter === 'ALL') return matchesSearch;
    return matchesSearch && n.category === categoryFilter;
  });

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'URGENT':
        return <Badge variant="danger" className="animate-pulse">URGENT</Badge>;
      case 'IMPORTANT':
        return <Badge variant="warning">IMPORTANT</Badge>;
      case 'GENERAL':
      default:
        return <Badge variant="info">GENERAL</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Bell className="w-7 h-7 text-accent" />
            Society Notice Board & Broadcasts
          </h1>
          <p className="text-text-secondary text-sm">
            Publish circulars, categorize announcements, and monitor readership metrics.
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
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
          >
            Broadcast Notice
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8">
          <Input
            placeholder="Search circulars by headline or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-text-secondary" />}
          />
        </div>
        <div className="sm:col-span-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-surface-card border border-border-muted rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Categories</option>
            <option value="URGENT">Urgent Circulars</option>
            <option value="IMPORTANT">Important Announcements</option>
            <option value="GENERAL">General Information</option>
          </select>
        </div>
      </div>

      {/* Notices Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : filteredNotices.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-12 h-12 text-text-secondary" />}
          title="No notices found"
          description="Click 'Broadcast Notice' to compose your first society announcement."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotices.map((notice) => (
            <Card key={notice._id} className="border border-border-muted p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getCategoryBadge(notice.category)}
                    {notice.isPinned && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-md">
                        <Pin className="w-3 h-3 fill-accent" /> PINNED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-text-secondary">
                    <button
                      onClick={() => handleOpenEdit(notice)}
                      className="p-1.5 rounded-lg hover:bg-surface-secondary text-text-secondary hover:text-text-primary"
                      title="Edit Notice"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete notice: "${notice.title}"?`)) {
                          deleteMutation.mutate(notice._id);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-danger/10 text-text-secondary hover:text-danger"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-text-primary mb-2">
                  {notice.title}
                </h3>
                <p className="text-xs text-text-secondary whitespace-pre-line line-clamp-3 mb-4 leading-relaxed">
                  {notice.content}
                </p>
              </div>

              <div className="pt-3 border-t border-border-muted/50 flex items-center justify-between text-xs text-text-secondary">
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDate(notice.createdAt)}</span>
                </div>

                <button
                  onClick={() => setSelectedReaderNotice(notice)}
                  className="flex items-center gap-1.5 text-accent hover:underline font-mono text-[11px]"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{notice.readBy?.length || 0} Readers</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Compose / Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || !!editingNotice}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingNotice(null);
          resetForm();
        }}
        title={editingNotice ? 'Edit Society Notice' : 'Broadcast Society Circular'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Headline / Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scheduled Lift Maintenance in Tower B"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Notice Urgency / Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-surface-secondary border border-border-muted rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent"
              >
                <option value="GENERAL">General Notice</option>
                <option value="IMPORTANT">Important Announcement</option>
                <option value="URGENT">Urgent Alert (Banner)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Expiration Date (Optional)</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-surface-secondary border border-border-muted rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Notice Circular Body *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide complete details, dates, affected towers, and contact instructions..."
              rows={5}
              required
              className="w-full bg-surface-secondary border border-border-muted rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="pinNotice"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded border-border-muted text-accent focus:ring-accent"
            />
            <label htmlFor="pinNotice" className="text-xs text-text-primary cursor-pointer select-none">
              Pin to top of resident notice feeds
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border-muted">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingNotice(null);
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
              {editingNotice ? 'Save Changes' : 'Broadcast Now'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Readers Readership Analytics Modal */}
      <Modal
        isOpen={!!selectedReaderNotice}
        onClose={() => setSelectedReaderNotice(null)}
        title={`Readership Analytics: ${selectedReaderNotice?.title}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">
            Residents who have opened and acknowledged this circular:
          </p>

          {isLoadingReaders ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
            </div>
          ) : (readerData?.readers || []).length === 0 ? (
            <div className="text-center py-6 text-xs text-text-secondary">
              No read receipts recorded yet for this circular.
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {(readerData.readers || []).map((reader, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-surface-secondary border border-border-muted flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-text-primary">{reader.user?.name || 'Resident'}</span>
                    <span className="text-text-secondary ml-2 font-mono">
                      (Tower {reader.user?.tower} - {reader.user?.flatNumber})
                    </span>
                  </div>
                  <span className="text-text-secondary font-mono text-[11px]">
                    {formatDateTime(reader.readAt)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="ghost" onClick={() => setSelectedReaderNotice(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
