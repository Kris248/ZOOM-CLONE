const express = require('express'); // require karo express ko
const app = express() // app me express ki functionality dalo.
const server = require('http').Server(app); // app ko server me dalo.
const {v4: uuidv4} = require('uuid'); // for uniq ID
const io = require('socket.io')(server);
const {ExpressPeerServer} = require('peer')
const peerServer = ExpressPeerServer(server, {
  debug: true
})



app.set('view engine', 'ejs'); // setting engine
app.use(express.static('public')); // IMP to include public files.
app.use('/peerjs', peerServer);

app.get('/', (req, res) => {
  res.render('home');  // Landing page dikhane ke liye
});


app.get('/:room', (req,res)=>{
  res.render('room', {roomId: req.params.room})
})

//establishing real-time connection
io.on('connection', socket => {
  socket.on('join-room', (roomId, userId)=>{
    socket.join(roomId)
    socket.to(roomId).emit('user-connected', userId)// tellin certain user has connected to everyone

    socket.on('message', message=>{ // recieve msg
      io.to(roomId).emit('createMessage', message) //sending msg to same room
    })
    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId)
    })

  })
})


server.listen(3001, () => {
  console.log('Server running at http://localhost:3001');
});
