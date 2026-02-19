export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface TranscriptionItem {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

export interface AudioVisualizerState {
  volume: number; // 0 to 1
  isActive: boolean;
}
