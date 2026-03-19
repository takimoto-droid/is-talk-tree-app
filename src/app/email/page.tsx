'use client';

import { useProject } from '@/context/ProjectContext';
import ProjectSetup from '@/components/ProjectSetup';
import EmailGenerator from '@/components/EmailGenerator';
import AppNavDropdown from '@/components/AppNavDropdown';

export default function EmailPage() {
  const { config, isConfigured, reset: resetProject } = useProject();

  if (!isConfigured || !config) {
    return <ProjectSetup />;
  }

  return (
    <main className="app-container">
      <header className="app-header">
        <div className="app-header-left">
          <AppNavDropdown />
          <span className="app-project-name">{config.productName}</span>
        </div>
        <div className="app-header-right">
          <button onClick={resetProject} className="change-project-button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            案件変更
          </button>
        </div>
      </header>
      <EmailGenerator />
    </main>
  );
}
