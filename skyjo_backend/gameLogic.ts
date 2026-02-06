import { deleteRoom, players } from './server';
import { GameSettings, CardModel, Card, playerWithCards, TURN_TIMEOUT, RoundResult, rooms } from './types';
import { saveMatchResult, MatchResult, PlayerResult } from './database';

// Build the initial list of cards according to your distribution
export function buildAllCards(): number[] {
  const cards: number[] = [];
  // 5x -2
  for (let i = 0; i < 5; i++) cards.push(-2);
  // 15x 0
  for (let i = 0; i < 15; i++) cards.push(0);
  // 10x each from -1 to 12, skipping 0 since already added
  for (let v = -1; v <= 12; v++) {
    if (v !== 0) {
      for (let i = 0; i < 10; i++) cards.push(v);
    }
  }
  return cards;
}

// Pick a random card from the list and remove it
function getRandomAndRemove(arr: number[]): number | undefined {
  if (arr.length === 0) return undefined;
  const idx = Math.floor(Math.random() * arr.length);
  return arr.splice(idx, 1)[0];
}

//   const allCards = buildAllCards();
// Your requested function, returns a CardModel with random cards from the pool
export function createRandomCardsModel(allCards: number[],gameSettings:GameSettings): CardModel {
    const cards2D: CardModel =[];
    let idCounter = 0;
    for (let col = 0; col < gameSettings.columns; col++) {
        const column: Card[] = []; // Change CardModel[] to Card[]
        for (let row = 0; row < gameSettings.rows; row++) {
            const value = getRandomAndRemove(allCards);
            if (value === undefined) throw new Error('No more cards available!');
            column.push({
                id: `c${col}r${row}_${idCounter++}`,
                value,
                isVisible: false,
                isRemoving: false,
            });
        }
        cards2D.push(column);
    }
    return cards2D;
  }

  export function getARandomCard(allCards: number[]): Card  {
    const value = getRandomAndRemove(allCards);
    
    return {
        id: `single_${Math.random().toString(36).substr(2, 9)}`,
        value: value !== undefined ? value : 0,
        isVisible: true,
        isRemoving: false,
    };
  }

  export function TurnManager( Allplayers :playerWithCards[]): playerWithCards[] 
  {

      //check if all players hafe first_hrade_cards
    const allHaveFirstHradeCards = Allplayers.every(player => player.first_hrade_cards <= 0);

      if(!allHaveFirstHradeCards)
      {
        console.log("Not all players have finished their initial cards.");
        return Allplayers;
      }
    // Find the index of the current player whose turn it is
    const currentIndex = Allplayers.findIndex(player => player.isYourTurn);
    console.log("Current Index:", currentIndex);
    
    // If no player is currently marked as having the turn, start with the first player
    let nextIndex = (currentIndex === -1) ? 0 : (currentIndex + 1) % Allplayers.length;
    console.log("Next Index:", nextIndex);
    // Update the isYourTurn flags
    return Allplayers.map((player, index) => ({
        ...player,
        isYourTurn: index === nextIndex

    }));
  }



  // Replace the existing markCompleteLines function with this improved version:
