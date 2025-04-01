const mongoose = require("mongoose");

const historyItemSchema = new mongoose.Schema({
 
  product_name: {
    type: String,
    required: true,  
  },
  URL: {
    type: String,
    required: true,  
  },
  image_url: {
    type: String,
    required: true,  
  },
});

const historySchema = new mongoose.Schema({

  username: {
    type: String,
    required: true,
  },
  history: [historyItemSchema],  
});

module.exports = mongoose.model("History", historySchema);
