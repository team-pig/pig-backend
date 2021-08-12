const http = require('http');
const express = require('express');
require('express-async-errors');
const socketio = require('socket.io');
const cors = require('cors');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const port = 3000;
const dotenv = require('dotenv');
dotenv.config();

app.use(
  cors({ origin: '*', credentials: true, }
  ));
/* https할 때 필요
const fs = require('fs')
const http = require('http')
const https = require('https')

const options = {
  ca: fs.readFileSync('/etc/letsencrypt/live/itda.shop/fullchain.pem'),
  key: fs.readFileSync('/etc/letsencrypt/live/itda.shop/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/itda.shop/cert.pem')
 }
*/

/*이미지 업로드
const path = require("path");
const multer = require("multer");
const fileStorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./images"); 
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "--" + file.originalname);
    },
  });
  const upload = multer({ storage: fileStorageEngine });
  app.use('/image', express.static('images'))
*/
//CORS

// 몽고db 붕어빵 틀
const connect = require('./schemas/index');
connect()

// 바디,json,media 데이터
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));

// 라우터
const roomsRouters = require('./routers/rooms.js');
const userRouters = require("./routers/user.js");
const documentRouters = require("./routers/document");
const todoRouters = require('./routers/todo');

app.use(userRouters, documentRouters, roomsRouters, todoRouters);


// error handling
app.use((error, req, res, next) => {
    console.error(error);
    res.sendStatus(500);
});

app.use((req, res, next) => {
    console.log(req);
    next();
});

// 템플릿 엔진
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// 각종 url
app.get('/', (req, res) => {
    res.render('index.ejs');
})
app.get('/document', (req, res) => {
    res.render('document.ejs');
})

io.on('connect', (socket) => {
  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if(error) return callback(error);

    socket.join(user.room);

    socket.emit('message', { user: 'admin', text: `${user.name}, welcome to room ${user.room}.`});
    socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });

    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit('message', { user: user.name, text: message });

    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if(user) {
      io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
    }
  })
});

/*이미지 업로드 
app.post('/single', upload.single('image'), (req, res) => {
  console.log(req.file)
  res.send('Single FIle upload success')
})

app.post('/multiple', upload.array('images', 3), (req, res) => {
  console.log(req.files)
  res.send('Multiple Files Upload Success')
})
*/
// app.listen(port, () => {
//     console.log(`listening at http://localhost:${port}`);
// })

server.listen(process.env.PORT || 5000, () => console.log(`Server has started.`));
/* https할 때 필요
http.createServer(app).listen(3000)
https.createServer(options, app).listen(443)
*/