// Replace the existing markCompleteLines function:
export function markCompleteLines(cards: CardModel, gameSettings:GameSettings): CardModel {
  const newCards = cards.map(column => 
    column.map(card => ({ ...card, isRemoving: false })) // Reset removing flag
  );

  
  const currentCols = newCards.length;
  const currentRows = newCards[0]?.length || 0;

  if(currentCols <= 2 && currentRows <= 2) {
    return newCards; // Not enough cards to form lines
  }
  
  // Check columns - if enabled and ALL cards in a column are visible and have the same value
  if (gameSettings.enableColumnRemoval) {
    for (let col = 0; col < currentCols; col++) {
      const column = newCards[col];
      
      // Check if all cards in this column are visible
      const allVisible = column.every(card => card.isVisible);
      
      if (allVisible && column.length > 0) {
        // Check if all cards have the same value
        const firstValue = column[0].value;
        const allSameValue = column.every(card => card.value === firstValue);
        
        if (allSameValue) 
        {
          // Mark entire column for removal
          column.forEach(card => 
            {
              card.isRemoving = true;
            });
          console.log(`✅ Marked entire column ${col} for removal (value: ${firstValue})`);
        }
      }
    }
  }
  
  // Check rows - if enabled and ALL cards in a row are visible and have the same value
  if (gameSettings.enableRowRemoval) {
    for (let row = 0; row < currentRows; row++) {
      const rowCards: Card[] = [];
      
      // Get all cards in this row
      for (let col = 0; col < currentCols; col++) {
        if (newCards[col][row]) {
          rowCards.push(newCards[col][row]);
        }
      }
      
      // Check if all cards in this row are visible
      const allVisible = rowCards.every(card => card.isVisible);
      
      if (allVisible && rowCards.length > 0) {
        // Check if all cards have the same value
        const firstValue = rowCards[0].value;
        const allSameValue = rowCards.every(card => card.value === firstValue);
        
        if (allSameValue) {
          // Mark entire row for removal
          for (let col = 0; col < currentCols; col++) {
            if (newCards[col][row]) {
              newCards[col][row].isRemoving = true;
            }
          }
          console.log(`✅ Marked entire row ${row} for removal (value: ${firstValue})`);
        }
      }
    }
  }
  
  return newCards;
}

  // Function to remove marked cards and shift remaining cards down
  // Replace the existing removeMarkedCards function with this:
  export const removeMarkedCards = (cards: CardModel): CardModel => {
    // Remove columns that have all cards marked for removal
    let newCards = cards.filter(column => 
        !column.every(card => card.isRemoving)
    )
    
    // Remove rows that have all cards marked for removal
    if (newCards.length > 0) {
        const currentRows = newCards[0]?.length || 0
        const rowsToRemove: number[] = []
        
        for (let row = 0; row < currentRows; row++) {
            const allRemoving = newCards.every(column => 
                column[row] && column[row].isRemoving
            )
            if (allRemoving) {
                rowsToRemove.push(row)
            }
        }
        
        // Remove rows (in reverse order to maintain indices)
        rowsToRemove.reverse().forEach(rowIndex => {
            newCards.forEach(column => {
                column.splice(rowIndex, 1)
            })
        })
    }
    
    return newCards
  }

  // Check if any cards are marked for removal
  export function hasRemovals(cards: CardModel): boolean {
    return cards.some(column => 
        column.some(card => card.isRemoving)
    )
  }


  export function score(cards: CardModel): number {
    let totalScore = 0;

  
    for (let col = 0; col < cards.length; col++) {
      for (let row = 0; row < cards[col].length; row++) {
        const card = cards[col][row];
        if (card.isVisible ) 
        {
          totalScore += card.value;
        }
      }
    }
  
    return totalScore;
  }


  export   const checkLastTurn = (player: playerWithCards): boolean => {
    return player.cards.flat().every(card => card.isVisible);
  } 

  export const setAllCardsVisible = (cards: CardModel): CardModel => {
    return cards.map(column => 
        column.map(card => ({ ...card, isVisible: true })) // Set all cards to visible
    );
  }



  // Add this function to your gameLogic.ts file

// Add this function to check if all players have completed their last turn
export function checkAllPlayersLastTurn(playersWithCards: playerWithCards[]): boolean {
  return playersWithCards.every(player => player.last_turn === true);
}

// Add this function to calculate final scores and determine winner
// export function calculateFinalResults(playersWithCards: playerWithCards[]) {
//   const results = playersWithCards.map(player => ({
//     name: player.name,
//     score: score(player.cards),
//     avatar: player.avatar
//   })).sort((a, b) => a.score - b.score); // Sort by lowest score (winner in Skyjo)
  
//   return {
//     winner: results[0],
//     finalScores: results
//   };
// }

// Update your existing resetGame function or add it if it doesn't exist
export function resetGame(room: any): void {
  // Reset game status
  room.status = 'playing';
  
  // Reset all card-related data
  room.Allcards = buildAllCards(); // Fresh deck of cards
  // room.cards = []; // Clear all player cards
  // room.playersWithCards = []; // Clear all players with cards data
  // reset each player's cards  playersWithCards
  room.playersWithCards = room.playersWithCards.map((player: playerWithCards,index:number) => ({
    ...player,
    cards: createRandomCardsModel(room.Allcards,room.gameSettings),
    score: 0,
    isYourTurn:true,
    first_hrade_cards: room.gameSettings.firstHeadCards,
    remove_card: false,
    last_turn: false,
  }));
  
  // Reset table cards
  room.card_in_table = getARandomCard(room.Allcards);
  room.card_in_table.isVisible = true;
  room.random_card_in_table = getARandomCard(room.Allcards);
  room.random_card_in_table.isVisible = false;
  
  // Reset selection states
  room.card_in_table_selected = false;
  room.random_card_in_table_selected = false;
  
  // Reset turn and game state
  room.name_of_turn = room.playersWithCards[0]?.name || "";
  room.last_tourn = false;
  
  // Reset removal settings to default
  // room.removalSettings = {
  //   : true,
  //   enableRowRemoval: true,
  // };
  console.log("✅ Game reset complete");
}


