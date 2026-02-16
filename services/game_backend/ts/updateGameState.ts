import { resetBall, stopGameLoop } from './gameLogic';
import {
  GameRoom,
  GameState,
  Player,
  gameRooms,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  BALL_SIZE,
  BALL_SPEED,
  c_WIN,
  PADDLE_SPEED,
  waitingPlayers,
  COUNTDOWN_TIME
} from './types';
import { saveGameResult } from './database';
import { FastifyInstance } from 'fastify';
import rabbit from './rabbit';


// Update game physics
export const updateGameState = (room: GameRoom ,fastify :FastifyInstance) => {
  const { gameState } = room;

  if (!gameState.gameRunning) return;

  // Update ball position
  gameState.ballX += gameState.ballVelocityX;
  gameState.ballY += gameState.ballVelocityY;

  // Ball collision with top and bottom walls
  if (gameState.ballY <= 0 || gameState.ballY >= CANVAS_HEIGHT - BALL_SIZE) {
    gameState.ballVelocityY = -gameState.ballVelocityY;
  }

  const players = Array.from(gameState.players.values());
  const player1 = players.find(p => p.playerIndex === 0);
  const player2 = players.find(p => p.playerIndex === 1);

  if (player1 && player2) {
    // Ball collision with player 1 paddle (left side)
    if (
      gameState.ballX <= PADDLE_WIDTH &&
      gameState.ballY >= player1.paddleY &&
      gameState.ballY <= player1.paddleY + PADDLE_HEIGHT
    ) {
      gameState.ballVelocityX = Math.abs(gameState.ballVelocityX);
      const hitPos = (gameState.ballY - player1.paddleY) / PADDLE_HEIGHT;
      gameState.ballVelocityY = (hitPos - 0.5) * BALL_SPEED * 2;
    }

    // Ball collision with player 2 paddle (right side)
    if (
      gameState.ballX >= CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE &&
      gameState.ballY >= player2.paddleY &&
      gameState.ballY <= player2.paddleY + PADDLE_HEIGHT
    ) {
      gameState.ballVelocityX = -Math.abs(gameState.ballVelocityX);
      const hitPos = (gameState.ballY - player2.paddleY) / PADDLE_HEIGHT;
      gameState.ballVelocityY = (hitPos - 0.5) * BALL_SPEED * 2;
    }

    // Ball goes off left side (player 2 scores)
    if (gameState.ballX < 0) {
      player2.score++;
      resetBall(gameState);
    }

    // Ball goes off right side (player 1 scores)
    if (gameState.ballX > CANVAS_WIDTH) {
      player1.score++;
      resetBall(gameState);
    }

    // End game if any player reaches score of 5
    if (player1.score >= c_WIN || player2.score >= c_WIN) {
      gameState.gameRunning = false;
      gameState.gameOver = true;
      stopGameLoop(room);

      // Determine winner
      const winnerId = player1.score >= c_WIN ? player1.id : player2.id;

      if (room.tournamentId) {
        fastify.rabbit.channel.publish('user.events', 'game.result', Buffer.from(JSON.stringify({
          winnerId: winnerId,
          gameMatchId: room.id,
          tournamentId: room.tournamentId
        })));
        console.log(`Published game result to RabbitMQ for tournament ${room.tournamentId} with winner ${winnerId} and match ID ${room.id}`);
      }

      // Save game result to database
      saveGameResult({
        gameId: gameState.gameId,
        player1Id: player1.id,
        player1Score: player1.score,
        player2Id: player2.id,
        player2Score: player2.score,
        winnerId: winnerId,
        gameMode: '1v1',
        duration: Date.now() - (room.startTime || Date.now())
      });

      room.players.forEach(player => {
        player.socket.send(JSON.stringify({
          type: 'gameOver',
          message: `Game over! You are ${player.score >= c_WIN ? 'the winner!' : 'the loser.'}`,
        }));
      });
      return;
    }


  }
};

// Broadcast game state to each player with their perspective

export const broadcastGameState = (room: GameRoom) => {
  room.gameState.players.forEach(player => {
    try {
      // For player 2 (playerIndex 1), just reverse the ball's X position
      const ballX = player.playerIndex === 1
        ? CANVAS_WIDTH - room.gameState.ballX
        : room.gameState.ballX;

      const gameData = {
        type: 'gameState',
        gameState: {
          ballX: ballX,
          ballY: room.gameState.ballY, // Keep Y the same
          gameRunning: room.gameState.gameRunning,
          players: Array.from(room.gameState.players.values()).map(p => ({
            id: p.id,
            paddleY: p.paddleY,
            score: p.score,
            playerIndex: p.playerIndex
          }))
        },
        yourPlayerIndex: player.playerIndex
      };

      player.socket.send(JSON.stringify(gameData));
    } catch (error) {
      console.error('Error sending to player:', error);
    }
  });
};



