// api/server.js — Vercel увидит как API endpoint /api/server
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const rooms = {};  // {roomId: {users: [], signals: {}}}

io.on('connection', (socket) => {
    socket.on('join-room', (data) => {
        const { roomId, username } = data;
        if (!rooms[roomId]) rooms[roomId] = { users: [], signals: {} };
        rooms[roomId].users.push({ id: socket.id, username });
        socket.join(roomId);
        io.to(roomId).emit('user-joined', { users: rooms[roomId].users });
        socket.emit('room-ready', { roomId, users: rooms[roomId].users });
    });

    socket.on('signal', (data) => {
        const { roomId, to, signal } = data;
        if (rooms[roomId]) {
            io.to(to).emit('signal', { from: socket.id, signal });
        }
    });

    socket.on('disconnect', () => {
        Object.keys(rooms).forEach(roomId => {
            const idx = rooms[roomId].users.findIndex(u => u.id === socket.id);
            if (idx > -1) rooms[roomId].users.splice(idx, 1);
            io.to(roomId).emit('user-left', { users: rooms[roomId].users });
        });
    });
});

// Vercel: Listen on exports
module.exports = app;
server.listen(process.env.PORT || 3000, () => console.log('Сервер на Vercel'));
