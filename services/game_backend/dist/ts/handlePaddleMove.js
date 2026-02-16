"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePaddleMove_2vs2 = exports.handlePaddleMove = void 0;
const types_1 = require("./types");
const updateGameState_1 = require("./updateGameState");
const handlePaddleMove = (playerId, direction) => {
    // Find the room containing this player
    let playerRoom;
    let player;
    for (const room of types_1.gameRooms.values()) {
        player = room.players.get(playerId);
        if (player) {
            playerRoom = room;
            break;
        }
    }
    if (!playerRoom || !player)
        return;
    // Update paddle position
    if (direction === 'up' && player.paddleY > 0) {
        player.paddleY = Math.max(0, player.paddleY - types_1.PADDLE_SPEED);
    }
    else if (direction === 'down' && player.paddleY < types_1.CANVAS_HEIGHT - types_1.PADDLE_HEIGHT) {
        player.paddleY = Math.min(types_1.CANVAS_HEIGHT - types_1.PADDLE_HEIGHT, player.paddleY + types_1.PADDLE_SPEED);
    }
    console.log(`Player ${playerId} paddle moved ${direction}. New position: ${player.paddleY} . speed: ${types_1.PADDLE_SPEED} . height: ${types_1.PADDLE_HEIGHT} . canvasHeight: ${types_1.CANVAS_HEIGHT}`);
    // Broadcast updated state
    (0, updateGameState_1.broadcastGameState)(playerRoom);
};
exports.handlePaddleMove = handlePaddleMove;
const handlePaddleMove_2vs2 = (playerId, direction) => {
    // Find the room containing this player
    let playerRoom;
    let player;
    for (const room of types_1.gameRooms.values()) {
        player = room.players.get(playerId);
        if (player) {
            playerRoom = room;
            break;
        }
    }
    if (!playerRoom || !player)
        return;
    // Update paddle position
    if (direction === 'up' && player.paddleY > 0) {
        player.paddleY = Math.max(0, player.paddleY - types_1.PADDLE_SPEED);
        if (player.playerIndex === 0) {
            playerRoom.players.forEach((p) => {
                if (p.playerIndex === 1) {
                    p.paddleY = Math.max(0, p.paddleY - types_1.PADDLE_SPEED);
                    return;
                }
            });
        }
        if (player.playerIndex === 1) {
            playerRoom.players.forEach((p) => {
                if (p.playerIndex === 0) {
                    p.paddleY = Math.max(0, p.paddleY - types_1.PADDLE_SPEED);
                    return;
                }
            });
        }
        if (player.playerIndex === 2) {
            playerRoom.players.forEach((p) => {
                if (p.playerIndex === 3) {
                    p.paddleY = Math.max(0, p.paddleY - types_1.PADDLE_SPEED);
                    return;
                }
            });
        }
        if (player.playerIndex === 3) {
            playerRoom.players.forEach((p) => {
                if (p.playerIndex === 2) {
                    p.paddleY = Math.max(0, p.paddleY - types_1.PADDLE_SPEED);
                    return;
                }
            });
        }
    }
    else if (direction === 'down' && player.paddleY < types_1.CANVAS_HEIGHT - types_1.PADDLE_HEIGHT) {
        player.paddleY = Math.min(types_1.CANVAS_HEIGHT - types_1.PADDLE_HEIGHT, player.paddleY + types_1.PADDLE_SPEED);
        if (player.playerIndex === 0) {
            playerRoom.players.forEach((p) => {
                if (p.playerIndex === 1) {
                    p.paddleY = Math.min(types_1.CANVAS_HEIGHT - types_1.PADDLE_HEIGHT, p.paddleY + types_1.PADDLE_SPEED);
                    return;
                }
            });
        }
        if (player.playerIndex === 1) {
            playerRoom.players.forEach((p) => {
                if (p.playerIndex === 0) {
                    p.paddleY = Math.min(types_1.CANVAS_HEIGHT - types_1.PADDLE_HEIGHT, p.paddleY + types_1.PADDLE_SPEED);
                    return;
                }
            });
        }
        if (player.playerIndex === 2) {
            playerRoom.players.forEach((p) => {
                if (p.playerIndex === 3) {
                    p.paddleY = Math.min(types_1.CANVAS_HEIGHT - types_1.PADDLE_HEIGHT, p.paddleY + types_1.PADDLE_SPEED);
                    return;
                }
            });
        }
        if (player.playerIndex === 3) {
            playerRoom.players.forEach((p) => {
                if (p.playerIndex === 2) {
                    p.paddleY = Math.min(types_1.CANVAS_HEIGHT - types_1.PADDLE_HEIGHT, p.paddleY + types_1.PADDLE_SPEED);
                    return;
                }
            });
        }
    }
    console.log(`Player ${playerId} paddle moved ${direction}. New position: ${player.paddleY} . speed: ${types_1.PADDLE_SPEED} . height: ${types_1.PADDLE_HEIGHT} . canvasHeight: ${types_1.CANVAS_HEIGHT}`);
    // Broadcast updated state
    (0, updateGameState_1.broadcastGameState_2vs)(playerRoom);
};
exports.handlePaddleMove_2vs2 = handlePaddleMove_2vs2;
//# sourceMappingURL=handlePaddleMove.js.map