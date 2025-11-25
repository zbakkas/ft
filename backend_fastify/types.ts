

export type Card = { 
    id: string; // Unique identifier for stable keys
    value: number; 
    isVisible: boolean; 
    isRemoving?: boolean 
}

export type CardModel = Card[][] // [col][row] 

export interface playerWithCards 
{
    cards: CardModel;
    name: string;
    avatar: string;
    score: number;
    isYourTurn: boolean;
    first_hrade_cards:number;
    remove_card:boolean;
    last_turn:boolean;
    total_score:number;
}

  // Round result interface
export interface RoundResult {
  name: string;
  avatar: string;
  roundScore: number[];
  totalScore: number;
  // cardsRemaining: number;
}




export interface GameSettings 
{
    rows: 3,
    columns: 4,
    gameMode: "turns", // "turns" or "maxScore"
    turns: 8,
    maxScore: 100,
    firstHeadCards: 2,
    enableColumnRemoval: true,
    enableRowRemoval: false
}


// Store all created rooms
 export const rooms = new Map<string, {
    room_name: string;
    roomId: string;
    ownirName: string;
    max_players: number;
    password: string;
    players: string[];
    avatars: string[];
    status: string;
    players_Socket: Map<string, any>; // Changed: Use socket.id as key, socket as value
    Allcards: number[]; // 150 cards pool
    // cards: CardModel[]; // Current room cards
    playersWithCards: playerWithCards[];
    name_of_turn: string;
    /////////////////////
    card_in_table: Card;
    card_in_table_selected: boolean;
    random_card_in_table: Card;
    random_card_in_table_selected: boolean;

    last_tourn:boolean;
    ///////
    number_turn: number;
    round_results: RoundResult[]; // Store results for each round
    //////
    gameSettings: GameSettings;
    // Auto-play timer properties
    turnTimer: NodeJS.Timeout | null;
    // playerTurnStartTime: Date | null;
    
  
  }>(); 

  export const TURN_TIMEOUT = 60000; // 1 minute in milliseconds


