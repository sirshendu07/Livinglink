import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  QrCode, CheckCircle2, XCircle, ShieldAlert, Sparkles, 
  RotateCcw, Search, User, Home, Calendar, Clock
} from 'lucide-react';
import { amenityApi } from '../../services/api/amenityApi';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/forms/Input';
import { formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function VerifyAmenity() {
  const [tokenInput, setTokenInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: (token) => amenityApi.verifyCard(token),
    onSuccess: (data) => {
      const resultObj = {
        success: true,
        data,
        timestamp: new Date().toISOString()
      };
      setScanResult(resultObj);
      setRecentScans((prev) => [resultObj, ...prev.slice(0, 9)]);
      toast.success('Access Granted!', { icon: '✅' });
    },
    onError: (err) => {
      const resultObj = {
        success: false,
        error: err.response?.data?.message || 'Access Denied / Verification Failed',
        timestamp: new Date().toISOString()
      };
      setScanResult(resultObj);
      setRecentScans((prev) => [resultObj, ...prev.slice(0, 9)]);
      toast.error('Access Denied!', { icon: '⛔' });
    }
  });

  const handleVerify = (e) => {
    e?.preventDefault();
    if (!tokenInput.trim()) return;
    verifyMutation.mutate(tokenInput.trim());
  };

  const handleClear = () => {
    setTokenInput('');
    setScanResult(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <QrCode className="w-7 h-7 text-accent" />
          Digital Amenity Gate Verification
        </h1>
        <p className="text-text-secondary text-sm">
          Scan resident digital pass or enter HMAC signature token to authenticate amenity access.
        </p>
      </div>

      {/* Main Verification Input */}
      <Card className="border border-border-muted p-6">
        <form onSubmit={handleVerify} className="space-y-4">
          <label className="block text-sm font-medium text-text-primary">
            Resident Digital Pass Token / QR Code String
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Paste or scan QR code payload here..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                leftIcon={<QrCode className="w-4 h-4 text-accent" />}
                className="font-mono text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                variant="primary"
                loading={verifyMutation.isPending}
                disabled={!tokenInput.trim()}
                className="px-6"
              >
                Verify Access
              </Button>
              {tokenInput && (
                <Button type="button" variant="ghost" onClick={handleClear}>
                  Clear
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-text-secondary">
            Note: All digital amenity cards feature cryptographic tamper-proofing verified against active subscriptions and maintenance dues.
          </p>
        </form>
      </Card>

      {/* Result Status Display */}
      {scanResult && (
        <div className={`p-6 rounded-2xl border transition-all duration-300 ${
          scanResult.success 
            ? 'bg-success/10 border-success/30 text-text-primary' 
            : 'bg-danger/10 border-danger/30 text-text-primary'
        }`}>
          <div className="flex flex-col items-center text-center space-y-3">
            {scanResult.success ? (
              <>
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center text-success animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-success tracking-wide">
                  ACCESS GRANTED
                </h2>
                <div className="w-full max-w-md bg-surface-card border border-success/20 rounded-xl p-4 text-left space-y-2 text-sm mt-2">
                  <div className="flex justify-between items-center border-b border-border-muted/50 pb-2">
                    <span className="text-text-secondary">Resident</span>
                    <span className="font-semibold text-text-primary">{scanResult.data?.owner?.name || scanResult.data?.userName || 'Resident'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border-muted/50 pb-2">
                    <span className="text-text-secondary">Flat Location</span>
                    <span className="font-mono text-accent">
                      Tower {scanResult.data?.owner?.tower || scanResult.data?.tower || '-'} / Flat {scanResult.data?.owner?.flatNumber || scanResult.data?.flatNumber || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border-muted/50 pb-2">
                    <span className="text-text-secondary">Amenity Facility</span>
                    <span className="font-semibold text-text-primary">{scanResult.data?.amenity?.title || scanResult.data?.amenityTitle || 'Clubhouse/Facility'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Subscription Status</span>
                    <Badge variant="success">Active & Paid</Badge>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-danger/20 flex items-center justify-center text-danger">
                  <XCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-danger tracking-wide">
                  ACCESS DENIED
                </h2>
                <p className="text-text-secondary text-sm max-w-md">
                  {scanResult.error}
                </p>
                <div className="w-full max-w-md bg-surface-card border border-danger/20 rounded-xl p-4 text-left text-xs text-danger space-y-1 mt-2">
                  <div className="font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" /> Entry Prohibited by Security Policy
                  </div>
                  <p className="text-text-secondary">
                    Please ask the resident to verify their subscription validity or clear any overdue society maintenance dues in the resident portal.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Recent Verification History */}
      {recentScans.length > 0 && (
        <Card className="border border-border-muted p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-text-secondary" />
            Recent Scans This Session
          </h3>
          <div className="space-y-2">
            {recentScans.map((scan, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary border border-border-muted text-xs"
              >
                <div className="flex items-center gap-2.5">
                  {scan.success ? (
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-danger flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-medium text-text-primary">
                      {scan.success 
                        ? (scan.data?.owner?.name || scan.data?.userName || 'Resident Pass')
                        : 'Access Refused'
                      }
                    </span>
                    <span className="text-text-secondary ml-2 font-mono">
                      {scan.success ? (scan.data?.amenity?.title || 'Facility') : scan.error}
                    </span>
                  </div>
                </div>
                <span className="text-text-secondary font-mono text-[11px]">
                  {new Date(scan.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
