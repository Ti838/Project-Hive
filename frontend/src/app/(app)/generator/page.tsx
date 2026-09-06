'use client';
// ─── Hive AI Studio Page ──────────────────────────────────────────────────
// Centralized, World-Class Intelligence Studio powering all 11 AI capabilities

import { HiveAIWorkspace } from '@/components/ai/HiveAIWorkspace';

export default function GeneratorPage() {
  return (
    <div className="h-full w-full flex flex-col min-h-0 overflow-hidden">
      <HiveAIWorkspace initialCapability="project_generator" className="h-full rounded-none border-0 shadow-none" />
    </div>
  );
}

