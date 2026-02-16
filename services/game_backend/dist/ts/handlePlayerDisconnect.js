"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePlayerDisconnect = void 0;
const server_1 = require("../server");
const gameLogic_1 = require("./gameLogic");
const types_1 = require("./types");
const handlePlayerDisconnect = (playerId) => {
    console.log(`Player ${playerId} disconnecting...`);
    // Remove from waiting list if present
    const waitingIndex = types_1.waitingPlayers.findIndex(p => p.playerId === playerId);
    if (waitingIndex !== -1) {
        types_1.waitingPlayers.splice(waitingIndex, 1);
        console.log(`Removed ${playerId} from waiting list. Waiting players: ${types_1.waitingPlayers.length}`);
        return;
    }
    const waitingIndex3d = types_1.waitingPlayers3d.findIndex(p => p.playerId === playerId);
    if (waitingIndex3d !== -1) {
        types_1.waitingPlayers3d.splice(waitingIndex3d, 1);
        console.log(`Removed ${playerId} from 3D waiting list. Waiting players: ${types_1.waitingPlayers3d.length}`);
        return;
    }
    const waitingIndex2vs2 = types_1.waitingPlayers2vs2.findIndex(p => p.playerId === playerId);
    if (waitingIndex2vs2 !== -1) {
        types_1.waitingPlayers2vs2.splice(waitingIndex2vs2, 1);
        console.log(`Removed ${playerId} from 2vs2 waiting list. Waiting players: ${types_1.waitingPlayers2vs2.length}`);
        return;
    }
    // Remove from active game
    const room = findRoomByPlayerId(playerId);
    if (!room)
        return;
    room.players.delete(playerId);
    room.gameState.players.delete(playerId);
    //if game is not over 
    if (!room.gameState.gameOver) {
        // Stop game if a player disconnects
        room.gameState.gameRunning = false;
        room.gameState.gameOver = true;
        (0, gameLogic_1.stopGameLoop)(room);
        (0, server_1.stopGameLoop_3D)(room);
        // Notify remaining player and add them back to waiting list
        room.players.forEach(player => {
            player.socket.send(JSON.stringify({
                type: 'opponentDisconnected',
                message: 'Your opponent disconnected. you are the winner!',
            }));
            // Add remaining player back to waiting list
            // waitingPlayers.push({ playerId: player.id, socket: player.socket });
            // player.socket.send(JSON.stringify({
            //   type: 'waitingForOpponent',
            //   message: 'Waiting for a new opponent...',
            //   waitingPlayers: waitingPlayers.length
            // }));
        });
    }
    // Remove empty rooms
    if (room.players.size === 0) {
        types_1.gameRooms.delete(room.id);
    }
    console.log(`Player ${playerId} disconnected. Active games: ${types_1.gameRooms.size}, Waiting: ${types_1.waitingPlayers.length}`);
};
exports.handlePlayerDisconnect = handlePlayerDisconnect;
const findRoomByPlayerId = (playerId) => {
    for (const room of types_1.gameRooms.values()) {
        if (room.players.has(playerId)) {
            return room;
        }
    }
    return undefined;
};
//# sourceMappingURL=handlePlayerDisconnect.js.map