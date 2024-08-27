const mongoose = require('mongoose');

const buttonSchema = new mongoose.Schema({
  applianceId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  remoteIndex: { type: Number, required: true, index: true },
  protocol: {
    type: Number,
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  bits: {
    type: Number,
    required: true,
  },
});

const Button = mongoose.model('Button', buttonSchema);
module.exports = Button;
