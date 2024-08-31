export interface GameState {
    playerScore: number;
    aiScore: number;
    gamesPlayed: number;
    draws: number;
  }
  
  export interface GameHistoryItem {
    playerMove: string;
    aiMove: string;
    result: string;
    sequenceNumber: string;
  }
  
  export interface ModalContent {
    playerMove: string;
    aiMove: string;
    result: string;
  }