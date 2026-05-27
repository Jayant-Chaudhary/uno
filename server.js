require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const cors = require("cors");
require("./server/config/passport");
const authRoutes = require("./server/routes/authroutes");

const gameRoutes = require("./server/routes/roomRoutes");
const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_API,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: process.env.CLIENT_API,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/rooms", gameRoutes);
app.get("/", (req, res) => {
  res.json({
    status: "Server running",
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