export function reset_last_turn (room:any, playerWithCards:playerWithCards): void
{
  if(room.last_tourn)
  {
    if(checkAllPlayersLastTurn(room.playersWithCards))
    {
      // Initialize round_results if it doesn't exist (first round)
      if (!room.round_results || room.round_results.length === 0) {
        room.round_results = room.playersWithCards.map((pwc: playerWithCards) => ({
          name: pwc.name,
          avatar: pwc.avatar,
          roundScore: [],
          totalScore: 0,
        }));
        console.log("🔄 Initialized round_results:", room.round_results);
      }

      // Update scores for current round
      room.round_results.forEach((result: any) => {
        const player = room.playersWithCards.find((pwc: playerWithCards) => pwc.name === result.name);
        if (player) {
          result.roundScore.push(player.score);
          result.totalScore += player.score; // Add current round score to total
          console.log(`📊 Updated ${result.name}: round score +${player.score}, total: ${result.totalScore}`);
        }
      });

      // Sort by lowest score (winner in Skyjo)
      room.round_results.sort((a: RoundResult, b: RoundResult) => a.totalScore - b.totalScore);

      room.number_turn += 1;
      
      console.log("📈 Current round_results:", room.round_results);
      
      if(!isGameOver(room))
      {
        resetGame(room);
        console.log("🟢🟢🟢 Game reset after last turn 🟢🟢🟢");
        console.log("Final Results:", room.round_results);
        
        room.players_Socket.forEach((playerSocket: any, socketId: string) => {
          playerSocket.emit('final_turn_Results', room.round_results);
        });
      }
      else
      {
        console.log("🏆🏆🏆 Game over after last turn 🏆🏆🏆");
        console.log("Final Results:", room.round_results);
        
        // Save match results to database
        try {
          const matchResult: MatchResult = {
            roomId: room.roomId,
            roomName: room.room_name,
            gameMode: room.gameSettings.gameMode,
            maxScore: room.gameSettings.maxScore,
            totalTurns: room.number_turn,
            durationSeconds: 0, // Could track actual game duration if needed
            players: room.round_results.map((result: RoundResult, index: number) => {
              // Find player ID from players map
              const playerEntry = [...players.entries()].find(([id, p]) => p.name === result.name && p.roomId === room.roomId);
              const playerId = playerEntry ? playerEntry[0] : result.name; // Fallback to name if not found
              
              return {
                playerId: playerId,
                playerName: result.name,
                avatar: result.avatar,
                finalScore: result.totalScore,
                position: index + 1, // Already sorted by score
                roundScores: result.roundScore,
                isWinner: index === 0, // First player (lowest score) is winner
              } as PlayerResult;
            }),
          };
          
          const matchId = saveMatchResult(matchResult);
          console.log(`💾 Match saved to database with ID: ${matchId}`);
        } catch (error) {
          console.error('❌ Failed to save match to database:', error);
        }
        
        room.players_Socket.forEach((playerSocket: any, socketId: string) => {
          playerSocket.emit('final_turn_Results', room.round_results);
        });
        room.status = 'finished';
        clearRoomTimer(room);


        room.players_Socket.forEach((playerSocket: any, socketId: string) => {
          playerSocket.emit('game_over');
        });

        //remove room 
        setTimeout(() => {
          rooms.delete(room.roomId);
          console.log(`🗑️ Room ${room.roomId} deleted after game over.`);
        }, 10000); // Delete room after 1 minute

        // sed to all players in the server that the game is over
        deleteRoom(room.roomId);
       
        

      }
    }
  }
}


export function isGameOver(room:any): boolean
{
  if(room.last_tourn)
  {
    // if(checkAllPlayersLastTurn(room.playersWithCards))
    // {
    //   if()
    // }
    if(room.gameSettings.gameMode === "maxScore" )
    {
      // console.log("Checking maxScore condition for game over.");
      
      if( room.round_results.some((pwc: RoundResult) => pwc.totalScore >= room.gameSettings.maxScore))
      {
        return true;
      }

      // console.log(room.round_results.map((pwc: RoundResult) => ({ name: pwc.name, totalScore: pwc.totalScore })));
    }
    else if(room.gameSettings.gameMode === "turns" )
    {
      if(room.number_turn >= room.gameSettings.turns)
      {
        return true;
      }

    }
  }
  return false;
}

