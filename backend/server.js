const express = require('express');
const app = express();
const server = require('http').Server(app);
const { v4: uuidv4 } = require('uuid');
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, { debug: true });

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/peerjs', peerServer);

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room });
});

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId, username) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId, username);
    
    socket.on('message', (message, sender) => {
      io.to(roomId).emit('createMessage', { message, sender });
    });

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });
});

server.listen(3001, () => {
  console.log('Server running at http://localhost:3001');
});
