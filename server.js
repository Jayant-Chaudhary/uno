require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const cors = require("cors");
require("./server/config/passport");
const authRoutes = require("./server/routes/authroutes");
const { registerGameEvents } = require("./server/gameSockets/gameEvent");

const gameRoutes = require("./server/routes/roomRoutes");
const app = express();

const server = http.createServer(app);
console.log("server running");
console.log("CLIENT_API =", process.env.CLIENT_API);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      console.log("Incoming origin:", origin);
      callback(null, origin);
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: (origin, callback) => {
      console.log("Incoming origin:", origin);
      callback(null, origin);
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.set("io", io);
app.use("/api/auth", authRoutes);
app.use("/api/rooms", gameRoutes);
app.get("/", (req, res) => {
  res.json({
    status: "Server running",
  });
});
registerGameEvents(io);

server.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});
