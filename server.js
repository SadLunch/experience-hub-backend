const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL, // Allow frontend connection
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Store experiment participant counts
let numberOfUsers = {
  "whac-a-mole": 0,
  "gremio-lit": 0,
  "graffiti-1": 0,
  "graffiti-2": 0,
  "justica-monstro": 0,
  "selfie": 0,
}

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Send current experiment data to the new user
  socket.emit("update_participants", numberOfUsers);

  socket.on("join_experiment", (experimentId) => {
    if (numberOfUsers[experimentId] !== undefined) {
      numberOfUsers[experimentId] += 1;
      io.emit("update_participants", numberOfUsers);
    }
  });

  socket.on("leave_experiment", (experimentId) => {
    if (numberOfUsers[experimentId]) {
      numberOfUsers[experimentId] = Math.max(
        0,
        numberOfUsers[experimentId] - 1
      );
      io.emit("update_participants", numberOfUsers);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, async () => {
  console.log("Server running on http://localhost:5000");
  });
