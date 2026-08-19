import React from 'react';
import { TemplateEditor } from '../components/template/TemplateEditor';

export const TemplatePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Email Template Customization</h2>
        <p className="text-xs text-slate-400">
          Personalize the email subject and body content sent to each participant.
        </p>
      </div>

      <TemplateEditor />
    </div>
  );
};
