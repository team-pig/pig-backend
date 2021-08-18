const express = require('express');
require('express-async-errors');
const app = express();
const port = 3000;
const dotenv = require('dotenv');
dotenv.config();


/* https할 때 필요
const fs = require('fs')
// const http = require('http').createServer(app);
// const https = require('https')
// const { Server } = require('socket.io');
// const io = new Server(http);
*/
const http = require('http');
const socketio = require('socket.io');
const server = http.createServer(app); 
const io = socketio(server);


// 몽고db 붕어빵 틀
const connect = require('./schemas/index');
const Message = require('./schemas/message');
connect()

io.on('connection', (socket) => {
  console.log('연결되었어요');

  socket.on('join', async (data) => {

    console.log(data)
    // 받은 roomId의 socket room에 들어간다.
    socket.join(data.roomId);
    // 다른 사람들한테 내가 접속했다고 알림.
    socket.to(data.roomId).emit('message', { user:'admin', text:`${data.userName}님이 접속했습니다.`})

    const chatData = await Message.find({ roomId: data.roomId })
    socket.emit('messages', chatData)

    socket.emit('message', { user:'admin', text:`${data.roomId}에 접속했습니다.`})

  })

  socket.on('sendMessage', async (data) => {
     //DB에 메시지 저장
     console.log(data);
    await Message.create(data)
    //같은 방에 있는 사람한테 
    io.to(data.roomId).emit('message',data )
  })

  socket.on('disconnect', (data) => {
    socket.leave(data.roomId)
    io.to(data.roomId).emit('message', { user:'admin', text:`${data.userName}님이 방에서 나갔습니다.`})
    
    console.log('연결이 해제되었어요.')
  })

});

// const options = {
//   ca: fs.readFileSync('/etc/letsencrypt/live/itda.shop/fullchain.pem'),
//   key: fs.readFileSync('/etc/letsencrypt/live/itda.shop/privkey.pem'),
//   cert: fs.readFileSync('/etc/letsencrypt/live/itda.shop/cert.pem')
//  }

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
const cors = require('cors');
app.use(
    cors({ origin: '*', credentials: true, }
    ));

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
    // console.log(req);
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

server.listen(port, () => {
    console.log(`listening at http://localhost:${port}`);
})

/* https할 때 필요
http.createServer(app).listen(3000)
https.createServer(options, app).listen(443)
*/

module.exports = app;