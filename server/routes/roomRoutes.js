const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");
const authmiddleware = require("../middleware/authmiddleware");
const softAuth = require("../middleware/softauthmiddleware");
const roomManager = require("../roomManger");
const requireIdentity = require("../utils/requireIdentity");

router.get("/:roomCode/game-state", softAuth,requireIdentity, roomController.getGameState);
router.post("/create", authmiddleware, roomController.createRoom);
router.post("/join", softAuth, roomController.joinRoom);
router.get("/:roomCode", roomController.getRoomCode);
router.delete("/:roomCode/leave", softAuth, roomController.leavePlayer);
router.patch("/:roomCode/profile", softAuth, roomController.updateRoomPlayerProfile);
module.exports = router;
