const express = require("express")
const router = express.Router()
const Passwords = require("../models/passwords.js")
const History = require("../models/history.js")
const bcrypt = require("bcryptjs")


//get
router.get("/users", async(req, res)=> {
   try{
    const Pass = await Passwords.find()
    res.json(Pass)
   }
   catch(err){
    console.send(err)
   }

})

router.get("/users/:id", async (req, res) => {
   try {
       const { id } = req.params;

       const user = await Passwords.findById(id);
       
       if (!user) {
           return res.status(404).json({ message: "User not found" });
       }

       res.status(200).json(user);
   } catch (err) {
       console.error("Error finding user:", err);
       res.status(500).json({ message: "Error finding user", error: err.message || err });
   }
});

//Post
router.post("/users", async (req, res) => {
   try {
       const {username, password} = req.body;

       if (!username || !password) {
           return res.status(400).json({ message: "Username and password required" });
       }

       const user1 = Passwords.find(username);
       if(user1)
       {
         return;
       }

       const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));

       const newUser = new Passwords({ username, "password": hashedPassword });
       await newUser.save();

       const newHistory = new History({ username, history: [] });
       await newHistory.save();

       res.status(201).json({ newUser });
   } catch (err) {
       console.error("Error creating user:", err);
       res.status(500).json({ message: "Error creating user", error: err.message || err });
   }
});

//patch
router.patch("/users/:id", async (req, res) => {
   try {
       const { id } = req.params;
       const { username, password } = req.body;

       let user = await Passwords.findById(id);
       if (!user) {
           return res.status(404).json({ message: "User not found" });
       }

       const oldUsername = user.username;

       if (username) {
           user.username = username;

           await History.findOneAndUpdate({ username: oldUsername }, { username }, {new: true});
       }

       if (password) {
           const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
           user.password = await bcrypt.hash(password, saltRounds);
       }

       await user.save();
       res.status(200).json({ message: "User updated successfully", user });
       
   } catch (err) {
       console.error("Error updating user:", err);
       res.status(500).json({ message: "Error updating user", error: err.message || err });
   }
});

//delete
router.delete("/users/:id", async (req, res) => {
   try {
       const { id } = req.params;

       const user = await Passwords.findById(id);
       if (!user) {
           return res.status(404).json({ message: "User not found" });
       }

       await Passwords.findByIdAndDelete(id);

       await History.findOneAndDelete({ username: user.username });

       res.status(200).json({ message: "User and history deleted successfully" });

   } catch (err) {
       console.error("Error deleting user:", err);
       res.status(500).json({ message: "Error deleting user", error: err.message || err });
   }
});


module.exports = router