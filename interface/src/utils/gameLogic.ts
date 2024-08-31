import { Provider } from "aptos";
import { GameState, GameHistoryItem, ModalContent } from "../types";
import { moves, results } from "../constants";

export const initializeGame = async (
  account: any,
  signAndSubmitTransaction: any,
  moduleAddress: string,
  provider: Provider
) => {
  const payload = {
    type: "entry_function_payload",
    function: `${moduleAddress}::rock_paper_scissors::initialize_game`,
    type_arguments: [],
    arguments: [],
  };
  const response = await signAndSubmitTransaction(payload);
  await provider.waitForTransaction(response.hash);
};

export const playGame = async (
  account: any,
  signAndSubmitTransaction: any,
  moduleAddress: string,
  provider: Provider,
  moveIndex: number
): Promise<ModalContent> => {
  const payload = {
    type: "entry_function_payload",
    function: `${moduleAddress}::rock_paper_scissors::play_game`,
    type_arguments: [],
    arguments: [moveIndex],
  };
  const response = await signAndSubmitTransaction(payload);
  await provider.waitForTransaction(response.hash);
  
  const events = await provider.getEventsByEventHandle(account.address, 
    `${moduleAddress}::rock_paper_scissors::GameEventHandle`,
    "game_events"
  );
  
  if (events.length > 0) {
    const latestEvent = events[events.length - 1] as any;
    const playerMove = moves[Number(latestEvent.data.player_choice)];
    const aiMove = moves[Number(latestEvent.data.ai_choice)];
    const result = results[Number(latestEvent.data.result)];
    
    return { playerMove, aiMove, result };
  }
  
  throw new Error("Failed to retrieve game result");
};

export const fetchGameState = async (
  account: any,
  provider: Provider,
  moduleAddress: string,
  setGameState: (state: GameState) => void,
  setGameInitialized: (initialized: boolean) => void
) => {
  try {
    const resource = await provider.getAccountResource(
      account.address,
      `${moduleAddress}::rock_paper_scissors::GameState`
    );
    const state = resource.data as any;
    setGameState({
      playerScore: Number(state.player_wins),
      aiScore: Number(state.ai_wins),
      gamesPlayed: Number(state.games_played),
      draws: Number(state.draws),
    });
    setGameInitialized(true);
  } catch (e) {
    console.error("Error fetching game state:", e);
    setGameInitialized(false);
    setGameState({
      playerScore: 0,
      aiScore: 0,
      gamesPlayed: 0,
      draws: 0,
    });
  }
};

export const fetchGameHistory = async (
  account: any,
  provider: Provider,
  moduleAddress: string,
  setGameHistory: (history: GameHistoryItem[]) => void
) => {
  try {
    const events = await provider.getEventsByEventHandle(account.address, 
      `${moduleAddress}::rock_paper_scissors::GameEventHandle`,
      "game_events"
    );
    
    const history = events.map((event: any) => ({
      playerMove: moves[Number(event.data.player_choice)],
      aiMove: moves[Number(event.data.ai_choice)],
      result: results[Number(event.data.result)],
      sequenceNumber: event.sequence_number
    })).reverse().slice(0, 5);
    
    setGameHistory(history);
  } catch (error) {
    console.error("Error fetching game history:", error);
    setGameHistory([]);
  }
};