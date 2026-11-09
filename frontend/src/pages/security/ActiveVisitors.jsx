import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, LogOut, Clock, Search, Home, Car, Phone, AlertCircle, RefreshCw 
} from 'lucide-react';
import { visitorApi } from '../../services/api/visitorApi';
import { useSocket } from '../../context/SocketContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/forms/Input';
import EmptyState from '../../components/common/EmptyState';
import { formatDateTime, getRelativeTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function ActiveVisitors() {
  const queryClient = useQueryClient();
  const { on, off } = useSocket();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: visitorsData, isLoading, refetch } = useQuery({
    queryKey: ['active-visitors'],
    queryFn: () => visitorApi.getAllVisitors({ status: 'ENTERED', limit: 100 }),
    refetchInterval: 15000
  });

  const activeVisitors = (visitorsData?.visitors || []).filter(v => v.status === 'ENTERED');

  // Socket updates
  useEffect(() => {
    const handleRefresh = () => {
      queryClient.invalidateQueries({ queryKey: ['active-visitors'] });
    };

    on('visitor:entered', handleRefresh);
    on('visitor:exited', handleRefresh);
    on('visitor:status:updated', handleRefresh);

    return () => {
      off('visitor:entered', handleRefresh);
      off('visitor:exited', handleRefresh);
      off('visitor:status:updated', handleRefresh);
    };
  }, [on, off, queryClient]);

  // Log exit mutation
  const exitMutation = useMutation({
    mutationFn: (id) => visitorApi.markExited(id),
    onSuccess: (updated) => {
      toast.success(`Exit logged for ${updated.name}`);
      queryClient.invalidateQueries({ queryKey: ['active-visitors'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to log exit');
    }
  });

  const filteredVisitors = activeVisitors.filter((v) => {
    return (
      v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.phone?.includes(searchTerm) ||
      v.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.tower?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate elapsed time in hours
  const getElapsedDuration = (enteredAt) => {
    if (!enteredAt) return 'Just now';
    const start = new Date(enteredAt);
    const now = new Date();
    const diffMs = now - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m`;
    }
    return `${diffMins}m`;
  };

  const isOverstaying = (enteredAt) => {
    if (!enteredAt) return false;
    const diffMs = new Date() - new Date(enteredAt);
    return diffMs > 4 * 60 * 60 * 1000; // > 4 hours
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Active Visitors Inside Society
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-sm font-semibold">
              {activeVisitors.length} Present
            </span>
          </div>
          <p className="text-text-secondary text-sm">
            Real-time occupancy tracking for safety, security, and gate exit management.
          </p>
        </div>
        <Button 
          variant="secondary" 
          icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={() => refetch()}
        >
          Refresh List
        </Button>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <Input
          placeholder="Filter by name, flat, phone, or vehicle plate..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-text-secondary" />}
        />
      </div>

      {/* Visitor Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : filteredVisitors.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12 text-text-secondary" />}
          title="No visitors currently inside"
          description={searchTerm ? "No matches found for your filter." : "The campus currently has zero active visitor passes checked in."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVisitors.map((visitor) => {
            const overstay = isOverstaying(visitor.enteredAt);
            const duration = getElapsedDuration(visitor.enteredAt);

            return (
              <Card 
                key={visitor._id} 
                className={`border transition-all duration-200 ${
                  overstay ? 'border-warning/50 bg-warning/5' : 'border-border-muted bg-surface-card'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-text-primary text-base">
                      {visitor.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Entered: {formatDateTime(visitor.enteredAt)}</span>
                    </div>
                  </div>
                  <Badge variant={overstay ? "warning" : "info"}>
                    {duration} inside
                  </Badge>
                </div>

                {overstay && (
                  <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Long stay flag (&gt; 4 hours on campus)</span>
                  </div>
                )}

                <div className="space-y-2 text-xs text-text-secondary border-t border-border-muted/50 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-text-primary font-medium">
                      <Home className="w-3.5 h-3.5 text-accent" />
                      Tower {visitor.tower} - Flat {visitor.flatNumber}
                    </span>
                    <span className="bg-surface-elevated px-2 py-0.5 rounded text-[11px] font-mono">
                      {visitor.purpose || 'Visitor'}
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
                      <span>Vehicle: {visitor.vehicleNumber}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border-muted">
                  <Button
                    variant="secondary"
                    className="w-full border-border-muted hover:border-danger hover:text-danger text-text-secondary"
                    icon={<LogOut className="w-4 h-4" />}
                    loading={exitMutation.isPending && exitMutation.variables === visitor._id}
                    onClick={() => exitMutation.mutate(visitor._id)}
                  >
                    Log Gate Exit
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
