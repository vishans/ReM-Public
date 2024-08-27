const mongoose = require('mongoose');

const applianceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nickname: {
    type: String,
    validate: {
      validator: function (value) {
        // Validator function returns true if the value is not an empty string
        return value !== '';
      },
      message: 'Nickname cannot be an empty string',
    },
  },
  owner: { type: String },
  lastSeen: { type: Number },
  apiKey: { type: String },
});

const Appliance = mongoose.model('Appliance', applianceSchema);
module.exports = Appliance;
