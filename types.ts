export enum Level {
  NOVATO = 'Novato',
  INVESTIGADOR = 'Investigador',
  PERITO = 'Perito'
}

export interface User {
  name: string;
  level: Level;
  score: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isEvaluation?: boolean;
  options?: string[]; // Options provided by the AI for this message
}

export interface EvaluationResult {
  correct?: boolean; // Optional because initial welcome message has no evaluation
  points?: number;
  gameOver?: boolean;
  options?: string[]; // Array of choice strings
}

export enum GameState {
  WELCOME,
  PLAYING,
  GAMEOVER,
  LOADING,
  ERROR
}