const mongoose = require('mongoose');


const weatherSchema = new mongoose.Schema({
    city: {
      type: String,
      require: true
    },
    temperature: {
      type: Number,
      require: true
    },
  });
  
  const Weather = mongoose.model('Weather', weatherSchema);
  
  module.exports = Weather;