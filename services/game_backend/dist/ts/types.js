"use strict";
// types.ts - Shared types and constants
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitedPlayersTournament = exports.invitedPlayers = exports.waitingPlayers3d = exports.waitingPlayers2vs2 = exports.waitingPlayers = exports.gameRooms = exports.BALL_PHYSICS = exports.PADDLE_SPEED = exports.COUNTDOWN_TIME = exports.c_WIN = exports.BALL_SPEED = exports.BALL_SIZE = exports.PADDLE_HEIGHT = exports.PADDLE_WIDTH = exports.CANVAS_HEIGHT = exports.CANVAS_WIDTH = void 0;
// Game constants
exports.CANVAS_WIDTH = 800;
exports.CANVAS_HEIGHT = 400;
exports.PADDLE_WIDTH = 10;
exports.PADDLE_HEIGHT = 80;
exports.BALL_SIZE = 16;
exports.BALL_SPEED = 8;
exports.c_WIN = 7;
exports.COUNTDOWN_TIME = 5;
exports.PADDLE_SPEED = 7;
// Add ball physics constants
exports.BALL_PHYSICS = {
    gravity: -0.018,
    ballRadius: 2,
    tableY: 53,
    tableMinX: -60,
    tableMaxX: 60,
    tableMinZ: -58,
    tableMaxZ: 1,
    bounceDamping: 0.65,
    initialVelocity: { x: 1.2, y: 0.25, z: 0.4 }
};
// Global state - you can import and use these anywhere
exports.gameRooms = new Map();
exports.waitingPlayers = [];
exports.waitingPlayers2vs2 = [];
exports.waitingPlayers3d = [];
// List to hold invited players for private games : two players in the smae room
exports.invitedPlayers = [];
// List to hold invited players for tournament games
exports.invitedPlayersTournament = [];
//# sourceMappingURL=types.js.map