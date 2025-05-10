const express = require("express");
const mongoose = require("mongoose")
require('dotenv').config();
const Histrouter = require("./routes/history");
const Passwords = require("./routes/passwords")
const app = express()
app.use(express.json());
const cors = require("cors");
app.use(cors());
app.use(express.urlencoded({ extended: true }));

connectDB();
app.listen(process.env.PORT, () => console.log("server listening"));

app.use("/history", Histrouter)
app.use("/password", Passwords);
async function connectDB (){
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("mongo db connected")

        
    } catch (error) {
        console.log(error)
        
    }
}


