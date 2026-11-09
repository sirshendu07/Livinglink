import React, { useState } from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { sosApi } from '../../services/api/sosApi';

export const SosButton = ({ className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTrigger = async () => {
    setLoading(true);
    try {
      await sosApi.triggerSos(notes || 'Emergency assistance requested');
      toast.success('EMERGENCY SOS DISPATCHED! Security and administration notified immediately.', {
        duration: 8000
      });
      setIsModalOpen(false);
      setNotes('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to trigger SOS alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-status-danger/15 hover:bg-status-danger/25 border border-status-danger/30 text-status-danger text-xs font-bold transition-all shadow-subtle ${className}`}
      >
        <ShieldAlert className="w-4 h-4 animate-pulse" />
        <span>SOS EMERGENCY</span>
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Trigger Emergency SOS Alert"
        maxWidth="max-w-md"
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-status-danger/20 text-status-danger flex items-center justify-center mx-auto mb-4 animate-pulse">
            <AlertCircle className="w-6 h-6" />
          </div>

          <h4 className="text-base font-bold text-text-primary mb-1">Are you in an emergency?</h4>
          <p className="text-xs text-text-secondary leading-relaxed mb-4">
            Triggering SOS will immediately send an urgent, high-priority emergency dispatch to security guards at all gates and society administrators.
          </p>

          <div className="text-left mb-5">
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Emergency Note (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Medical emergency, fire in kitchen, urgent assistance needed..."
              className="w-full bg-bg-card border border-border-muted rounded-lg p-3 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-status-danger/30"
            />
          </div>

          <div className="flex items-center gap-3 justify-end">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="danger" loading={loading} onClick={handleTrigger}>
              CONFIRM EMERGENCY DISPATCH
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SosButton;
