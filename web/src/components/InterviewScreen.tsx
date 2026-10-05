import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Award,
  HelpCircle,
  Keyboard,
  Radio,
} from 'lucide-react';
import {
  mcpScoreAnswer,
  mcpNextQuestion,
  mcpSessionReport,
} from '../services/mcpClient';
import {
  speakText,
  stopSpeaking,
  isSpeechRecognitionSupported,
  createSpeechRecognizer,
} from '../utils/speech';

interface InterviewScreenProps {
  sessionId: string;
  firstQuestion: string;
  topics: string[];
  role: string;
  difficulty: string;
  onFinish: (report: any) => void;
}

interface Message {
  type: 'alexa' | 'user';
  text: string;
  topic?: string;
  scoreCard?: {
    scores: { correctness: number; depth: number; clarity: number };
    overall: number;
    feedback: string;
    followUp?: string;
    idealAnswerHint: string;
  };
}

export const InterviewScreen: React.FC<InterviewScreenProps> = ({
  sessionId,
  firstQuestion,
  topics,
  role,
  difficulty,
  onFinish,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestionText, setCurrentQuestionText] = useState(firstQuestion);
  const [currentTopic, setCurrentTopic] = useState(topics[0] || 'Technical Overview');
  const [messages, setMessages] = useState<Message[]>([
    { type: 'alexa', text: firstQuestion, topic: topics[0] || 'Technical Overview' },
  ]);

  const [spokenAnswer, setSpokenAnswer] = useState('');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const [useTypedFallback, setUseTypedFallback] = useState(!isSpeechRecognitionSupported());
  const [lastScore, setLastScore] = useState<any>(null);

  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Read current question aloud when rendered or changed
  useEffect(() => {
    setIsSpeakingQuestion(true);
    speakText(currentQuestionText, () => setIsSpeakingQuestion(false));

    return () => {
      stopSpeaking();
    };
  }, [currentQuestionText]);

  // Scroll transcript to bottom on message updates
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isScoring]);

  // Handle Speech Recognition Toggle
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    stopSpeaking();
    setSpokenAnswer('');

    const recognizer = createSpeechRecognizer(
      (transcript) => {
        setSpokenAnswer(transcript);
      },
      (error) => {
        console.warn('Speech recognition error:', error);
        setIsRecording(false);
      },
      () => {
        setIsRecording(false);
      }
    );

    if (recognizer) {
      recognitionRef.current = recognizer;
      recognizer.start();
      setIsRecording(true);
    } else {
      setUseTypedFallback(true);
    }
  };

  const handleRepeatQuestion = () => {
    setIsSpeakingQuestion(true);
    speakText(currentQuestionText, () => setIsSpeakingQuestion(false));
  };

  const handleSubmitAnswer = async (answerTextStr?: string) => {
    const finalAnswer = answerTextStr || (useTypedFallback ? typedAnswer : spokenAnswer);
    if (!finalAnswer.trim()) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    stopSpeaking();

    // Append candidate message
    const updatedMessages: Message[] = [...messages, { type: 'user', text: finalAnswer }];
    setMessages(updatedMessages);
    setSpokenAnswer('');
    setTypedAnswer('');
    setIsScoring(true);

    try {
      // 1. Score answer via MCP
      const scoreResult = await mcpScoreAnswer(sessionId, finalAnswer);
      setLastScore(scoreResult);

      // Attach score card to last user message
      updatedMessages[updatedMessages.length - 1].scoreCard = scoreResult;
      setMessages([...updatedMessages]);

      // Read feedback aloud
      speakText(scoreResult.feedback);
    } catch (err: any) {
      console.error('Failed to score answer:', err);
    } finally {
      setIsScoring(false);
    }
  };

  const handleNextQuestion = async () => {
    stopSpeaking();
    setLastScore(null);
    setIsScoring(true);

    try {
      const nextResult = await mcpNextQuestion(sessionId);

      if (nextResult.done) {
        setIsDone(true);
        // Automatically fetch session report
        const reportResult = await mcpSessionReport(sessionId);
        onFinish(reportResult);
      } else {
        setCurrentQuestionIndex(nextResult.index);
        setCurrentQuestionText(nextResult.question);
        setCurrentTopic(nextResult.topic);

        setMessages((prev) => [
          ...prev,
          { type: 'alexa', text: nextResult.question, topic: nextResult.topic },
        ]);
      }
    } catch (err: any) {
      console.error('Error fetching next question:', err);
    } finally {
      setIsScoring(false);
    }
  };

  const handleFinishEarly = async () => {
    stopSpeaking();
    setIsScoring(true);
    try {
      const reportResult = await mcpSessionReport(sessionId);
      onFinish(reportResult);
    } catch (err: any) {
      console.error('Error finishing interview:', err);
    } finally {
      setIsScoring(false);
    }
  };

  const activeAnswerText = useTypedFallback ? typedAnswer : spokenAnswer;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Alexa Simulator Orb & Controls */}
      <div className="lg:col-span-4 flex flex-col gap-5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-800 text-[11px] text-cyan-400 font-mono border border-slate-700">
            Q {currentQuestionIndex + 1} / {topics.length}
          </div>

          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Alexa+ Spoken Interface
          </h3>

          {/* Animated Alexa Voice Ring */}
          <div className="my-6 flex justify-center items-center">
            <div
              className={`w-32 h-32 rounded-full bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center transition-all duration-500 shadow-xl ${
                isSpeakingQuestion
                  ? 'alexa-ring-active scale-105'
                  : isRecording
                  ? 'ring-4 ring-red-500/70 animate-pulse'
                  : 'opacity-90 hover:scale-105'
              }`}
            >
              <div className="w-24 h-24 rounded-full bg-slate-950 flex flex-col items-center justify-center p-2 text-center">
                {isSpeakingQuestion ? (
                  <Volume2 className="w-8 h-8 text-cyan-400 animate-bounce" />
                ) : isRecording ? (
                  <Radio className="w-8 h-8 text-red-500 animate-pulse" />
                ) : (
                  <Mic className="w-8 h-8 text-blue-400" />
                )}
                <span className="text-[10px] text-slate-400 mt-1 font-semibold">
                  {isSpeakingQuestion ? 'Speaking...' : isRecording ? 'Listening...' : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={handleRepeatQuestion}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Repeat Question
            </button>
            <button
              onClick={() => setUseTypedFallback(!useTypedFallback)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5"
            >
              <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
              {useTypedFallback ? 'Voice Mic Mode' : 'Typed Mode'}
            </button>
          </div>

          {/* Spoken / Typed Input Controls */}
          {!useTypedFallback ? (
            <div className="space-y-3">
              <button
                onClick={toggleRecording}
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-5 h-5" /> Stop Listening & Review
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" /> Tap to Speak Answer
                  </>
                )}
              </button>

              {spokenAnswer && (
                <div className="text-left bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <p className="text-slate-400 font-semibold mb-1">Captured Voice Input:</p>
                  <p className="text-slate-200">{spokenAnswer}</p>
                  <button
                    onClick={() => handleSubmitAnswer()}
                    disabled={isScoring}
                    className="mt-3 w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit Spoken Answer to MCP
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 text-left">
              <textarea
                rows={4}
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder="Type your answer here if not using mic..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              />
              <button
                onClick={() => handleSubmitAnswer()}
                disabled={isScoring || !typedAnswer.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> Submit Answer to MCP
              </button>
            </div>
          )}
        </div>

        {/* Topic Navigator */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Interview Topics Blueprint
          </h4>
          <div className="space-y-2">
            {topics.map((t, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl text-xs flex items-center justify-between transition ${
                  idx === currentQuestionIndex
                    ? 'bg-cyan-950 border border-cyan-800 text-cyan-200 font-semibold'
                    : idx < currentQuestionIndex
                    ? 'bg-slate-950 text-emerald-400 border border-slate-900'
                    : 'bg-slate-950/60 text-slate-500 border border-slate-900'
                }`}
              >
                <span className="truncate pr-2">{t}</span>
                {idx < currentQuestionIndex ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : idx === currentQuestionIndex ? (
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
                ) : (
                  <span className="text-[10px] text-slate-600">Q{idx + 1}</span>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleFinishEarly}
            className="w-full mt-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
          >
            End Interview & View Report
          </button>
        </div>
      </div>

      {/* Right Column: Live Transcript & Score Cards */}
      <div className="lg:col-span-8 flex flex-col bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl h-[700px] overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Spoken Transcript & Bar Raiser Score Cards
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Topic: <span className="text-cyan-400 font-semibold">{currentTopic}</span> | Role: {role} ({difficulty})
            </p>
          </div>
        </div>

        {/* Scrollable Timeline */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-2">
          {messages.map((m, idx) => (
            <div key={idx} className="space-y-3">
              {m.type === 'alexa' ? (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center shrink-0 text-white shadow-md">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-4 max-w-2xl text-slate-100 text-sm shadow-md">
                    <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-1">
                      Alexa+ Question ({m.topic})
                    </div>
                    <p className="leading-relaxed font-medium">{m.text}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-start gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-white shadow-md">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div className="bg-blue-950/80 border border-blue-800 rounded-2xl rounded-tr-none p-4 max-w-2xl text-slate-100 text-sm shadow-md">
                      <div className="text-[10px] text-blue-300 font-bold uppercase tracking-wider mb-1">
                        Candidate Answer
                      </div>
                      <p className="leading-relaxed">{m.text}</p>
                    </div>
                  </div>

                  {/* Score Card for Answer */}
                  {m.scoreCard && (
                    <div className="w-full max-w-2xl bg-slate-950 border border-cyan-800/80 rounded-2xl p-4 shadow-xl text-left space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-cyan-400" /> Amazon Bar Raiser Score Card
                        </span>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            m.scoreCard.overall >= 8
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : m.scoreCard.overall >= 5
                              ? 'bg-amber-950 text-amber-300 border border-amber-700'
                              : 'bg-red-950 text-red-300 border border-red-700'
                          }`}
                        >
                          Overall Score: {m.scoreCard.overall}/10
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                          <div className="text-slate-400 text-[10px]">Correctness</div>
                          <div className="text-sm font-bold text-slate-200">
                            {m.scoreCard.scores.correctness}/10
                          </div>
                        </div>
                        <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                          <div className="text-slate-400 text-[10px]">Depth</div>
                          <div className="text-sm font-bold text-slate-200">
                            {m.scoreCard.scores.depth}/10
                          </div>
                        </div>
                        <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                          <div className="text-slate-400 text-[10px]">Clarity</div>
                          <div className="text-sm font-bold text-slate-200">
                            {m.scoreCard.scores.clarity}/10
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        <p>
                          <strong className="text-cyan-400">Feedback:</strong> {m.scoreCard.feedback}
                        </p>
                        {m.scoreCard.followUp && (
                          <p>
                            <strong className="text-indigo-400">Follow-up:</strong> {m.scoreCard.followUp}
                          </p>
                        )}
                        <p className="text-slate-400 italic text-[11px]">
                          <strong className="text-amber-400 not-italic">Ideal Answer Hint:</strong>{' '}
                          {m.scoreCard.idealAnswerHint}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {isScoring && (
            <div className="flex items-center gap-3 text-cyan-400 text-xs animate-pulse p-2">
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Amazon Bedrock is evaluating answer against scoring rubric...</span>
            </div>
          )}

          <div ref={transcriptEndRef} />
        </div>

        {/* Footer Navigation Bar */}
        {lastScore && !isScoring && (
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleNextQuestion}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg flex items-center gap-2"
            >
              <span>Next Question</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
