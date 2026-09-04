export type SynchronizedWord = { startMS: number; content: string };

export type SynchronizedLine = { startMS: number; content: SynchronizedWord[] };
