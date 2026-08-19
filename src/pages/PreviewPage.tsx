import React from 'react';
import { MatchingPreviewTable } from '../components/preview/MatchingPreviewTable';

export const PreviewPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Certificate Matching Preview</h2>
        <p className="text-xs text-slate-400">
          Inspect matching status between imported participants and uploaded PDF certificates. Correct any unassigned or ambiguous files before launching email dispatches.
        </p>
      </div>

      <MatchingPreviewTable />
    </div>
  );
};
