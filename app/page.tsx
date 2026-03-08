'use client';

import { useDataStore } from '@/hooks/useDataStore';
import { Header } from '@/components/layout/Header';
import { FileUploader } from '@/components/upload/FileUploader';
import { DataPreview } from '@/components/upload/DataPreview';
import { CleaningPanel } from '@/components/cleaning/CleaningPanel';
import { DashboardView } from '@/components/dashboard/DashboardView';

export default function Home() {
  const { state } = useDataStore();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1 }}>
        {state.currentStep === 'upload' && <FileUploader />}

        {state.currentStep === 'preview' && (
          <div style={{ padding: '1.5rem 0' }}>
            <DataPreview />
            <CleaningPanel />
          </div>
        )}

        {state.currentStep === 'dashboard' && <DashboardView />}
      </main>
    </div>
  );
}
