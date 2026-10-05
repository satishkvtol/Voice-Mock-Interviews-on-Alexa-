import React, { useState } from 'react';
import { Header } from './components/Header';
import { SetupScreen } from './components/SetupScreen';
import { InterviewScreen } from './components/InterviewScreen';
import { ReportScreen } from './components/ReportScreen';
import { resetMcpClient } from './services/mcpClient';

export function App() {
  const [screen, setScreen] = useState<'setup' | 'interview' | 'report'>('setup');
  const [sessionData, setSessionData] = useState<{
    sessionId: string;
    firstQuestion: string;
    topics: string[];
    role: string;
    difficulty: string;
  } | null>(null);

  const [report, setReport] = useState<any>(null);

  const handleStartSession = (data: {
    sessionId: string;
    firstQuestion: string;
    topics: string[];
    role: string;
    difficulty: string;
  }) => {
    setSessionData(data);
    setScreen('interview');
  };

  const handleFinishInterview = (reportData: any) => {
    setReport(reportData);
    setScreen('report');
  };

  const handleNewSession = async () => {
    await resetMcpClient();
    setSessionData(null);
    setReport(null);
    setScreen('setup');
  };

  return (
    <div className="min-h-screen bg-[#070B19] text-slate-100 flex flex-col font-sans">
      <Header currentScreen={screen} onNewSession={handleNewSession} />

      <main className="flex-1 pb-12">
        {screen === 'setup' && <SetupScreen onStartSession={handleStartSession} />}

        {screen === 'interview' && sessionData && (
          <InterviewScreen
            sessionId={sessionData.sessionId}
            firstQuestion={sessionData.firstQuestion}
            topics={sessionData.topics}
            role={sessionData.role}
            difficulty={sessionData.difficulty}
            onFinish={handleFinishInterview}
          />
        )}

        {screen === 'report' && report && (
          <ReportScreen
            report={report}
            role={sessionData?.role || 'Full Stack Engineer'}
            onNewSession={handleNewSession}
          />
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>
          InterviewDojo &copy; 2026 - Self-Hosted MCP Server (Spec 2025-11-25) + Amazon Bedrock Converse API
        </p>
      </footer>
    </div>
  );
}

export default App;
