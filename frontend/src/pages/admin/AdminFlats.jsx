import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Building, Home, Users, Search, Phone, Mail, 
  CheckCircle2, XCircle, RefreshCw, Key
} from 'lucide-react';
import { userApi } from '../../services/api/userApi';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/forms/Input';
import EmptyState from '../../components/common/EmptyState';

export default function AdminFlats() {
  const [selectedTower, setSelectedTower] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: flatsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-flats', selectedTower],
    queryFn: () => userApi.getFlats({ 
      tower: selectedTower === 'ALL' ? undefined : selectedTower,
      limit: 100 
    })
  });

  const flats = flatsData?.items || [];

  const filteredFlats = flats.filter((flat) => {
    const flatMatches = flat.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        flat.tower?.toLowerCase().includes(searchTerm.toLowerCase());
    const residentMatches = (flat.residents || []).some(
      (r) => r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             r.phone?.includes(searchTerm) ||
             r.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return flatMatches || residentMatches;
  });

  const totalOccupied = flats.filter(f => f.residents?.length > 0).length;
  const totalVacant = flats.length - totalOccupied;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
              <Building className="w-7 h-7 text-accent" />
              Towers & Residential Units
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-elevated text-text-secondary font-mono text-xs">
              {flats.length} Total Units
            </span>
          </div>
          <p className="text-text-secondary text-sm">
            Apartment inventory, resident occupancy, and tenancy allocation records.
          </p>
        </div>
        <Button 
          variant="secondary" 
          icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={() => refetch()}
        >
          Refresh Inventory
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-surface-card border border-border-muted">
          <div className="text-xs text-text-secondary">Total Flats</div>
          <div className="text-xl font-bold font-mono text-text-primary mt-1">{flats.length}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-card border border-border-muted">
          <div className="text-xs text-text-secondary">Occupied Units</div>
          <div className="text-xl font-bold font-mono text-success mt-1">{totalOccupied}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-card border border-border-muted">
          <div className="text-xs text-text-secondary">Vacant / Unallocated</div>
          <div className="text-xl font-bold font-mono text-warning mt-1">{totalVacant}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-card border border-border-muted">
          <div className="text-xs text-text-secondary">Occupancy Rate</div>
          <div className="text-xl font-bold font-mono text-accent mt-1">
            {flats.length > 0 ? `${Math.round((totalOccupied / flats.length) * 100)}%` : '0%'}
          </div>
        </div>
      </div>

      {/* Tower Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'A', 'B', 'C', 'D'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTower(t)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedTower === t
                  ? 'bg-accent text-surface-main'
                  : 'bg-surface-card text-text-secondary hover:text-text-primary border border-border-muted'
              }`}
            >
              {t === 'ALL' ? 'All Towers' : `Tower ${t}`}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search flat number or resident..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-text-secondary" />}
          />
        </div>
      </div>

      {/* Flats Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : filteredFlats.length === 0 ? (
        <EmptyState
          icon={<Home className="w-12 h-12 text-text-secondary" />}
          title="No flat records match query"
          description="Try selecting a different tower or adjusting your search term."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredFlats.map((flat) => {
            const isOccupied = flat.residents && flat.residents.length > 0;
            const primaryResident = isOccupied ? flat.residents[0] : null;

            return (
              <Card 
                key={flat._id} 
                className={`border p-4 transition-all ${
                  isOccupied ? 'border-border-muted bg-surface-card' : 'border-dashed border-border-muted bg-surface-secondary/40'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[11px] font-mono font-medium text-text-secondary uppercase">
                      Tower {flat.tower}
                    </span>
                    <h3 className="text-lg font-bold font-mono text-text-primary">
                      {flat.flatNumber}
                    </h3>
                  </div>
                  <Badge variant={isOccupied ? 'success' : 'warning'}>
                    {isOccupied ? 'Occupied' : 'Vacant'}
                  </Badge>
                </div>

                <div className="pt-2 border-t border-border-muted/50 text-xs space-y-1.5">
                  {isOccupied ? (
                    <>
                      <div className="font-semibold text-text-primary truncate">
                        {primaryResident.name}
                      </div>
                      {primaryResident.phone && (
                        <div className="flex items-center gap-1.5 text-text-secondary font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-accent" />
                          <a href={`tel:${primaryResident.phone}`} className="hover:text-accent">
                            {primaryResident.phone}
                          </a>
                        </div>
                      )}
                      {primaryResident.email && (
                        <div className="flex items-center gap-1.5 text-text-secondary font-mono text-[11px] truncate">
                          <Mail className="w-3 h-3 text-text-secondary" />
                          <span>{primaryResident.email}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-text-secondary text-xs italic py-2">
                      No active owner registered
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
