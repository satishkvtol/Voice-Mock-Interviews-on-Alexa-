import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  index: number;
  question: string;
  topic: string;
  category: 'project' | 'skill_gap' | 'behavioral';
  answer?: string;
  score?: {
    correctness: number;
    depth: number;
    clarity: number;
    overall: number;
    feedback: string;
    followUp?: string;
    idealAnswerHint?: string;
  };
}

export interface ISession {
  sessionId: string;
  role: string;
  difficulty: 'easy' | 'medium' | 'hard';
  numQuestions: number;
  resumeText: string;
  jobDescription: string;
  parsedResume: {
    skills: string[];
    projects: { name: string; summary: string; tech: string[] }[];
    experience: { role: string; org: string; highlights: string[] }[];
    education: string;
  };
  questions: IQuestion[];
  currentQuestionIndex: number;
  status: 'setup' | 'in_progress' | 'completed';
  report?: {
    overall: number;
    perTopic: { topic: string; score: number }[];
    strengths: string[];
    weakTopics: string[];
    practicePlan: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  index: { type: Number, required: true },
  question: { type: String, required: true },
  topic: { type: String, required: true },
  category: { type: String, enum: ['project', 'skill_gap', 'behavioral'], required: true },
  answer: { type: String },
  score: {
    correctness: { type: Number },
    depth: { type: Number },
    clarity: { type: Number },
    overall: { type: Number },
    feedback: { type: String },
    followUp: { type: String },
    idealAnswerHint: { type: String },
  },
});

const SessionSchema = new Schema<ISession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    role: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    numQuestions: { type: Number, required: true },
    resumeText: { type: String, required: true },
    jobDescription: { type: String, required: true },
    parsedResume: {
      skills: [{ type: String }],
      projects: [
        {
          name: { type: String },
          summary: { type: String },
          tech: [{ type: String }],
        },
      ],
      experience: [
        {
          role: { type: String },
          org: { type: String },
          highlights: [{ type: String }],
        },
      ],
      education: { type: String },
    },
    questions: [QuestionSchema],
    currentQuestionIndex: { type: Number, default: 0 },
    status: { type: String, enum: ['setup', 'in_progress', 'completed'], default: 'in_progress' },
    report: {
      overall: { type: Number },
      perTopic: [{ topic: String, score: Number }],
      strengths: [{ type: String }],
      weakTopics: [{ type: String }],
      practicePlan: [{ type: String }],
    },
  },
  { timestamps: true }
);

export const SessionModel = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
