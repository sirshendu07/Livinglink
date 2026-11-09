import React, { useState, useEffect } from 'react';
import { Search, Bell, AlertTriangle, Pin, CheckCircle2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Input from '../../components/forms/Input';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { noticeApi } from '../../services/api/noticeApi';
import { formatDate } from '../../utils/formatters';

export const OwnerNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const data = await noticeApi.getPublished({
        category: category || undefined,
        search: search || undefined,
        page,
        limit: 10
      });
      setNotices(data?.items || []);
      setTotalPages(data?.totalPages || 1);
    } catch {
      toast.error('Failed to load society notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [category, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchNotices();
  };

  const handleMarkRead = async (noticeId) => {
    try {
      await noticeApi.markRead(noticeId);
      toast.success('Marked as read');
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-muted">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">Society Notices</h2>
          <p className="text-xs text-text-secondary mt-1">Official circulars, maintenance schedules, and community alerts.</p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {['', 'URGENT', 'IMPORTANT', 'GENERAL'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                category === cat
                  ? 'bg-accent text-[#0B0D10]'
                  : 'bg-bg-card border border-border-muted text-text-secondary hover:text-text-primary'
              }`}
            >
              {cat || 'All Notices'}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
        <Input
          placeholder="Search notices by keyword..."
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="secondary" size="md">
          Search
        </Button>
      </form>

      {/* Notices List */}
      {loading ? (
        <Loader message="Fetching notices..." />
      ) : notices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notices found"
          description="There are currently no society circulars matching your search."
        />
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <Card
              key={notice._id}
              className={`border-l-4 ${
                notice.category === 'URGENT'
                  ? 'border-l-status-danger bg-status-danger/5'
                  : notice.category === 'IMPORTANT'
                  ? 'border-l-accent'
                  : 'border-l-border-muted'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {notice.isPinned && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-accent bg-accent/15 px-2 py-0.5 rounded border border-accent/25">
                      <Pin className="w-3 h-3" />
                      Pinned
                    </span>
                  )}
                  <Badge status={notice.category} />
                  <span className="text-xs text-text-secondary flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-text-secondary" />
                    {formatDate(notice.publishedAt || notice.createdAt)}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  icon={CheckCircle2}
                  onClick={() => handleMarkRead(notice._id)}
                  className="text-xs text-text-secondary hover:text-accent self-start"
                >
                  Mark Read
                </Button>
              </div>

              <h3 className="text-base font-bold text-text-primary mb-2">{notice.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">{notice.content}</p>

              {notice.author && (
                <div className="mt-4 pt-3 border-t border-border-muted/50 text-[11px] text-text-secondary flex items-center justify-between">
                  <span>Issued by: {notice.author.name} ({notice.author.role})</span>
                  {notice.expiresAt && <span>Expires: {formatDate(notice.expiresAt)}</span>}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-xs text-text-secondary px-3">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default OwnerNotices;
