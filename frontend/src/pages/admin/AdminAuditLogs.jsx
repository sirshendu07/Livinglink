import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  History, Search, Filter, ShieldCheck, Clock, 
  User, RefreshCw, Key, FileText, ChevronRight
} from 'lucide-react';
import { userApi } from '../../services/api/userApi';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/forms/Input';
import EmptyState from '../../components/common/EmptyState';
import { formatDateTime, getRelativeTime } from '../../utils/formatters';

export default function AdminAuditLogs() {
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-audit-logs', selectedAction],
    queryFn: () => userApi.getAuditLogs({
      action: selectedAction === 'ALL' ? undefined : selectedAction,
      limit: 100
    })
  });

  const logs = logsData?.items || [];

  const filteredLogs = logs.filter((log) => {
    const actorName = log.actor?.name?.toLowerCase() || '';
    const actionName = log.action?.toLowerCase() || '';
    const resource = log.resourceType?.toLowerCase() || '';
    const query = searchTerm.toLowerCase();
    return actorName.includes(query) || actionName.includes(query) || resource.includes(query);
  });

  const getActionBadge = (action) => {
    if (action.includes('OVERRIDE')) {
      return <Badge variant="danger">{action}</Badge>;
    }
    if (action.includes('SOS')) {
      return <Badge variant="warning">{action}</Badge>;
    }
    if (action.includes('WAIVER') || action.includes('STATUS')) {
      return <Badge variant="accent">{action}</Badge>;
    }
    return <Badge variant="info">{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <History className="w-7 h-7 text-accent" />
            Society Governance &amp; Audit Trail
          </h1>
          <p className="text-text-secondary text-sm">
            Immutable system logs of administrative actions, emergency overrides, waivers, and admission decisions.
          </p>
        </div>
        <Button 
          variant="secondary" 
          icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={() => refetch()}
        >
          Refresh Logs
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-7">
          <Input
            placeholder="Search by officer name, action keyword, or resource..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-text-secondary" />}
          />
        </div>
        <div className="sm:col-span-5">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full bg-surface-card border border-border-muted rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent"
          >
            <option value="ALL">All Actions</option>
            <option value="APPROVE_OWNER">APPROVE_OWNER</option>
            <option value="UPDATE_USER_STATUS">UPDATE_USER_STATUS</option>
            <option value="GENERATE_BULK_INVOICES">GENERATE_BULK_INVOICES</option>
            <option value="RECORD_MAINTENANCE_WAIVER">RECORD_MAINTENANCE_WAIVER</option>
            <option value="ADMIN_OVERRIDE_AMENITY_ACCESS">ADMIN_OVERRIDE_AMENITY_ACCESS</option>
            <option value="ADMIN_OVERRIDE_VISITOR_ENTRY">ADMIN_OVERRIDE_VISITOR_ENTRY</option>
            <option value="RESOLVE_SOS">RESOLVE_SOS</option>
            <option value="UPDATE_COMPLAINT_STATUS">UPDATE_COMPLAINT_STATUS</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon={<History className="w-12 h-12 text-text-secondary" />}
          title="No audit events found"
          description="Actions performed by admins or security personnel will be timestamped and preserved here."
        />
      ) : (
        <div className="bg-surface-card border border-border-muted rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary text-text-secondary uppercase tracking-wider text-[11px] border-b border-border-muted">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold">Actor / Officer</th>
                  <th className="py-3.5 px-4 font-semibold">Event Action</th>
                  <th className="py-3.5 px-4 font-semibold">Target Resource</th>
                  <th className="py-3.5 px-4 font-semibold">Metadata &amp; Parameters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted/50 text-text-secondary">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                      <div>{formatDateTime(log.createdAt)}</div>
                      <div className="text-text-secondary/60 text-[10px]">{getRelativeTime(log.createdAt)}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text-primary">
                        {log.actor?.name || 'System / Automated'}
                      </div>
                      <div className="text-[11px] text-accent font-mono">
                        {log.actorRole || log.actor?.role || 'SYSTEM'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getActionBadge(log.action)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-text-primary">
                      {log.resourceType}
                      {log.resourceId && (
                        <span className="block text-[10px] text-text-secondary truncate max-w-[120px]">
                          {log.resourceId}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] max-w-xs">
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <div className="bg-surface-main/80 p-1.5 rounded border border-border-muted text-text-primary text-[10px] truncate" title={JSON.stringify(log.details, null, 2)}>
                          {JSON.stringify(log.details)}
                        </div>
                      ) : (
                        <span className="text-text-secondary italic">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
