import mongoose from 'mongoose';
import { ISession, SessionModel } from '../models/session.js';
import { logger } from '../utils/logger.js';

// In-memory fallback map for environments without MongoDB
const inMemoryStore = new Map<string, ISession>();
let isMongoConnected = false;

export async function initStorage() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    logger.warn('MONGODB_URI is missing. Using in-memory session store (development only).');
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    isMongoConnected = true;
    logger.info('Connected successfully to MongoDB.');
  } catch (err: any) {
    logger.warn(`Failed to connect to MongoDB: ${err.message}. Falling back to in-memory session store.`);
    isMongoConnected = false;
  }
}

export async function saveSession(session: ISession): Promise<ISession> {
  if (isMongoConnected) {
    try {
      await (SessionModel as any).findOneAndUpdate({ sessionId: session.sessionId }, session, {
        upsert: true,
        new: true,
      });
      return session;
    } catch (err: any) {
      logger.error('Failed to save session to MongoDB, using in-memory store fallback', { error: err.message });
    }
  }
  inMemoryStore.set(session.sessionId, { ...session, updatedAt: new Date() });
  return session;
}

export async function getSession(sessionId: string): Promise<ISession | null> {
  if (isMongoConnected) {
    try {
      const doc = await (SessionModel as any).findOne({ sessionId }).lean();
      if (doc) return (doc as unknown) as ISession;
    } catch (err: any) {
      logger.error('Failed to query session from MongoDB', { error: err.message });
    }
  }
  return inMemoryStore.get(sessionId) || null;
}
