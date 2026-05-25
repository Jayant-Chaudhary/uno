require("dotenv").config();

const express = require("express");

const cookieParser = require("cookie-parser");

const passport = require("passport");
const cors = require("cors");
require("./server/config/passport");

const authRoutes = require("./server/routes/authroutes");

//const gameRoutes = require("./routes/gameRoutes");

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/auth", authRoutes);

//app.use("/game", gameRoutes);
app.get("/", (req, res) => {
  res.json({
    status: "Server running",
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
