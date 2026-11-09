import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Building, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex bg-bg-main">
      {/* Left Column — Architectural Residential Identity (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0C1015] border-r border-border-muted p-12 flex-col justify-between">
        {/* Subtle architectural ambient background glow */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-status-info/10 blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/40 flex items-center justify-center text-accent">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">LivingLink</h1>
            <span className="text-xs text-text-secondary uppercase tracking-widest font-medium">
              Residential Operating System
            </span>
          </div>
        </div>

        {/* Hero Narrative & Features */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Society Platform</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold text-text-primary tracking-tight leading-tight">
            Intelligent residential living, unified in one elegant OS.
          </h2>

          <p className="text-sm text-text-secondary leading-relaxed">
            Experience real-time gate visitor approvals, digital amenity passes, transparent maintenance billing, and instant emergency alerts.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-bg-card/70 border border-border-muted">
              <ShieldCheck className="w-5 h-5 text-accent mb-2" />
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Gate Security</h4>
              <p className="text-[11px] text-text-secondary mt-1">Real-time visitor requests & guard verification</p>
            </div>
            <div className="p-4 rounded-xl bg-bg-card/70 border border-border-muted">
              <KeyRound className="w-5 h-5 text-accent mb-2" />
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Digital Access</h4>
              <p className="text-[11px] text-text-secondary mt-1">Tamper-resistant QR amenity access cards</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-text-secondary">
          <span>&copy; {new Date().getFullYear()} LivingLink Technologies. Built for secure societies.</span>
        </div>
      </div>

      {/* Right Column — Auth Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 auth-mesh">
        <div className="w-full max-w-md">
          {/* Mobile Brand Header */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/40 flex items-center justify-center text-accent">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary tracking-tight">LivingLink</h1>
              <span className="text-[10px] text-text-secondary uppercase tracking-widest font-medium block">
                Residential OS
              </span>
            </div>
          </div>

          {/* Form Outlet */}
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
