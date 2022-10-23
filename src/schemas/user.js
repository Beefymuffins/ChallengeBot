const { Schema, model } = require('mongoose');
const userSchema = new Schema({
  _id: Schema.Types.ObjectId,
  userId: String,
  userName: String,
  gameId: String,
  currentBalance: Number,
});

module.exports = model('User', userSchema, 'users');
