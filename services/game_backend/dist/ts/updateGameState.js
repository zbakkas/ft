"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastGameState_2vs = exports.updateGameState_2vs2 = exports.broadcastGameState = exports.updateGameState = void 0;
const gameLogic_1 = require("./gameLogic");
const types_1 = require("./types");
const database_1 = require("./database");
// Update game physics
const updateGameState = (room, fastify) => {
    const { gameState } = room;
    if (!gameState.gameRunning)
        return;
    // Update ball position
    gameState.ballX += gameState.ballVelocityX;
    gameState.ballY += gameState.ballVelocityY;
    // Ball collision with top and bottom walls
    if (gameState.ballY <= 0 || gameState.ballY >= types_1.CANVAS_HEIGHT - types_1.BALL_SIZE) {
        gameState.ballVelocityY = -gameState.ballVelocityY;
    }
    const players = Array.from(gameState.players.values());
    const player1 = players.find(p => p.playerIndex === 0);
    const player2 = players.find(p => p.playerIndex === 1);
    if (player1 && player2) {
        // Ball collision with player 1 paddle (left side)
        if (gameState.ballX <= types_1.PADDLE_WIDTH &&
            gameState.ballY >= player1.paddleY &&
            gameState.ballY <= player1.paddleY + types_1.PADDLE_HEIGHT) {
            gameState.ballVelocityX = Math.abs(gameState.ballVelocityX);
            const hitPos = (gameState.ballY - player1.paddleY) / types_1.PADDLE_HEIGHT;
            gameState.ballVelocityY = (hitPos - 0.5) * types_1.BALL_SPEED * 2;
        }
        // Ball collision with player 2 paddle (right side)
        if (gameState.ballX >= types_1.CANVAS_WIDTH - types_1.PADDLE_WIDTH - types_1.BALL_SIZE &&
            gameState.ballY >= player2.paddleY &&
            gameState.ballY <= player2.paddleY + types_1.PADDLE_HEIGHT) {
            gameState.ballVelocityX = -Math.abs(gameState.ballVelocityX);
            const hitPos = (gameState.ballY - player2.paddleY) / types_1.PADDLE_HEIGHT;
            gameState.ballVelocityY = (hitPos - 0.5) * types_1.BALL_SPEED * 2;
        }
        // Ball goes off left side (player 2 scores)
        if (gameState.ballX < 0) {
            player2.score++;
            (0, gameLogic_1.resetBall)(gameState);
        }
        // Ball goes off right side (player 1 scores)
        if (gameState.ballX > types_1.CANVAS_WIDTH) {
            player1.score++;
            (0, gameLogic_1.resetBall)(gameState);
        }
        // End game if any player reaches score of 5
        if (player1.score >= types_1.c_WIN || player2.score >= types_1.c_WIN) {
            gameState.gameRunning = false;
            gameState.gameOver = true;
            (0, gameLogic_1.stopGameLoop)(room);
            // Determine winner
            const winnerId = player1.score >= types_1.c_WIN ? player1.id : player2.id;
            if (room.tournamentId) {
                fastify.rabbit.channel.publish('user.events', 'game.result', Buffer.from(JSON.stringify({
                    winnerId: winnerId,
                    gameMatchId: room.id,
                    tournamentId: room.tournamentId
                })));
                console.log(`Published game result to RabbitMQ for tournament ${room.tournamentId} with winner ${winnerId} and match ID ${room.id}`);
            }
            // Save game result to database
            (0, database_1.saveGameResult)({
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
                    message: `Game over! You are ${player.score >= types_1.c_WIN ? 'the winner!' : 'the loser.'}`,
                }));
            });
            return;
        }
    }
};
exports.updateGameState = updateGameState;
// Broadcast game state to each player with their perspective
const broadcastGameState = (room) => {
    room.gameState.players.forEach(player => {
        try {
            // For player 2 (playerIndex 1), just reverse the ball's X position
            const ballX = player.playerIndex === 1
                ? types_1.CANVAS_WIDTH - room.gameState.ballX
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
        }
        catch (error) {
            console.error('Error sending to player:', error);
        }
    });
};
exports.broadcastGameState = broadcastGameState;
const updateGameState_2vs2 = (room) => {
    const { gameState } = room;
    if (!gameState.gameRunning)
        return;
    // Update ball position
    gameState.ballX += gameState.ballVelocityX;
    gameState.ballY += gameState.ballVelocityY;
    // Ball collision with top and bottom walls
    if (gameState.ballY <= 0 || gameState.ballY >= types_1.CANVAS_HEIGHT - types_1.BALL_SIZE) {
        gameState.ballVelocityY = -gameState.ballVelocityY;
    }
    const players = Array.from(gameState.players.values());
    const player1 = players.find(p => p.playerIndex === 0);
    const player2 = players.find(p => p.playerIndex === 2);
    const player1_1 = players.find(p => p.playerIndex === 1);
    const player2_1 = players.find(p => p.playerIndex === 3);
    if (player1 && player2 && player1_1 && player2_1) {
        // Ball collision with player 1 paddle (left side)
        if (gameState.ballX <= types_1.PADDLE_WIDTH &&
            gameState.ballY >= player1.paddleY &&
            gameState.ballY <= player1.paddleY + types_1.PADDLE_HEIGHT) {
            gameState.ballVelocityX = Math.abs(gameState.ballVelocityX);
            const hitPos = (gameState.ballY - player1.paddleY) / types_1.PADDLE_HEIGHT;
            gameState.ballVelocityY = (hitPos - 0.5) * types_1.BALL_SPEED * 2;
        }
        // Ball collision with player 2 paddle (right side)
        if (gameState.ballX >= types_1.CANVAS_WIDTH - types_1.PADDLE_WIDTH - types_1.BALL_SIZE &&
            gameState.ballY >= player2.paddleY &&
            gameState.ballY <= player2.paddleY + types_1.PADDLE_HEIGHT) {
            gameState.ballVelocityX = -Math.abs(gameState.ballVelocityX);
            const hitPos = (gameState.ballY - player2.paddleY) / types_1.PADDLE_HEIGHT;
            gameState.ballVelocityY = (hitPos - 0.5) * types_1.BALL_SPEED * 2;
        }
        // Ball goes off left side (player 2 scores)
        if (gameState.ballX < 0) {
            player2.score++;
            player2_1.score++;
            (0, gameLogic_1.resetBall)(gameState);
        }
        // Ball goes off right side (player 1 scores)
        if (gameState.ballX > types_1.CANVAS_WIDTH) {
            player1.score++;
            player1_1.score++;
            (0, gameLogic_1.resetBall)(gameState);
        }
        // End game if any player reaches score of 5
        if (player1.score >= types_1.c_WIN || player2.score >= types_1.c_WIN) {
            gameState.gameRunning = false;
            gameState.gameOver = true;
            (0, gameLogic_1.stopGameLoop)(room);
            // Determine winner for 2v2 (team 1: player1 & player1_1, team 2: player2 & player2_1)
            const team1Players = `${player1.id},${player1_1.id}`;
            const team2Players = `${player2.id},${player2_1.id}`;
            const winnerId = player1.score >= types_1.c_WIN ? team1Players : team2Players;
            // Save game result to database
            (0, database_1.saveGameResult)({
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
                    message: `Game over! You are ${player.score >= types_1.c_WIN ? 'the winner!' : 'the loser.'}`,
                }));
            });
            return;
        }
    }
};
exports.updateGameState_2vs2 = updateGameState_2vs2;
const broadcastGameState_2vs = (room) => {
    room.gameState.players.forEach(player => {
        try {
            // For player 2 (playerIndex 2 and 3), just reverse the ball's X position
            const ballX = player.playerIndex === 3 || player.playerIndex === 2
                ? types_1.CANVAS_WIDTH - room.gameState.ballX
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
        }
        catch (error) {
            console.error('Error sending to player:', error);
        }
    });
};
exports.broadcastGameState_2vs = broadcastGameState_2vs;
//# sourceMappingURL=updateGameState.js.map