export function remove_fun(room:any, playerWithCards:playerWithCards): void
{
  const markedCards = markCompleteLines(playerWithCards.cards, room.gameSettings);
  const hasCardRemovals = hasRemovals(markedCards);
  if(hasCardRemovals)
  {
    playerWithCards.cards =  markedCards;
    // Notify all players about the updated cards after removal
    playerWithCards.score = score(playerWithCards.cards);

    /// make the card in the table = markedCards removed card
    room.card_in_table.value = markedCards.flat().find(card => card.isRemoving)?.value || room.card_in_table.value; 
    // reset_last_turn(room, playerWithCards);
    room.players_Socket.forEach((playerSocket: any, socketId: string) => {
      playerSocket.emit('card-updated', {
        room: createSafeRoomData(room),
        Allplayers: room.playersWithCards,
        name_of_turn: room.playersWithCards.find((pwc: playerWithCards) => pwc.isYourTurn)?.name,
        last_turn: room.last_tourn,
        //send first hrade cards for player_name 
        // first_hrade_cards: playerWithCards.first_hrade_cards,
      });
    });
    setTimeout(() => {
      const updatedCards = removeMarkedCards(markedCards);
      playerWithCards.cards = updatedCards;
      // playerWithCards.score = score(playerWithCards.cards);
      // reset_last_turn(room, playerWithCards);
      remove_fun(room, playerWithCards);
      // room.playersWithCards = TurnManager(room.playersWithCards );
      // // Notify all players about the updated cards after removal
      // room.players_Socket.forEach((playerSocket, socketId) => {
      //   playerSocket.emit('card-updated', {
      //     room: room,
      //     Allplayers: room.playersWithCards,
      //     name_of_turn: room.playersWithCards.find(pwc => pwc.isYourTurn)?.name,
      //     last_turn: room.last_tourn,
      //     // first_hrade_cards: playerWithCards.first_hrade_cards,
      //   });
      // });
      
    }, 1000);
  }
  else
  {
    playerWithCards.score = score(playerWithCards.cards);
    reset_last_turn(room, playerWithCards);
    room.playersWithCards = TurnManager(room.playersWithCards );
    room.name_of_turn = room.playersWithCards.find((pwc: playerWithCards) => pwc.isYourTurn)?.name || "";
    startRoomTimer(room);
    room.players_Socket.forEach((playerSocket: any, socketId: string) => {
      // playerSocket.emit('card-updated', { col, row, card, playerName: player.name });
      playerSocket.emit('card-updated', {
        room:createSafeRoomData(room),
        Allplayers: room.playersWithCards  ,
        name_of_turn: room.playersWithCards .find((pwc: playerWithCards) => pwc.isYourTurn)?.name,  
        last_turn: room.last_tourn,
        // first_hrade_cards: playerWithCards.first_hrade_cards,
      });
    });
  }
}

// Add this new function for auto-play
function flipRandomHiddenCard(playerWithCards: playerWithCards): { col: number, row: number } | null {
  const hiddenCards: { col: number, row: number }[] = [];
  
  // Find all hidden cards
  for (let col = 0; col < playerWithCards.cards.length; col++) {
    for (let row = 0; row < playerWithCards.cards[col].length; row++) {
      if (!playerWithCards.cards[col][row].isVisible) {
        hiddenCards.push({ col, row });
      }
    }
  }
  
  // If no hidden cards, return null
  if (hiddenCards.length === 0) {
    return null;
  }
  
  // Pick a random hidden card
  const randomIndex = Math.floor(Math.random() * hiddenCards.length);
  const { col, row } = hiddenCards[randomIndex];
  
  // Flip the card
  playerWithCards.cards[col][row].isVisible = true;
  
  return { col, row };
}


// function to clear room timer
export function clearRoomTimer(room: any) {
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = null;
    console.log(`⏰ Cleared timer for room ${room.roomId}`);
  }
}

export function startRoomTimer(room: any) {
  // Clear any existing timer
  clearRoomTimer(room);
  
  // Don't start timer if game is not playing or in last turn phase
  if (room.status !== 'playing' || room.last_tourn) {
    console.log(`⏰ No timer needed - game status: ${room.status}, last turn: ${room.last_tourn}`);
    return;
  }
  
  // Find current player
  const currentPlayer = room.playersWithCards.find((pwc: playerWithCards) => pwc.isYourTurn);
  if (!currentPlayer) {
    console.log(`⏰ No current player found, not starting timer`);
    return;
  }
  
  room.turnTimer = setTimeout(() => {
    console.log(`⏰ Timer expired for player ${currentPlayer.name} in room ${room.roomId}`);
    handleRoomTimeout(room);
  }, TURN_TIMEOUT);
  
  console.log(`⏰ Started 60s timer for player ${currentPlayer.name} in room ${room.roomId}`);
}


