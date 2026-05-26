const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");
const authmiddleware = require("../middleware/authmiddleware");

router.post("/create", authmiddleware, roomController.createRoom);
router.post("/join", authmiddleware, roomController.joinRoom);
router.get("/:roomCode", roomController.getRoomCode);
router.delete("/:roomCode/leave", authmiddleware, roomController.leavePlayer);

module.exports = router;
