'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GATEWAY_URL } from "@/lib/gateway";


 type Card = { 
  id: string; // Unique identifier for stable keys
  value: number; 
  isVisible: boolean; 
  isRemoving?: boolean 
}

 type CardModel = Card[][] // [col][row] 

 export interface RemovalSettings 
  {
  enableColumnRemoval: boolean;
  enableRowRemoval: boolean;
  }

    // Round result interface
  export interface RoundResult 
  {
  length: any;
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

interface Room {
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
}

interface playerWithCards {
  cards: CardModel;
  name: string;
  avatar: string;
  score: number;
  isYourTurn: boolean;
  first_hrade_cards:number;
  remove_card:boolean;
  last_turn:boolean;

}

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
    rooms: Room[];
    room: Room | null;
    playerID:string ;
    startGame:boolean;
    // Actions
    joinLobby: (playerName: string) => void;
    leaveRoom: (room_id:string) => void;
    createRoom: (room_name: string, playerName: string,max_players:number ,Password_room: string ,avatar:string) => void;
    joinRoom: (room_id:string,avatar:string,player_name:string) => void;
    kickPlayer: (player_name:string,room_id:string) => void;
    joinGame: (room_id:string) => void;
    // cards: CardModel;
    cardsClick: (col: number, row: number, player_name:string) => void;
    Allplayers: playerWithCards[];
    name_of_turn: string;
    click_card_in_table: (room_id:string) => void;
    click_random_card_in_table: (room_id:string) => void;
    remove_random_card_in_table: (room_id:string) => void;
    last_turn: boolean;
    first_hrade_cards:number;
    all_first_hrade_cards:boolean;
    final_turn_Results:[RoundResult][];
    gameSettings: GameSettings;
    setGameSettings: (settings: GameSettings,room_id:string) => void;
    gameOvrer:boolean;
  }