function handleRoomTimeout(room: any) {
  console.log(`⏰ Auto-playing for inactive player in room ${room.roomId}`);
  
  // Clear the timer
  clearRoomTimer(room);
  
  // Check if game is still active
  if (room.status !== 'playing') {
    console.log(`⏰ Skipping auto-play - game not active`);
    return;
  }
  
  // Find current player
  const currentPlayer = room.playersWithCards.find((pwc: playerWithCards) => pwc.isYourTurn);
  if (!currentPlayer) {
    console.log(`⏰ No current player found for auto-play`);
    return;
  }
  
  // Find current player's socket - Find player by name from players Map, then get their socket
  const playerEntry = [...players.entries()].find(([id, p]) => p.name === currentPlayer.name && p.roomId === room.roomId);
  if (!playerEntry) {
    console.log(`❌ No player entry found for ${currentPlayer.name}`);
    return;
  }
  
  const [playerId, playerData] = playerEntry;
  const currentSocket = room.players_Socket.get(playerId);
  
  // Ensure currentSocket is valid before accessing it
  if (!currentSocket) {
    console.log(`❌ No socket found for player ${currentPlayer.name} with playerId ${playerId}`);
    return; // Skip further execution if socket is not found
  }
  
  // If player still has first grade cards to reveal
  if (currentPlayer.first_hrade_cards > 0) {
    console.log(`⏰ Auto-revealing first grade card for ${currentPlayer.name}`);
    
    // Find a random hidden card and flip it
    const flippedCard = flipRandomHiddenCard(currentPlayer);
    if (flippedCard) {
      currentPlayer.first_hrade_cards -= 1;
      
      // Notify the specific player about their first grade card update
      currentSocket.emit('first-hrade-updated', { 
        first_hrade_cards: currentPlayer.first_hrade_cards,
      });
      
      // Notify all other players about first grade cards status
      room.players_Socket.forEach((playerSocket: any, socketId: string) => {
        if (socketId !== playerId) {
          playerSocket.emit('all-first-hrade-updated', {
            all_first_hrade_cards: room.playersWithCards.every((pwc: playerWithCards) => pwc.first_hrade_cards <= 0),
          });
        }
      });
      
      console.log(`⏰ Auto-flipped card at (${flippedCard.col}, ${flippedCard.row}) for ${currentPlayer.name}`);
    }
  } else if (room.playersWithCards.every((pwc: playerWithCards) => pwc.first_hrade_cards <= 0)) {
    // All players finished first grade cards - do normal auto-play
    console.log(`⏰ Auto-playing normal turn for ${currentPlayer.name}`);
    
    // Auto-select the card in table (safer choice than random card)
    room.card_in_table_selected = true;
    
    // Find a random hidden card to replace
    const flippedCard = flipRandomHiddenCard(currentPlayer);
    if (flippedCard) {
      const { col, row } = flippedCard;
      
      // Swap values with card in table
      let temp = currentPlayer.cards[col][row].value;
      currentPlayer.cards[col][row].value = room.card_in_table.value;
      room.card_in_table.value = temp;
      room.card_in_table_selected = false;
      
      console.log(`⏰ Auto-swapped card at (${col}, ${row}) with table card for ${currentPlayer.name}`);
    }
  }
  
  // Check for last turn
  if (!room.last_tourn) {
    room.last_tourn = checkLastTurn(currentPlayer);
  }
  
  if (room.last_tourn) {
    console.log("⚠️ Last turn triggered by auto-play");
    currentPlayer.last_turn = true;
    currentPlayer.cards = setAllCardsVisible(currentPlayer.cards);
  }
  
  // Process card removals and turn management
  remove_fun(room, currentPlayer);
  
  // Notify all players about the auto-play action
  room.players_Socket.forEach((playerSocket: any) => {
    playerSocket.emit('player-auto-played', {
      playerName: currentPlayer.name,
      message: `${currentPlayer.name} was inactive and played automatically`
    });
  });
}


export function createSafeRoomData(room: any) {
  return {
    roomId: room.roomId,
    room_name: room.room_name,
    ownirName: room.ownirName,
    max_players: room.max_players,
    status: room.status,
    players: room.players,
    avatars: room.avatars,
    card_in_table: room.card_in_table,
    random_card_in_table: room.random_card_in_table,
    card_in_table_selected: room.card_in_table_selected,
    random_card_in_table_selected: room.random_card_in_table_selected,
    last_tourn: room.last_tourn,
    name_of_turn: room.name_of_turn,
    gameSettings: room.gameSettings,
    // Don't include players_Socket or other circular references
  };
}