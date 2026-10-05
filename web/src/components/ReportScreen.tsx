import React from 'react';
import { Trophy, CheckCircle, AlertTriangle, ListOrdered, RefreshCw, Star, Target } from 'lucide-react';

interface ReportScreenProps {
  report: {
    overall: number;
    perTopic: { topic: string; score: number }[];
    strengths: string[];
    weakTopics: string[];
    practicePlan: string[];
  };
  role: string;
  onNewSession: () => void;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({ report, role, onNewSession }) => {
  const getScoreBadgeColor = (score: number) => {
    if (score >= 8) return 'bg-emerald-950 text-emerald-300 border-emerald-700';
    if (score >= 5) return 'bg-amber-950 text-amber-300 border-amber-700';
    return 'bg-red-950 text-red-300 border-red-700';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-indigo-950 border border-slate-800 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-900/60 border border-cyan-700 text-cyan-300 text-xs font-semibold mb-3">
          <Trophy className="w-4 h-4 text-amber-400" /> Mock Interview Report Card
        </div>
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          Interview Feedback & Weak-Spot Analysis
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Role: <strong className="text-cyan-400">{role}</strong> | Evaluated by Amazon Bedrock Converse Rubric
        </p>

        {/* Overall Score Circle */}
        <div className="mt-6 inline-flex flex-col items-center justify-center w-36 h-36 rounded-full bg-slate-950 border-4 border-cyan-500 shadow-xl shadow-cyan-500/20">
          <span className="text-4xl font-extrabold text-cyan-400">{report.overall}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
            Out of 10
          </span>
        </div>
      </div>

      {/* Grid: Topic Breakdown & Strengths/Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Topic Breakdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" /> Score Breakdown per Topic
          </h3>
          <div className="space-y-3">
            {report.perTopic.map((item, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-slate-200">{item.topic}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold border ${getScoreBadgeColor(
                      item.score
                    )}`}
                  >
                    {item.score}/10
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${(item.score / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5" /> Demonstrated Strengths
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {report.strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <Star className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5" /> Identified Weak Spots
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {report.weakTopics.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Actionable Practice Plan */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-cyan-300 flex items-center gap-2 mb-4">
          <ListOrdered className="w-5 h-5 text-cyan-400" /> Actionable 3-Step Practice Plan
        </h3>
        <div className="space-y-3">
          {report.practicePlan.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-200"
            >
              <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-400 font-bold flex items-center justify-center shrink-0">
                {idx + 1}
              </div>
              <p className="leading-relaxed mt-0.5">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 flex justify-center">
        <button
          onClick={onNewSession}
          className="py-4 px-8 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 flex items-center gap-2 transition"
        >
          <RefreshCw className="w-4 h-4" /> Start New Voice Mock Session
        </button>
      </div>
    </div>
  );
};
