const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

const createRoom = (roomName) => {
  rooms[roomName] = {
    turn: "A",
    A: null,
    B: null,
    grid: [
      ["B-P1", "B-H1", "B-P2", "B-H2", "B-P3"],
      ["x", "x", "x", "x", "x"],
      ["x", "x", "x", "x", "x"],
      ["x", "x", "x", "x", "x"],
      ["A-P1", "A-H1", "A-P2", "A-H2", "A-P3"],
    ],
  };
};

io.on("connection", (socket) => {
  socket.on("join-room", async (roomName) => {
    if (!rooms[roomName]) {
      //create room and add user
      socket.join(roomName);
      console.log(socket.id, " joined ", roomName);
      createRoom(roomName);
      rooms[roomName].A = socket.id;
      socket.emit("join-room-res", "ok");
    } else {
      socket.join(roomName);
      if (rooms[roomName].A == null || rooms[roomName].B == null) {
        if (rooms[roomName].A == null) {
          rooms[roomName].A = socket.id;
          socket.emit("join-room-res", "ok");
        } else {
          rooms[roomName].B = socket.id;
          socket.emit("join-room-res", "ok");
        }
      } else {
        //respond with room full error
        socket.emit("join-room-res", "ok");
      }
    }
  });

  socket.on("get-grid", (roomName) => {
    if (rooms[roomName]) {
      console.log(socket.id);
      console.log(rooms[roomName].A, " and ", rooms[roomName].B);
      if (rooms[roomName].A == socket.id)
        socket.emit(
          "get-grid-res",
          rooms[roomName].grid,
          "A",
          rooms[roomName].turn
        );
      else if (rooms[roomName].B == socket.id)
        socket.emit(
          "get-grid-res",
          rooms[roomName].grid,
          "B",
          rooms[roomName].turn
        );
      else socket.emit("get-grid-res", rooms[roomName].grid, "V", "");
    }
  });

  socket.on("newMove", (move, roomName) => {
    if (rooms[roomName] && socket.id === rooms[roomName].A) {
      console.log("A moved : ", move);
      if (executeMove(move, "A", roomName)) {
        rooms[roomName].turn = "B";
        io.to(roomName).emit("move-update", "A", move, rooms[roomName].turn);
      }
    }
    if (rooms[roomName] && socket.id === rooms[roomName].B) {
      console.log("B moved : ", move);
      if (executeMove(move, "B", roomName)) {
        rooms[roomName].turn = "A";
        io.to(roomName).emit("move-update", "B", move, rooms[roomName].turn);
      }
    }
  });

  socket.on("disconnect", () => {
    for (const roomName in rooms) {
      if (rooms[roomName].A === socket.id) {
        rooms[roomName].A = null;
        console.log(
          `User ${socket.id} disconnected from room ${roomName} as A`
        );
      } else if (rooms[roomName].B === socket.id) {
        rooms[roomName].B = null;
        console.log(
          `User ${socket.id} disconnected from room ${roomName} as B`
        );
      }

      // if (!rooms[roomName].A && !rooms[roomName].B) {
      //   delete rooms[roomName];
      //   console.log(`Room ${roomName} deleted as both users disconnected`);
      // }
    }
  });
});

const executeMove = (move, id, roomName) => {
  const room = rooms[roomName];
  if (!room) return false;

  let [characterName, direction] = move.split(":");
  let targetCharacter = `${id}-${characterName}`;
  targetCharacter = targetCharacter.toUpperCase();
  direction = direction.toLowerCase();

  let x, y;

  // Find the character's current position in the grid
  for (let i = 0; i < room.grid.length; i++) {
    for (let j = 0; j < room.grid[i].length; j++) {
      if (room.grid[i][j] === targetCharacter) {
        x = i;
        y = j;
        break;
      }
    }
  }

  // If the character is not found, return false
  if (x === undefined || y === undefined) return false;

  let newX = x;
  let newY = y;

  // Adjust the move logic based on the direction and character
  switch (direction) {
    case "l":
      newY -= 1;
      break;
    case "r":
      newY += 1;
      break;
    case "f":
      newX -= 1;
      break;
    case "b":
      newX += 1;
      break;
    case "fl":
      newX -= 2;
      newY -= 2;
      break;
    case "fr":
      newX -= 2;
      newY += 2;
      break;
    case "bl":
      newX += 2;
      newY -= 2;
      break;
    case "br":
      newX += 2;
      newY += 2;
      break;
    default:
      return false;
  }

  // Additional movement logic for "h1" character
  if (characterName.toLowerCase() === "h1") {
    switch (direction) {
      case "l":
        newY -= 1;
        break;
      case "r":
        newY += 1;
        break;
      case "f":
        newX -= 1;
        break;
      case "b":
        newX += 1;
        break;
      default:
        return false;
    }
  }

  // Ensure the new position is within the grid boundaries
  if (newX >= 0 && newX < 5 && newY >= 0 && newY < 5) {
    // Move the character to the new position if it's a valid move
    room.grid[x][y] = "x";

    while (x !== newX || y !== newY) {
      if (x < newX) x++;
      else if (x > newX) x--;
      if (y > newY) y--;
      else if (y < newY) y++;
      // if(room.grid[x][y]!=="")
      room.grid[x][y] = "x";
    }

    room.grid[newX][newY] = targetCharacter;
    return true;
  }

  return false; // Invalid move if out of grid bounds
};

server.listen(3001, () => {
  console.log("SERVER RUNNING");
});
