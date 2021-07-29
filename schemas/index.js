const mongoose = require("mongoose");
const Room = require("./room.js")


// const mongoClient = require('mongodb').MongoClient;

// mongoClient.connect('mongodb://test:test@localhost:27017/team-pig', (err, database) => {
//   console.log(err);
// });


const connect = () => {
  mongoose
    .connect("mongodb://localhost:27017/team-pig", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      ignoreUndefined: true,
      "user":"test",
      "pass":"test"
    })
    .catch(err => console.log('mongoose catch ERROR', err));
};

mongoose.connection.on("error", err => {
  console.error("몽고디비 연결 에러", err);
});

connect()

module.exports = connect;