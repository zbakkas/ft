"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopGameLoop = exports.resetBall = void 0;
const types_1 = require("./types");
const resetBall = (gameState) => {
    gameState.ballX = types_1.CANVAS_WIDTH / 2;
    gameState.ballY = types_1.CANVAS_HEIGHT / 2;
    gameState.ballVelocityX = (Math.random() > 0.5 ? 1 : -1) * types_1.BALL_SPEED;
    gameState.ballVelocityY = (Math.random() > 0.5 ? 1 : -1) * types_1.BALL_SPEED;
};
exports.resetBall = resetBall;
// Stop game loop for a room
const stopGameLoop = (room) => {
    if (room.gameLoop) {
        clearInterval(room.gameLoop);
        room.gameLoop = undefined;
    }
};
exports.stopGameLoop = stopGameLoop;
//# sourceMappingURL=gameLogic.js.map