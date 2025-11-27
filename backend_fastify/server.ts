import Fastify from 'fastify';
import fastifySocketIo from 'fastify-socket.io';
import { GameSettings, CardModel ,playerWithCards, rooms,RoundResult} from './types';
import { TurnManager, buildAllCards, checkAllPlayersLastTurn, checkLastTurn, clearRoomTimer, createRandomCardsModel, createSafeRoomData, getARandomCard, hasRemovals, markCompleteLines, removeMarkedCards, remove_fun, resetGame, reset_last_turn, score, setAllCardsVisible, startRoomTimer } from './gameLogic';
import { get } from 'http';
import { send } from 'process';
const fastify = Fastify({ logger: true });

// Register Socket.IO
async function mmm() {
  await fastify.register(fastifySocketIo, {
    cors: {
      origin: "http://localhost:3000", // Your Next.js app URL
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

const players = new Map<string, player>();

 

// Basic HTTP route
fastify.get('/', async (request, reply) => {
  return {
    hello: 'world',
    message: 'Pong game server running!',
  };
});

// Socket.IO connection handling
fastify.ready().then(() => {
   type QueryGM = {
    userId: string;
  }
  fastify.io.on('connection', (socket) => {
    const {userId: playerId} = socket.handshake.query as QueryGM;

    console.log(`🎮 Player connected: ${playerId}`);
    //send playerId to client
    socket.emit('player-id', { playerID: playerId });



    socket.emit('room-created', { rooms: Array.from(rooms.values()) });
    
    const newPlayer: player = {
      id: socket.id,
      name: "",
      socket: socket,
      roomId: null
    };
    players.set(socket.id, newPlayer);

    socket.on('join-lobby', (data) => {
      const { playerName } = data;
      const player = players.get(socket.id);
      if (player) {
        player.name = playerName;
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
        players: [],
        status: 'waiting',
        players_Socket: new Map<string, any>(), // socket.id -> socket
        Allcards: buildAllCards(), // Initialize with random cards
        // cards: [] as CardModel[],
        playersWithCards: [] as playerWithCards[],
        name_of_turn: "",
        avatars: [],

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
      const player = players.get(socket.id);
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
      newRoom.players_Socket.set(socket.id, socket);
      
      rooms.set(newRoom.roomId, newRoom);
      
      socket.emit('joined-room', { room: newRoom, playerName: playerName });
      fastify.io.emit('room-created', { rooms: Array.from(rooms.values()) });
      
      console.log(rooms);
      console.log(players);
    });

    socket.on('join-room', (data: any) => {
      const { room_id ,avatar} = data;
      const room = rooms.get(room_id);
      console.log("join-room---->",avatar);
      
      if (room) {
        if (room.players.length < room.max_players) {
          // Update player's roomId
          const player = players.get(socket.id);
          if (player) {
            player.roomId = room_id;
            room.players.push(player.name);
            room.avatars.push(avatar);
            // Fix: Use socket.id as key, socket as value
            room.players_Socket.set(socket.id, socket);
          }
          
          // Notify all players in the room about the new player
          fastify.io.emit('room-created', { rooms: Array.from(rooms.values()) });
          
          // Send to all sockets in the room that the player has joined
          room.players_Socket.forEach((playerSocket, socketId) => {
            playerSocket.emit('joined-room', { room: room, playerName: player?.name });
          });
          
          console.log(`Player ${player?.name} joined room ${room_id}`);
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
      cleanupPlayer(socket.id, socket);
    });
    // Handle kicking player (only room owner can kick)
    socket.on('kick-player', (data: any) => {
          console.log("kick-player",data);
          const { player_name, room_id } = data;
          const room = rooms.get(room_id);
          if(room)
          {
            if(room.ownirName === players.get(socket.id)?.name)
            {
              console.log(`Kicking player ${player_name} from room ${room_id} by ${players.get(socket.id)?.name}`);
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
              console.log(`❌❌❌Player ${players.get(socket.id)?.name} attempted to kick ${player_name} but is not the room owner.`);
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
        if (room.ownirName === players.get(socket.id)?.name) {
          if (room.players.length >= 2) 
          {
            room.status = 'playing';
            room.turnTimer = null;
           
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
              playerSocket.emit('game-started', { room: room ,Allplayers:room.playersWithCards, first_hrade_cards:room.gameSettings.firstHeadCards});
              // console.log("Dealt cards to",players.get(socketId)?.name,room.cards[room.cards.length -1]);



            });
            // startRoomTimer(room);

            // Notify all players in the room that the game has started
            room.players_Socket.forEach((playerSocket, socketId) => 
            {
              playerSocket.emit('game-started', { room: room ,Allplayers:room.playersWithCards, first_hrade_cards:room.gameSettings.firstHeadCards});
              // console.log("Dealt cards to",players.get(socketId)?.name,room.cards[room.cards.length -1]);
            });


            fastify.io.emit('room-created', { rooms: Array.from(rooms.values()) });
            console.log(`Game started in room ${room_id}`);

          } else {
            socket.emit('error', { message: 'Need at least 2 players to start the game' });
            console.log(`❌❌❌Failed to start game in room ${room_id}: Not enough players`);
          }
        } else {
          socket.emit('error', { message: 'Only the room owner can start the game' });
          console.log(`❌❌❌Player ${players.get(socket.id)?.name} attempted to start game in room ${room_id} but is not the owner`);
        }
      } else {
        socket.emit('error', { message: 'Room not found' });
        console.log(`❌❌❌Failed to start game: Room ${room_id} not found`);
      }
    });

    socket.on('card-click', (data: any) => {
      const { col, row ,player_name} = data;
      const player = players.get(socket.id);
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
                if(socketId !== socket.id)
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
        console.log(`❌❌❌Player with socket ID ${socket.id} attempted to click card but is not in a room`);
      }

    });
    socket.on('click-card-in-table', (data: any) => {
      const { room_id } = data;
      const player = players.get(socket.id);
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
        console.log(`❌❌❌Player with socket ID ${socket.id} attempted to click card in table but is not in the correct room`);
      }
    });

    socket.on('click-random-card-in-table', (data: any) => {
      const { room_id } = data;
      const player = players.get(socket.id);
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
        console.log(`❌❌Player with socket ID ${socket.id} attempted to click card in table but is not in the correct room`);
      }
    });
    socket.on('remove-random-card-in-table', (data: any) => {
      const { room_id } = data;
      const player = players.get(socket.id);
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
        console.log(`❌❌❌Player with socket ID ${socket.id} attempted to remove random card in table but is not in the correct room`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`👋 Player disconnected: ${socket.id}`);
      cleanupPlayer(socket.id, socket);
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
      room.players_Socket.delete(socket.id);

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
      if (room.players.length <= 1) 
      {
        if(room.players.length == 1)
        {
          room.players_Socket.forEach((playerSocket) => {
            playerSocket.emit('game_over');
          });
        }
        rooms.delete(player.roomId!);
        // deleteRoom(player.roomId!);
      } else 
      {
        // console.log("fffffffff");
        // Notify remaining players in the room
        room.players_Socket.forEach((playerSocket, socketId) => {
          playerSocket.emit('joined-room', { room: room, playerName: player.name });
        });
      }
      // console.log("rrrrrrrrf");
      player.roomId = null;
      fastify.io.emit('room-created', { rooms: Array.from(rooms.values()) });
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
    fastify.io.emit('room-created', { rooms: Array.from(rooms.values()) });
  }
}

// Start server
const start = async () => {
  mmm();
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






