const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL, "https://192.168.1.82"], // Allow frontend connection
    methods: ["GET", "POST"],
  },
});

const logFilePath = path.join(__dirname, 'experiment_log.txt');

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

app.get("/logs", (req, res) => {
  fs.readFile(logFilePath, 'utf-8', (error, data) => {
    if (error) {
      return res.status(500).send("Could not read log file.");
    }

    res.send(`<pre>${data}</pre>`)
  })
})

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

  socket.on("completed_experiment", (data) => {


    // const readableTime = new Date(data);

    // let time = `${readableTime.getUTCMinutes()}:${readableTime.getUTCSeconds()}.${readableTime.getUTCMilliseconds()}`
    // let time = utcString.slice(-11, -4);
    const logData = {
      'Timestamp': new Date().toISOString(),
      'SocketID': socket.id,
      ...data
    };

    const logEntry = Object.entries(logData).map(
      ([key, value]) => `${key}: ${value}`
    ).join(' | ');
    // const logEntry = `${new Date().toISOString()} | SocketID: ${socket.id} | Experiment: ${experimentId} | Time Taken: ${time}\r\n`;

    fs.appendFile(logFilePath, logEntry + '\r\n', (error) => {
      if (error) {
        console.log("Error writing to file:", error);
      } else {
        console.log("Log written:", logEntry.trim());
      }
    })
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, async () => {
  console.log("Server running on http://localhost:5000");
  });
