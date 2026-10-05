import React from 'react';
import { Mic, Bot, Sparkles, Server } from 'lucide-react';

interface HeaderProps {
  currentScreen: 'setup' | 'interview' | 'report';
  onNewSession?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentScreen, onNewSession }) => {
  return (
    <header className="border-b border-gray-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                InterviewDojo
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700/50 text-cyan-300 flex items-center gap-1">
                <Mic className="w-3 h-3" /> Alexa+ Voice Simulator
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Server className="w-3 h-3 text-cyan-400" /> MCP Spec 2025-11-25 | Amazon Bedrock Converse
            </p>
          </div>
        </div>

        {currentScreen !== 'setup' && onNewSession && (
          <button
            onClick={onNewSession}
            className="text-xs px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> New Mock Session
          </button>
        )}
      </div>
    </header>
  );
};
