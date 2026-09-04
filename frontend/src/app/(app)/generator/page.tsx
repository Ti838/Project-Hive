'use client';
// ─── Hive AI Studio Page ──────────────────────────────────────────────────
// Centralized, World-Class Intelligence Studio powering all 11 AI capabilities

import { HiveAIWorkspace } from '@/components/ai/HiveAIWorkspace';

export default function GeneratorPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <HiveAIWorkspace initialCapability="project_generator" />
    </div>
  );
}
