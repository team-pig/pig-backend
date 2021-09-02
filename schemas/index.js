const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connect = () => {
  mongoose
    .connect(`mongodb://${process.env.MONGODB_ID_PASSWORD}@:27017/admin`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      ignoreUndefined: true,
    })
    .catch((err) => console.log('mongoose catch ERROR', err))
};

mongoose.connection.on('error', (err) => {
  console.error('몽고디비 연결 에러', err)
});

module.exports = connect;
