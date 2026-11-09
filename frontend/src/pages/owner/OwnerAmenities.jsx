import React, { useState, useEffect } from 'react';
import { Dumbbell, Sparkles, QrCode, ShieldCheck, ShieldAlert, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/forms/Input';
import Loader from '../../components/common/Loader';
import DigitalAmenityCard from '../../components/ui/DigitalAmenityCard';
import { amenityApi } from '../../services/api/amenityApi';
import { formatCurrency } from '../../utils/formatters';

export const OwnerAmenities = () => {
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedAmenity, setSelectedAmenity] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [paymentPassphrase, setPaymentPassphrase] = useState('LivingLinkDemoPay2026!');
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Digital Access Pass Modal
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardData, setCardData] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);

  const fetchAmenities = async () => {
    try {
      const data = await amenityApi.getCatalog();
      setAmenities(data || []);
    } catch {
      toast.error('Failed to load amenities catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmenities();
  }, []);

  const handleOpenPurchase = (amenity, plan) => {
    setSelectedAmenity(amenity);
    setSelectedPlan(plan);
    setIsPurchaseModalOpen(true);
  };

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!paymentPassphrase) {
      toast.error('Please enter the demo payment passphrase');
      return;
    }

    setPurchaseLoading(true);
    try {
      const idempotencyKey = `sub-pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      await amenityApi.purchaseSubscription({
        amenityId: selectedAmenity._id,
        planId: selectedPlan.planId,
        paymentPassphrase,
        idempotencyKey
      });

      toast.success('Subscription activated successfully via demo simulation!');
      setIsPurchaseModalOpen(false);
      // Immediately open digital card
      handleViewCard(selectedAmenity);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Subscription purchase failed');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleViewCard = async (amenity) => {
    setCardLoading(true);
    setIsCardModalOpen(true);
    try {
      const card = await amenityApi.getMyCard(amenity._id);
      setCardData(card);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to retrieve amenity card');
      setIsCardModalOpen(false);
    } finally {
      setCardLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-muted">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">Society Amenities</h2>
          <p className="text-xs text-text-secondary mt-1">
            Access fitness centers and clubhouse facilities with digital QR passes.
          </p>
        </div>
      </div>

      {loading ? (
        <Loader message="Loading amenities catalog..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {amenities.map((amenity) => (
            <Card key={amenity._id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-text-primary">{amenity.name}</h3>
                      <span className="text-[11px] text-text-secondary">
                        Open: {amenity.openingTime} - {amenity.closingTime}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    icon={QrCode}
                    onClick={() => handleViewCard(amenity)}
                  >
                    View Access Card
                  </Button>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed mb-5">{amenity.description}</p>

                {/* Subscription Plans Selection Grid */}
                <div className="space-y-2 mb-6">
                  <span className="text-xs font-semibold text-text-primary uppercase tracking-wider block mb-2">
                    Available Membership Plans
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {amenity.plans?.map((plan) => (
                      <div
                        key={plan._id}
                        className="p-3 rounded-xl bg-bg-elevated border border-border-muted flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-text-primary">{plan.name}</span>
                            <span className="text-xs font-bold text-accent">
                              {formatCurrency(plan.priceInPaise)}
                            </span>
                          </div>
                          <p className="text-[10px] text-text-secondary mt-1">
                            Validity: {plan.durationDays} day(s)
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenPurchase(amenity, plan)}
                          className="w-full mt-3 text-xs"
                        >
                          Select Plan
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rules summary */}
              {amenity.rules && amenity.rules.length > 0 && (
                <div className="pt-3 border-t border-border-muted/60 text-[11px] text-text-secondary">
                  <span className="font-semibold text-text-primary">Key Facility Rules:</span>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {amenity.rules.slice(0, 2).map((rule, idx) => (
                      <li key={idx} className="truncate">
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Demo Payment Purchase Modal */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Confirm Amenity Membership"
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePurchaseSubmit} className="space-y-4">
          <div className="p-4 rounded-xl bg-bg-elevated border border-border-muted space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-text-secondary">Amenity:</span>
              <span className="font-semibold text-text-primary">{selectedAmenity?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Plan:</span>
              <span className="font-semibold text-text-primary">{selectedPlan?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Duration:</span>
              <span className="font-semibold text-text-primary">{selectedPlan?.durationDays} Days</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border-muted/60 text-sm">
              <span className="font-bold text-text-primary">Total Payable:</span>
              <span className="font-bold text-accent">{formatCurrency(selectedPlan?.priceInPaise)}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-status-warning/10 border border-status-warning/30 text-[11px] text-status-warning">
            ⚠️ <strong>Demo Simulation Mode:</strong> Enter the server demo secret below to simulate a successful payment transaction.
          </div>

          <Input
            label="Demo Payment Passphrase"
            type="password"
            value={paymentPassphrase}
            onChange={(e) => setPaymentPassphrase(e.target.value)}
            placeholder="LivingLinkDemoPay2026!"
            required
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsPurchaseModalOpen(false)} disabled={purchaseLoading}>
              Cancel
            </Button>
            <Button type="submit" loading={purchaseLoading}>
              Confirm & Activate
            </Button>
          </div>
        </form>
      </Modal>

      {/* Digital Amenity Access Card Modal */}
      <Modal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        title="Digital Access Pass"
        maxWidth="max-w-md"
      >
        {cardLoading ? (
          <Loader message="Verifying card token & maintenance eligibility..." />
        ) : (
          <DigitalAmenityCard card={cardData} />
        )}
      </Modal>
    </div>
  );
};

export default OwnerAmenities;
