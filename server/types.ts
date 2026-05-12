export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  best: number;
  alive: boolean;
  isYou?: boolean;
}

export interface HelloMessage {
  type: 'hello';
  sessionId: string;
  name: string;
}

export interface ScoreMessage {
  type: 'score';
  score: number;
  alive: boolean;
}

export interface GameOverMessage {
  type: 'gameover';
  score: number;
}

export type ClientMessage = HelloMessage | ScoreMessage | GameOverMessage;

export interface LeaderboardMessage {
  type: 'leaderboard';
  entries: LeaderboardEntry[];
  yourSessionId: string;
}

export interface AckMessage {
  type: 'ack';
}

export type ServerMessage = LeaderboardMessage | AckMessage;
