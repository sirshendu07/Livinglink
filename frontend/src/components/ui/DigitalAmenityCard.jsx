import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, ShieldAlert, Sparkles, Building2, Calendar, User as UserIcon } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const DigitalAmenityCard = ({ card }) => {
  if (!card) return null;

  const isGreen = card.accessStatus === 'GREEN';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#182029] via-[#12171E] to-[#0D1015] border border-border-muted p-6 shadow-card max-w-md mx-auto">
      {/* Background ambient lighting */}
      <div
        className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isGreen ? 'bg-status-success' : 'bg-status-danger'
        }`}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border-muted/60 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider">LivingLink</h4>
            <span className="text-[10px] text-text-secondary tracking-widest uppercase">Digital Access Pass</span>
          </div>
        </div>

        {/* Status Chip */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border tracking-wider ${
            isGreen
              ? 'bg-status-success/20 text-status-success border-status-success/40'
              : 'bg-status-danger/20 text-status-danger border-status-danger/40'
          }`}
        >
          {isGreen ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
          <span>{isGreen ? 'VALID PASS' : 'ACCESS DENIED'}</span>
        </div>
      </div>

      {/* Amenity Title */}
      <div className="mb-6">
        <span className="text-xs text-text-secondary uppercase tracking-wider">Amenity Facility</span>
        <h3 className="text-xl font-bold text-text-primary tracking-tight mt-0.5">{card.amenity?.name}</h3>
        {card.subscription && (
          <span className="inline-block mt-1 text-xs text-accent font-medium bg-accent/10 px-2.5 py-0.5 rounded-md border border-accent/20">
            {card.subscription.planName}
          </span>
        )}
      </div>

      {/* Middle QR Code & Verification Block */}
      <div className="flex flex-col sm:flex-row items-center gap-5 bg-bg-card/70 border border-border-muted rounded-xl p-4 mb-6">
        <div className="p-2.5 bg-white rounded-lg shadow-sm flex-shrink-0">
          {card.qrToken ? (
            <QRCodeSVG value={card.qrToken} size={110} level="H" includeMargin={false} />
          ) : (
            <div className="w-[110px] h-[110px] bg-gray-200 flex items-center justify-center text-gray-500 text-xs text-center p-2 font-mono">
              NO ACTIVE TOKEN
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-text-secondary">
            <UserIcon className="w-3.5 h-3.5 text-accent" />
            <span className="font-medium text-text-primary">{card.owner?.name}</span>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-text-secondary">
            <Building2 className="w-3.5 h-3.5 text-accent" />
            <span>
              {card.owner?.tower} • Flat {card.owner?.flatNumber}
            </span>
          </div>
          {card.subscription?.endDate && (
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-text-secondary">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span>Valid Until: {formatDate(card.subscription.endDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info / Warning */}
      <div className="pt-2">
        <p
          className={`text-xs ${
            isGreen ? 'text-text-secondary' : 'text-status-danger font-medium'
          } leading-relaxed`}
        >
          {card.statusReason || (isGreen ? 'Present this digital pass at the amenity checkpoint.' : 'Access restricted.')}
        </p>
      </div>
    </div>
  );
};

export default DigitalAmenityCard;
