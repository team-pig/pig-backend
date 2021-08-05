const express = require('express');
require('express-async-errors');
const app = express();
const port = 3000;
const dotenv = require('dotenv');
dotenv.config();

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
app.listen(port, () => {
    console.log(`listening at http://localhost:${port}`);
})
