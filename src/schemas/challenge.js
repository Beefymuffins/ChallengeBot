const { Schema, model, mongoose } = require('mongoose');
const challengeSchema = new Schema({
  _id: Schema.Types.ObjectId,
  gameId: String,
  startBalance: Number,
  endBalance: Number,
  host: String,
  duration: { type: Date, required: false },
  players: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});

module.exports = model('Challenge', challengeSchema, 'challenges');
