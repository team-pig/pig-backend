const express = require('express');
require('express-async-errors');
const app = express();
const port = 3000;
const dotenv = require('dotenv')
dotenv.config();


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
app.use(userRouters, documentRouters, roomsRouters);


app.use((req, res, next) => {
    res.sendStatus(404);
});

// error handling
app.use((error, req, res, next) => {
    console.error(error);
    res.sendStatus(500);
});


// 각종 url
app.get('/', (req, res) => {
    res.render('index.ejs');
})
app.get('/document', (req, res) => {
    res.render('document.ejs');
})

app.listen(port, () => {
    console.log(`listening at http://localhost:${port}`);
})
