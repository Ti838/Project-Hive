'use client';

import React, { useState } from 'react';
import { MapPin, Shield, Check, X, Building, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmBrowserLocation: () => void;
  onSelectManualCampus: (campus: string, city?: string) => void;
  currentCampus?: string | null;
}

const COMMON_CAMPUSES = [
  { name: 'University of Dhaka', city: 'Dhaka', country: 'Bangladesh' },
  { name: 'Bangladesh University of Engineering and Technology (BUET)', city: 'Dhaka', country: 'Bangladesh' },
  { name: 'North South University (NSU)', city: 'Dhaka', country: 'Bangladesh' },
  { name: 'BRAC University', city: 'Dhaka', country: 'Bangladesh' },
  { name: 'Independent University, Bangladesh (IUB)', city: 'Dhaka', country: 'Bangladesh' },
  { name: 'United International University (UIU)', city: 'Dhaka', country: 'Bangladesh' },
  { name: 'Ahsanullah University of Science and Technology (AUST)', city: 'Dhaka', country: 'Bangladesh' },
  { name: 'Islamic University of Technology (IUT)', city: 'Gazipur', country: 'Bangladesh' },
];

export function LocationConsentModal({
  isOpen,
  onClose,
  onConfirmBrowserLocation,
  onSelectManualCampus,
  currentCampus,
}: LocationConsentModalProps) {
  const [mode, setMode] = useState<'prompt' | 'manual'>('prompt');
  const [selectedCampus, setSelectedCampus] = useState(currentCampus || '');
  const [customCampus, setCustomCampus] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border/80 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {mode === 'prompt' ? (
          <>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">
                Enable Campus & Location Intelligence?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ProjectHive uses your location to connect you with fellow engineers at your university and highlight squads recruiting nearby.
              </p>
            </div>

            {/* Privacy Pillars */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 font-semibold text-foreground">
                <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Zero-Trust Privacy Guarantee</span>
              </div>
              <ul className="space-y-1.5 text-muted-foreground text-[11px] list-disc list-inside">
                <li>Exact GPS coordinates are never published publicly.</li>
                <li>Only your verified campus name is shown to prospective squad members.</li>
                <li>You can switch your visibility to Private anytime in Settings.</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={onConfirmBrowserLocation}
                className="w-full py-3 px-4 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
              >
                <Navigation className="w-4 h-4" />
                <span>Allow Location (Auto-Detect Campus)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('manual')}
                className="w-full py-2.5 px-4 bg-muted/60 hover:bg-muted text-foreground font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-border/60 cursor-pointer"
              >
                <Building className="w-4 h-4 text-muted-foreground" />
                <span>Select University Manually</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Building className="w-4 h-4 text-primary" /> Select Your University Campus
              </h3>
              <p className="text-xs text-muted-foreground">Choose from recognized academic institutions</p>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {COMMON_CAMPUSES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedCampus(c.name)}
                  className={cn(
                    'w-full p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between border cursor-pointer',
                    selectedCampus === c.name
                      ? 'border-primary bg-primary/10 text-foreground font-bold'
                      : 'border-border/50 bg-card hover:bg-muted/40 text-muted-foreground'
                  )}
                >
                  <span className="truncate pr-2">{c.name}</span>
                  {selectedCampus === c.name && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Other Campus / Institution</label>
              <input
                type="text"
                placeholder="Type your university name..."
                value={customCampus}
                onChange={(e) => {
                  setCustomCampus(e.target.value);
                  setSelectedCampus(e.target.value);
                }}
                className="w-full h-10 px-3.5 bg-muted/50 rounded-xl text-xs border border-border/60 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMode('prompt')}
                className="flex-1 py-2.5 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!selectedCampus.trim()}
                onClick={() => {
                  onSelectManualCampus(selectedCampus.trim());
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                Save Campus
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