export const updateGameState_2vs2 = (room: GameRoom) => {
  const { gameState } = room;

  if (!gameState.gameRunning) return;

  // Update ball position
  gameState.ballX += gameState.ballVelocityX;
  gameState.ballY += gameState.ballVelocityY;

  // Ball collision with top and bottom walls
  if (gameState.ballY <= 0 || gameState.ballY >= CANVAS_HEIGHT - BALL_SIZE) {
    gameState.ballVelocityY = -gameState.ballVelocityY;
  }

  const players = Array.from(gameState.players.values());
  const player1 = players.find(p => p.playerIndex === 0);
  const player2 = players.find(p => p.playerIndex === 2);
  const player1_1 = players.find(p => p.playerIndex === 1);
  const player2_1 = players.find(p => p.playerIndex === 3);

  if (player1 && player2 && player1_1 && player2_1) {
    // Ball collision with player 1 paddle (left side)
    if (
      gameState.ballX <= PADDLE_WIDTH &&
      gameState.ballY >= player1.paddleY &&
      gameState.ballY <= player1.paddleY + PADDLE_HEIGHT
    ) {
      gameState.ballVelocityX = Math.abs(gameState.ballVelocityX);
      const hitPos = (gameState.ballY - player1.paddleY) / PADDLE_HEIGHT;
      gameState.ballVelocityY = (hitPos - 0.5) * BALL_SPEED * 2;
    }

    // Ball collision with player 2 paddle (right side)
    if (
      gameState.ballX >= CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE &&
      gameState.ballY >= player2.paddleY &&
      gameState.ballY <= player2.paddleY + PADDLE_HEIGHT
    ) {
      gameState.ballVelocityX = -Math.abs(gameState.ballVelocityX);
      const hitPos = (gameState.ballY - player2.paddleY) / PADDLE_HEIGHT;
      gameState.ballVelocityY = (hitPos - 0.5) * BALL_SPEED * 2;
    }

    // Ball goes off left side (player 2 scores)
    if (gameState.ballX < 0) {
      player2.score++;
      player2_1.score++;
      resetBall(gameState);
    }

    // Ball goes off right side (player 1 scores)
    if (gameState.ballX > CANVAS_WIDTH) {
      player1.score++;
      player1_1.score++;
      resetBall(gameState);
    }

    // End game if any player reaches score of 5
    if (player1.score >= c_WIN || player2.score >= c_WIN) {
      gameState.gameRunning = false;
      gameState.gameOver = true;
      stopGameLoop(room);

      // Determine winner for 2v2 (team 1: player1 & player1_1, team 2: player2 & player2_1)
      const team1Players = `${player1.id},${player1_1.id}`;
      const team2Players = `${player2.id},${player2_1.id}`;
      const winnerId = player1.score >= c_WIN ? team1Players : team2Players;

      // Save game result to database
      saveGameResult({
        gameId: gameState.gameId,
        player1Id: team1Players,
        player1Score: player1.score,
        player2Id: team2Players,
        player2Score: player2.score,
        winnerId: winnerId,
        gameMode: '2v2',
        duration: Date.now() - (room.startTime || Date.now())
      });

      room.players.forEach(player => {
        player.socket.send(JSON.stringify({
          type: 'gameOver',
          message: `Game over! You are ${player.score >= c_WIN ? 'the winner!' : 'the loser.'}`,
        }));
      });
      return;
    }


  }
};



export const broadcastGameState_2vs = (room: GameRoom) => {
  room.gameState.players.forEach(player => {
    try {
      // For player 2 (playerIndex 2 and 3), just reverse the ball's X position
      const ballX = player.playerIndex === 3 || player.playerIndex === 2
        ? CANVAS_WIDTH - room.gameState.ballX
        : room.gameState.ballX;

      const gameData = {
        type: 'gameState',
        gameState: {
          ballX: ballX,
          ballY: room.gameState.ballY, // Keep Y the same
          gameRunning: room.gameState.gameRunning,
          players: Array.from(room.gameState.players.values()).map(p => ({
            id: p.id,
            paddleY: p.paddleY,
            score: p.score,
            playerIndex: p.playerIndex
          }))
        },
        yourPlayerIndex: player.playerIndex
      };

      player.socket.send(JSON.stringify(gameData));
    } catch (error) {
      console.error('Error sending to player:', error);
    }
  });
};

