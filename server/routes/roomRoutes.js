const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");
const authmiddleware = require("../middleware/authmiddleware");
const softAuth = require("../middleware/softauthmiddleware");
const roomManager = require("../roomManger");

router.post("/create", authmiddleware, roomController.createRoom);
router.post("/join", softAuth, roomController.joinRoom);
router.get("/:roomCode", roomController.getRoomCode);
router.delete("/:roomCode/leave", softAuth, roomController.leavePlayer);
module.exports = router;
