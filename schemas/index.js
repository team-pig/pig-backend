const mongoose = require("mongoose");

const connect = () => {
  mongoose
    .connect("mongodb://localhost:27017/team-pig", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      ignoreUndefined: true,
    })
    .catch(err => console.log('mongoose catch ERROR', err));
};

mongoose.connection.on("error", err => {
  console.error("몽고디비 연결 에러", err);
});

connect()

module.exports = connect;