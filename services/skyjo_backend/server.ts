import Fastify from 'fastify';
import fastifySocketIo from 'fastify-socket.io';
import { Server, Socket } from 'socket.io';
import { GameSettings, CardModel ,playerWithCards, rooms,RoundResult} from './types';
import { TurnManager, buildAllCards, checkAllPlayersLastTurn, checkLastTurn, clearRoomTimer, createRandomCardsModel, createSafeRoomData, getARandomCard, hasRemovals, markCompleteLines, removeMarkedCards, remove_fun, resetGame, reset_last_turn, score, setAllCardsVisible, startRoomTimer } from './gameLogic';
import { getPlayerStats, getPlayerGameHistory, getFrequentOpponents, getLeaderboard } from './database';
import { get } from 'http';
import { send } from 'process';

// Extend Fastify types to include socket.io
declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}

const fastify = Fastify({ logger: true });

// Register Socket.IO
async function mmm() {
  await fastify.register(fastifySocketIo, {
    cors: {
      origin: "*", // More permissive for proxying/docker
      methods: ["GET", "POST"]
    }
  });
}

interface player {
  id: string;
  name: string;
  socket: any;
  roomId: string | null;
}

export const players = new Map<string, player>();

 

// Basic HTTP route
fastify.get('/', async (request, reply) => {
  return {
    hello: 'world',
    message: 'Pong game server running!',
  };
});

// API Routes for Dashboard

