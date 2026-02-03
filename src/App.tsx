import { useEffect } from 'react';
import { useStore } from '@/store';
import { initializeDB } from '@/db';
import { Layout } from '@/components/layout';
import { WriteView } from '@/components/write';
import { PlanningView } from '@/components/planning';
import { CodexView } from '@/components/codex';
import { ChatView } from '@/components/chat';
import { ReviewView } from '@/components/review';
import { SettingsView } from '@/components/settings';
import { ToastProvider } from '@/components/common/Toast';
import { LoadingState } from '@/components/common/Spinner';

function App() {
  const { initialize, isLoading, activeView, settings } = useStore();

  useEffect(() => {
    const init = async () => {
      await initializeDB();
      await initialize();
    };
    init();
  }, [initialize]);

  if (isLoading || !settings) {
    return <LoadingState message="Loading ScriptPro..." fullScreen />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'write':
        return <WriteView />;
      case 'plan':
        return <PlanningView />;
      case 'codex':
        return <CodexView />;
      case 'chat':
        return <ChatView />;
      case 'review':
        return <ReviewView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <WriteView />;
    }
  };

  return (
    <ToastProvider>
      <Layout>{renderView()}</Layout>
    </ToastProvider>
  );
}

export default App;
