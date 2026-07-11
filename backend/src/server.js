require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const logger = require('./utils/logger');
const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
  }
});

global.io = io;

io.on('connection', (socket) => {
  logger.info(`Socket client connected: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
    logger.info(`Socket ${socket.id} joined room ${room}`);
  });

  socket.on('leave_room', (room) => {
    socket.leave(room);
    logger.info(`Socket ${socket.id} left room ${room}`);
  });

  socket.on('edit_script', (data) => {
    // Broadcast live typing edits to other devices/users in the room
    socket.to(data.userId).emit('script_updated', data);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