// Get player stats
fastify.get('/api/player/:playerId/stats', async (request, reply) => {
  const { playerId } = request.params as { playerId: string };
  
  try {
    const stats = getPlayerStats(playerId);
    if (!stats) {
      return reply.status(404).send({ error: 'Player not found' });
    }
    return stats;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

// Get player game history
fastify.get('/api/player/:playerId/history', async (request, reply) => {
  const { playerId } = request.params as { playerId: string };
  const { limit } = request.query as { limit?: string };
  
  try {
    const history = getPlayerGameHistory(playerId, limit ? parseInt(limit) : 20);
    return history;
  } catch (error) {
    console.error('Error fetching player history:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

// Get player's frequent opponents
fastify.get('/api/player/:playerId/opponents', async (request, reply) => {
  const { playerId } = request.params as { playerId: string };
  const { limit } = request.query as { limit?: string };
  
  try {
    const opponents = getFrequentOpponents(playerId, limit ? parseInt(limit) : 5);
    return opponents;
  } catch (error) {
    console.error('Error fetching opponents:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

// Get leaderboard
fastify.get('/api/leaderboard', async (request, reply) => {
  const { limit } = request.query as { limit?: string };
  
  try {
    const leaderboard = getLeaderboard(limit ? parseInt(limit) : 10);
    return leaderboard;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

// Socket.IO connection handling
fastify.ready().then(() => {
   type QueryGM = {
    userId: string;
  }
  fastify.io.on('connection', (socket: Socket) => {
    const {userId: playerId} = socket.handshake.query as QueryGM;

    console.log(`🎮 Player connected: ${playerId}`);
    //send playerId to client
    socket.emit('player-id', { playerID: playerId });



    socket.emit('room-created', { rooms: Array.from(rooms.values()).map(r => createSafeRoomData(r)) });
    
    const newPlayer: player = {
      id: playerId,
      name: "Unknown",
      socket: socket,
      roomId: null
    };
    players.set(playerId, newPlayer);

    socket.on('join-lobby', (data: { playerName: string }) => {
      const { playerName } = data;
      const player = players.get(playerId);
      if (player) {
        player.name = playerName;
        console.log(`========Player ${player.name} joined the lobby`);
      }
    });

    socket.on('set-game-settings', (data:any) => {
      const { settings, room_id } = data;
      const room = rooms.get(room_id);
      if (room) {
        room.gameSettings = settings;
        // Notify all players in the room about the updated settings
        room.players_Socket.forEach((playerSocket, socketId) => {
          playerSocket.emit('game-settings-updated', 
            { gameSettings: room });
        });
        console.log(`Game settings updated in room ${room_id}:`, settings);
      }});

    socket.on('create-room', (data:any) => {
      const { room_name,avatar, playerName, max_players, Password_room } = data;
        console.log("create-room---->",avatar);
      const newRoom = {
        room_name: room_name,
        roomId: Math.random().toString(36).substring(2, 8).toUpperCase(),
        ownirName: playerName,
        max_players: max_players,
        password: Password_room,
        players: [] as string[],
        status: 'waiting',
        players_Socket: new Map<string, any>(), // playerId -> socket
        Allcards: buildAllCards(), // Initialize with random cards
        // cards: [] as CardModel[],
        playersWithCards: [] as playerWithCards[],
        name_of_turn: "",
        avatars: [] as string[],

        ////////////////////
        card_in_table: { id: 'initial', value: 0, isVisible: true },
        random_card_in_table: { id: 'initial', value: 0, isVisible: false },
        card_in_table_selected: false,
        random_card_in_table_selected: false,
        last_tourn:false,
        number_turn: 0,
        round_results: [] as RoundResult[],
        //////
        gameSettings:{
          rows: 3,
          columns: 4,
          gameMode: "turns", // "turns" or "maxScore"
          turns: 8,
          maxScore: 100,
          firstHeadCards: 2,
          enableColumnRemoval: true,
          enableRowRemoval: false
        } as GameSettings,


        turnTimer: null as NodeJS.Timeout | null,
        

      };
      
      // Update player's roomId
      const player = players.get(playerId);
      if (player) {
        player.roomId = newRoom.roomId;
        player.name = playerName;
      }
      
      // Add the creator to the players list
      newRoom.players.push(playerName);
      newRoom.card_in_table = getARandomCard(newRoom.Allcards);
      newRoom.card_in_table.isVisible = true;
      newRoom.random_card_in_table = getARandomCard(newRoom.Allcards);
      newRoom.random_card_in_table.isVisible = false;

      newRoom.avatars.push(avatar);
      // Fix: Use socket.id as key, socket as value
      newRoom.players_Socket.set(playerId, socket);
      
      rooms.set(newRoom.roomId, newRoom);
      
      socket.emit('joined-room', { room: createSafeRoomData(newRoom), playerName: playerName });
      fastify.io.emit('room-created', { rooms: Array.from(rooms.values()).map(r => createSafeRoomData(r)) });
      
      console.log(rooms);
      console.log(players);
    });

    socket.on('join-room', (data: any) => {
      const { room_id ,avatar ,player_ID,player_name} = data;
      const room = rooms.get(room_id);
      console.log("join-room---->",avatar);
      
      if (room) 
      {
        if (room.players.length < room.max_players) {
          // Update player's roomId
          const player = players.get(player_ID);
          if (player) {
            player.roomId = room_id;
            room.players.push(player_name);
            room.avatars.push(avatar);
            //change player name
            player.name = player_name;



            // Fix: Use socket.id as key, socket as value
            room.players_Socket.set(player_ID, socket);
          }
          
          // Notify all players in the room about the new player
          fastify.io.emit('room-created', { rooms: Array.from(rooms.values()).map(r => createSafeRoomData(r)) });
          
          // Send to all sockets in the room that the player has joined
          room.players_Socket.forEach((playerSocket, socketId) => {
            playerSocket.emit('joined-room', { room: createSafeRoomData(room), playerName: player?.name });
          });
          
          console.log(` ==>Player ${player?.name} joined room ${room_id}`);
        } else {
          socket.emit('error', { message: 'Room is full' });
          console.log(`❌❌❌Player failed to join room ${room_id}: Room is full`);
        }
      } else {
        socket.emit('error', { message: 'Room not found' });
        console.log(`❌❌❌Player failed to join room ${room_id}: Room not found`);
      }
    });

    // Handle leaving room
    socket.on('leave-room', (data: any) => {
      cleanupPlayer(playerId, socket);
    });
    // Handle kicking player (only room owner can kick)
    socket.on('kick-player', (data: any) => {
          console.log("kick-player",data);
          const { player_name, room_id } = data;
          const room = rooms.get(room_id);
          if(room)
          {
            if(room.ownirName === players.get(playerId)?.name)
            {
              console.log(`Kicking player ${player_name} from room ${room_id} by ${players.get(playerId)?.name}`);
              const playerToKick = Array.from(players.values()).find(p => p.name === player_name && p.roomId === room_id);
              if(playerToKick)
              {
                const socketToKick = room.players_Socket.get(playerToKick.id);
                if(socketToKick)
                {
                  socketToKick.emit('kicked', { message: 'You have been kicked from the room.' ,});
                  cleanupPlayer(playerToKick.id, socketToKick);
                  console.log(`Player ${player_name} has been kicked from room ${room_id}`);
                }
              }
              else
              {
                console.log(`❌❌❌Player ${player_name} not found in room ${room_id} for kicking.`);
              }
            }
            else
            {
              console.log(`❌❌❌Player ${players.get(playerId)?.name} attempted to kick ${player_name} but is not the room owner.`);
            }
          }
          else
          {
            console.log(`❌❌❌Room ${room_id} not found for kicking player.`);
          }
          
    });


    socket.on('start-game', (data: any) => {
      const { room_id } = data;
      const room = rooms.get(room_id);
      if (room) {
        if (room.ownirName === players.get(playerId)?.name) {
          // Check if game is already started to prevent duplicate players
          if (room.status === 'playing') {
            console.log(`❌❌❌Game already started in room ${room_id}`);
            return;
          }
          if (room.players.length >= 2) 
          {
            room.status = 'playing';
            room.turnTimer = null;
           
            // Clear existing playersWithCards to prevent duplicates
            room.playersWithCards = [];
            
            room.players_Socket.forEach((playerSocket, socketId) => 
            {
              console.log("Dealing cards to",players.get(socketId)?.name);
              // room.cards.push(createRandomCardsModel(room.Allcards));
              room.playersWithCards.push({
                cards: createRandomCardsModel(room.Allcards,room.gameSettings),
                name: players.get(socketId)?.name || "Unknown",
                avatar: room.avatars[room.players.indexOf(players.get(socketId)?.name || "Unknown")] || "https://i.pravatar.cc/150?img=3",
                score: 0,
                isYourTurn:true
                ,first_hrade_cards:room.gameSettings.firstHeadCards,
                remove_card:false
                ,last_turn:false,
                total_score:0,
              });
              // console.log("Dealt cards to",players.get(socketId)?.name,room.cards[room.cards.length -1]);



            });
            // startRoomTimer(room);

            // Notify all players in the room that the game has started (only once)
            room.players_Socket.forEach((playerSocket, socketId) => 
            {
              playerSocket.emit('game-started', { room: createSafeRoomData(room) ,Allplayers:room.playersWithCards, first_hrade_cards:room.gameSettings.firstHeadCards});
              // console.log("Dealt cards to",players.get(socketId)?.name,room.cards[room.cards.length -1]);
            });


            fastify.io.emit('room-created', { rooms: Array.from(rooms.values()).map(r => createSafeRoomData(r)) });
            console.log(`Game started in room ${room_id}`);

          } else {
            socket.emit('error', { message: 'Need at least 2 players to start the game' });
            console.log(`❌❌❌Failed to start game in room ${room_id}: Not enough players`);
          }
        } else {
          socket.emit('error', { message: 'Only the room owner can start the game' });
          console.log(`❌❌❌Player ${players.get(playerId)?.name} attempted to start game in room ${room_id} but is not the owner`);
        }
      } else {
        socket.emit('error', { message: 'Room not found' });
        console.log(`❌❌❌Failed to start game: Room ${room_id} not found`);
      }
    });

    socket.on('card-click', (data: any) => {
      const { col, row ,player_name} = data;
      const player = players.get(playerId);
      if (player && player.roomId ) {
        if(player.name !== player_name)
        {
          console.log(`❌❌❌Player name mismatch: socket has ${player.name}, event has ${player_name}`);
          return;
        } 
        const room = rooms.get(player.roomId);
        const playerWithCards = room?.playersWithCards.find(pwc => pwc.name === player.name);
        if(playerWithCards?.last_turn)
        {
          console.log(`❌❌❌Player ${player.name} has already completed their last turn in room ${player.roomId}`);
          return;
        }
        if (room && playerWithCards) {
          if (col >= 0 && col < room.gameSettings.columns && row >= 0 && row < room.gameSettings.rows) 
          {
            
            if (!playerWithCards.cards[col][row].isVisible || room.card_in_table_selected || room.random_card_in_table_selected) 
            {
              if(!playerWithCards.isYourTurn)
              {
                console.log(`❌❌❌It's not player ${player.name}'s turn in room ${player.roomId}`);
                return;
              }
              if(playerWithCards.first_hrade_cards <=0 && !room?.playersWithCards.every(pwc => pwc.first_hrade_cards <=0)) 
              {
                console.log(`❌❌❌Player ${player.name} has no first grade cards left to reveal in room ${player.roomId}`);
                return;
              }
              playerWithCards.first_hrade_cards -=1;
              //send to palyer 
              socket.emit('first-hrade-updated', { 
                first_hrade_cards: playerWithCards.first_hrade_cards,
              });
              // send to all players in the room
              room.players_Socket.forEach((playerSocket, socketId) => {
                if(socketId !== playerId)
                {
                  playerSocket.emit('all-first-hrade-updated', {
                    all_first_hrade_cards: room.playersWithCards.every(pwc => pwc.first_hrade_cards <=0),
                  });
                }
              });
              console.log(`🙃all Player ${room.playersWithCards.every(pwc => pwc.first_hrade_cards <=0)}`);



              if(room.card_in_table_selected)
              {
                console.log(`✅ Player ${player.name} click card in the table`);
                playerWithCards.cards[col][row].isVisible = true;
                let temp = playerWithCards.cards[col][row].value;
                playerWithCards.cards[col][row].value = room.card_in_table.value;
                room.card_in_table.value = temp;
                room.card_in_table_selected=false;
                clearRoomTimer(room);

              }
              else if(room.random_card_in_table_selected)
              {
                console.log(`✅🔅 Player ${player.name} click random card in the table`);
                playerWithCards.cards[col][row].isVisible = true;
                room.card_in_table.value =playerWithCards.cards[col][row].value;
                playerWithCards.cards[col][row].value= room.random_card_in_table.value;
                room.random_card_in_table.isVisible = false;
                // room.random_card_in_table.isVisible = false;
                room.random_card_in_table_selected = false;
                playerWithCards.remove_card = false;
                // room.random_card_in_table = getARandomCard(room.Allcards);
                clearRoomTimer(room);
              }
              else
              {
                // card.isVisible = !card.isVisible; // Toggle visibility
                playerWithCards.cards[col][row].isVisible = true; // Set to visible
                playerWithCards.remove_card = false;
                clearRoomTimer(room);
              }
              //////////last_tourn///////////
              if(!room.last_tourn)
              {
                room.last_tourn = checkLastTurn(playerWithCards);
              }
              if(room.last_tourn)
              {
                console.log("⚠️⚠️⚠️ Last turn for all players ⚠️⚠️⚠️");
                playerWithCards.last_turn = true;
                playerWithCards.cards = setAllCardsVisible(playerWithCards.cards);
              }
              /////////////remove cards//////////
              remove_fun(room,playerWithCards);

              

              console.log(`Player ${player.name} clicked card at (${col}, ${row}) in room ${player.roomId}`);
            }
            else
            {
              console.log(`❌❌❌Player ${player.name} clicked an already visible card at (${col}, ${row}) in room ${player.roomId}`);
            }
            
          } else {
            console.log(`❌❌❌Invalid card position (${col}, ${row}) clicked by player ${player.name} in room ${player.roomId}`);
          }
        } else {
          console.log(`❌❌❌Room or player data not found for player ${player.name} in room ${player.roomId}`);
        }

      } else {
        console.log(`❌❌❌Player with socket ID ${playerId} attempted to click card but is not in a room`);
      }

    });
    socket.on('click-card-in-table', (data: any) => {
      const { room_id } = data;
      const player = players.get(playerId);
      if (player && player.roomId === room_id) {
        const room = rooms.get(room_id);
        console.log(`🙃all Player ${room?.playersWithCards.every(pwc => pwc.first_hrade_cards <=0)}`);

        const playerWithCards = room?.playersWithCards.find(pwc => pwc.name === player.name);
        if (room &&   playerWithCards && playerWithCards.isYourTurn && playerWithCards.first_hrade_cards<=0 &&!playerWithCards.remove_card&&room.random_card_in_table_selected === false&& room.playersWithCards.every(pwc => pwc.first_hrade_cards <=0)) {
          room.card_in_table_selected = true;
        }
        // Notify all players in the room about the card click
        room?.players_Socket.forEach((playerSocket, socketId) => {
          playerSocket.emit('card-updated', {room:createSafeRoomData(room),  Allplayers: room?.playersWithCards  ,name_of_turn: room?.playersWithCards .find(pwc => pwc.isYourTurn)?.name , last_turn: room?.last_tourn  });
        });
      } else {
        console.log(`❌❌❌Player with socket ID ${playerId} attempted to click card in table but is not in the correct room`);
      }
    });

    socket.on('click-random-card-in-table', (data: any) => {
      const { room_id } = data;
      const player = players.get(playerId);
      if (player && player.roomId === room_id) {
        const room = rooms.get(room_id);
        const playerWithCards = room?.playersWithCards.find(pwc => pwc.name === player.name);
        if (room &&playerWithCards&& playerWithCards.isYourTurn&&!playerWithCards.remove_card&& playerWithCards.first_hrade_cards<=0  && room.card_in_table_selected === false && room.playersWithCards.every(pwc => pwc.first_hrade_cards <=0)) 
        {
          room.random_card_in_table_selected = true;
          room.random_card_in_table.isVisible = true;
          room.random_card_in_table = getARandomCard(room.Allcards);

          //sd it to all players in the room
          room.players_Socket.forEach((playerSocket, socketId) => {
            playerSocket.emit('card-updated', {room:createSafeRoomData(room),  Allplayers: room.playersWithCards  ,name_of_turn: room.playersWithCards .find(pwc => pwc.isYourTurn)?.name , last_turn: room.last_tourn});
          });
        }
      } else {
        console.log(`❌❌Player with socket ID ${playerId} attempted to click card in table but is not in the correct room`);
      }
    });
    socket.on('remove-random-card-in-table', (data: any) => {
      const { room_id } = data;
      const player = players.get(playerId);
      if (player && player.roomId === room_id) {
        const room = rooms.get(room_id);
        const playerWithCards = room?.playersWithCards.find(pwc => pwc.name === player.name);
        if (room && playerWithCards && playerWithCards.isYourTurn && !playerWithCards.remove_card && room?.playersWithCards.every(pwc => pwc.first_hrade_cards <=0) ) {
          room.random_card_in_table.isVisible = false;
          room.card_in_table.value = room.random_card_in_table.value;
          // room.random_card_in_table.isVisible = false;
          room.random_card_in_table_selected = false;
          playerWithCards.remove_card = true;
          // room.random_card_in_table = getARandomCard(room.Allcards);

          // Notify all players in the room about the card removal
          room.players_Socket.forEach((playerSocket, socketId) => {
            playerSocket.emit('card-updated', {room:createSafeRoomData(room),  Allplayers: room.playersWithCards  ,name_of_turn: room.playersWithCards .find(pwc => pwc.isYourTurn)?.name  , last_turn: room.last_tourn});
          });
        }
      } else {
        console.log(`❌❌❌Player with socket ID ${playerId} attempted to remove random card in table but is not in the correct room`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`👋 Player disconnected: ${playerId}`);
      cleanupPlayer(playerId, socket);
    });
  });
});

// Cleanup player function
function cleanupPlayer(playerId: string, socket: any) {
  const player = players.get(playerId);
  if (player) {
    const room = rooms.get(player.roomId!);
    if (room) {

      const playerIndex = room.players.findIndex(name => name === player.name);

      // Remove player from room
      room.players = room.players.filter(name => name !== player.name);
      // Remove player's avatar from room
      room.avatars.splice(playerIndex, 1);
      // Remove socket from room's socket map
      room.players_Socket.delete(playerId);

      room.playersWithCards = room.playersWithCards.filter(pwc => pwc.name !== player.name);
           room.players_Socket.forEach((playerSocket, socketId) => {
          playerSocket.emit('card-updated', {room:createSafeRoomData(room),  Allplayers: room.playersWithCards  ,name_of_turn: room.name_of_turn , last_turn: room.last_tourn });
        });
      //IF THE PLAYER REMOVER HAVE THE TURN GIVE THE TURN TO THE NEXT PLAYER
      console.log("Player leaving:", player.name, "player turn:", room.name_of_turn);
      if(room.name_of_turn === player.name && room.playersWithCards.length >0)
      {
        room.playersWithCards = TurnManager(room.playersWithCards );
        room.name_of_turn = room.playersWithCards.find(pwc => pwc.isYourTurn)?.name || "";
        // Notify all players in the room about the turn change
        room.players_Socket.forEach((playerSocket, socketId) => {
          playerSocket.emit('card-updated', {room:createSafeRoomData(room),  Allplayers: room.playersWithCards  ,name_of_turn: room.name_of_turn , last_turn: room.last_tourn });
        });
      }
      
      // If the player was the room owner and there are still players left, assign a new owner
      if (room.ownirName === player.name && room.players.length > 0) {
        room.ownirName = room.players[0];
        console.log(`Room owner ${player.name} left. New owner is ${room.ownirName}`);
      }


      // If room is empty, delete it
      if (room.players.length <= 0) 
      {
        // if(room.players.length == 1)
        // {
        //   room.players_Socket.forEach((playerSocket) => {
        //     playerSocket.emit('game_over');
        //   });
        // }
        rooms.delete(player.roomId!);
        // deleteRoom(player.roomId!);
      } else 
      {
        // console.log("fffffffff");
        // Notify remaining players in the room
        room.players_Socket.forEach((playerSocket, socketId) => {
          playerSocket.emit('joined-room', { room: createSafeRoomData(room), playerName: player.name });
        });
      }
      // console.log("rrrrrrrrf");
      player.roomId = null;
      fastify.io.emit('room-created', { rooms: Array.from(rooms.values()).map(r => createSafeRoomData(r)) });
      // console.log("444444444444");
      console.log(`Player ${player.name} left room ${player.roomId}`);
    } else {
      console.log(`❌Room with ID ${player.roomId} not found during cleanup.`);
    }
  } else {
    console.log(`❌Player with ID ${playerId} not found during cleanup.`);
  }
}

export function deleteRoom(roomId: string) {
  if (rooms.has(roomId)) {
    rooms.delete(roomId);
    fastify.io.emit('room-created', { rooms: Array.from(rooms.values()).map(r => createSafeRoomData(r)) });
  }
}

// Start server
const start = async () => {
  await mmm();
  try {
    await fastify.listen({ port: 3007, host: '0.0.0.0' });
    console.log('🎮 Pong server running on http://localhost:3007');
    console.log('🚀 WebSocket endpoint: ws://localhost:3007');
    console.log('🌐 Accepting connections from: http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();






