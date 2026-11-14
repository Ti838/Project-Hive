'use client';

import React from 'react';

interface DesktopGateProps {
  children: React.ReactNode;
}

export function DesktopGate({ children }: DesktopGateProps) {
  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background text-foreground">
      {children}
    </div>
  );
}
