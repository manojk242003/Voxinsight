const mongoose = require("mongoose");

const passwordSchema = new mongoose.Schema({

  username: {
    type: String,
    required: true,  
  },
  password: {
    type: String,
    required: true,
  },  
});


const Passwords = mongoose.model("user", passwordSchema);

module.exports = Passwords;