const SocketContext = createContext<SocketContextType | null>(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
    
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [room, setRoom] = useState<Room | null>(null);
    const [playerID, setplayerID] = useState<string>("");
    // const [cards, setCards] = useState<CardModel>([]);
    const [Allplayers, setAllplayers] = useState<playerWithCards[]>([]);

    const [startGame, setStartGame] = useState<boolean>(false);
    const [name_of_turn, setName_of_turn] = useState<string>("");
    const [last_turn, setLast_turn] = useState<boolean>(false);
    const [first_hrade_cards, setFirst_hrade_cards] = useState<number>(2);
    const [all_first_hrade_cards, setAll_first_hrade_cards] = useState<boolean>(false);
    const [final_turn_Results, setFinal_turn_Results] = useState<[RoundResult][]>([]);
    const [gameSettings, setGameSettingsState] = useState<GameSettings>({
      rows: 3,
      columns: 4,
      gameMode: "turns",
      turns: 8,
      maxScore: 100,
      firstHeadCards: 2,
      enableColumnRemoval: true,
      enableRowRemoval: false
    });
    const [gameOvrer, setGameOver] = useState<boolean>(false);




    useEffect(() => 
    {
      // Initialize socket connection once
      const newSocket = io(GATEWAY_URL, {
        path: '/ws/skyjo/socket.io',
        transports: ['websocket', 'polling']
      });
  
      // Connection events
      newSocket.on("connect", () => {
        console.log('Connected to server:', newSocket.id);
        setConnected(true);
        setSocket(newSocket);
      });
  
      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      //get playerID from server
      newSocket.on("player-id", (data:any) => {
        setplayerID(data.playerID);
        console.log("Received player ID:", data.playerID);
      });
      
      
      newSocket.on("room-created", (data:any) => {
        // Add safety check here
        if (Array.isArray(data.rooms)) {
          setRooms(data.rooms);
          
        } else {
          console.warn('Received non-array rooms data:', data.rooms);
          setRooms([]);
        }
      });

      newSocket.on("kicked", (data:any) => {
        alert(data.message);
        setRoom(null);
        window.location.href = '/skyjo';
      });

      newSocket.on("joined-room", (data:any) => {
        setRoom(data.room);
        setGameSettingsState(data.room.gameSettings);
        console.log("Joined room:", data);
      });

      newSocket.on("game-started", (data:any) => {
        setStartGame(true);
        setRoom(data.room);
        setGameSettingsState(data.room.gameSettings);
        // setCards(data.cards);
        setAllplayers(data.Allplayers);
        setFirst_hrade_cards(data.first_hrade_cards);
        console.log("Game started:", data.Allplayers);
      });
  
      newSocket.on("card-updated", (data:any) => {
        // setCards(data.cards);
        setAllplayers(data.Allplayers);
        setName_of_turn(data.name_of_turn);
        setRoom(data.room);
        setLast_turn(data.last_turn);
        // setFirst_hrade_cards(data.first_hrade_cards);
        console.log("Card updated:", data.Allplayers,"<--- + --->",data.name_of_turn);
      });
      newSocket.on("first-hrade-updated", (data:any) => {
        setFirst_hrade_cards(data.first_hrade_cards);
        console.log("First hrade updated:", data.first_hrade_cards);
      });

      newSocket.on("all-first-hrade-updated", (data:any) => {
        setAll_first_hrade_cards(data.all_first_hrade_cards);
        console.log("All First hrade updated:", data.all_first_hrade_cards);
      } );

      newSocket.on("final_turn_Results", (data:any) => {
        // setAllplayers(data.Allplayers);
        // setRoom(data.room);
        setFinal_turn_Results(data);
        console.log("Final turn results:", data);
      });

      newSocket.on("game-settings-updated", (data:any) => {
        // setGameSettingsState(data.gameSettings);
        setRoom(data.gameSettings);
        console.log("Game settings updated:", data.gameSettings);
      } );

      newSocket.on("game_over", () => {
        setGameOver(true);
        alert("Game Over! The game has ended.");
        // window.location.href = '/skyjo';
        console.log("Game over received");
      });
      

 
  
      // newSocket.on('room-full', (data:any) => {
      //   alert(data.message);
      // });
  
      
  
      
        
  
 
  
      // Store socket in a way that persists across page changes
      setSocket(newSocket);

      
  
      // Cleanup on component unmount (app close)
      return () => {
        newSocket.close();
      };
    }, []); // Empty dependency array - only run once

    const leaveRoom = (room_id:string) => {
        if (socket) {
          socket.emit('leave-room',{
            room_id: room_id
          });

        }
      };
    
      const joinLobby = (playerName: string) => {
        if (socket && playerName.trim()) {
          socket.emit('join-lobby', {
            playerName: playerName.trim()

            
          });
        }
        setplayerID(playerName);
      };

    const createRoom = (room_name: string, playerName: string,max_players:number ,Password_room: string,avatar:string) => 
    {
      console.log("Creating room with avatar:", avatar);
        if(socket && room_name.trim() && playerName.trim())
        {
            socket.emit('create-room', 
            {
                room_name: room_name,
                playerName: playerName,
                max_players: max_players,
                Password_room:Password_room,
                avatar:avatar
            });
        }
    }
    const joinRoom = (room_id:string,avatar:string,player_name:string) =>
    {
      
      if(socket &&room_id.trim())
      {
        socket.emit('join-room', 
        {
          player_ID: playerID,
          room_id: room_id,
          avatar: avatar,
          player_name:player_name,
        });
      }
    }
    const kickPlayer = (player_name:string,room_id:string) =>
    {
      if(socket && player_name.trim(), room_id.trim())
      {
        socket.emit('kick-player', 
        {
          player_name: player_name
          ,room_id: room_id
        });
      }
    }

    const joinGame = (room_id:string) =>
    {
      if(socket && room_id.trim())
      {
        socket.emit('start-game', 
        {
          room_id: room_id
        });
        // setStartGame(true);
      }
    }


    const cardsClick = (col: number, row: number, player_name:string) => 
    {
      // console.log(`Card clicked at column ${col}, row ${row}`);
        if(socket && col>=0 && row>=0)
        {
          socket.emit('card-click', 
          {
            col: col,
            row: row,
            player_name: player_name,
          });
        }

    }

    const click_card_in_table = (room_id:string) =>
    {
      if(socket && room_id.trim())
      {
        socket.emit('click-card-in-table', 
        {
          room_id: room_id
        });
      }
    }

    const click_random_card_in_table = (room_id:string) =>
    {
      if(socket && room_id.trim())
      {
        socket.emit('click-random-card-in-table', 
        {
          room_id: room_id
        });
      }
    }
    const remove_random_card_in_table = (room_id:string) =>
    {
      if(socket && room_id.trim())
      {
        socket.emit('remove-random-card-in-table', 
        {
          room_id: room_id
        });
      }
    }

    const setGameSettings = (settings: GameSettings,room_id:string) => {
      if (socket) {
        socket.emit('set-game-settings', 
        { 
          settings: settings,
          room_id: room_id 
        });
      }
    };


    const value: SocketContextType = 
    {
        socket,
        connected,
        rooms,
        room,
        playerID,
        startGame,
        joinLobby,
        leaveRoom,
        createRoom,
        joinRoom,
        kickPlayer,
        joinGame,
        // cards,
        cardsClick,
        Allplayers,
        name_of_turn,
        click_card_in_table,
        click_random_card_in_table,
        remove_random_card_in_table,
        last_turn,
        first_hrade_cards,
        all_first_hrade_cards,
        final_turn_Results,
        gameSettings,
        setGameSettings,
        gameOvrer,
    };
    
      return (
        <SocketContext.Provider value={value}>
          {children}
        </SocketContext.Provider>
      );

}
