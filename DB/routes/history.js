const express = require("express")
const router = express.Router()
const History = require("../models/history.js")

module.exports = router

//get
router.get("/", async (req, res) => {
    try{
        const userData = await History.find({})
        return res.send(userData)
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
})

router.get("/find", async(req, res) => {
    try{
        const {username} = req.body
        if(!username){
          return res.sendStatus(404);
        }
        const user = await History.findOne({username})
        return res.json(user)
        
    } catch(error){
        return res.send(error)
    }
})

//post
router.post("/", async (req, res) => {
    try {
      const { username, history } = req.body;
  
      const newHistory = new History({
        username,
      });
  
      await newHistory.save();
  
      return res.status(201).json(newHistory);  
    } catch (err) {
      console.error("Error saving history:", err);
      res.status(400).json({ message: err.message }); 
    }
});

//patch
router.patch("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { product_name, URL, image_url } = req.body;
  
      const updatedHistory = await History.findByIdAndUpdate(
        id,
        {
          $push: {
            history: {
              product_name,
              URL,
              image_url
            }
          }
        },
        { new: true }
      );
  
      if (!updatedHistory) {
        return res.status(404).json({ message: "History not found" });
      }
  
      return res.status(200).json(updatedHistory);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: err.message });
    }
});
  
//delete
router.delete("/:id", async(req, res)=>{
    const id = req.params.id
    userData = await History.findByIdAndDelete(id)
    return;
})

module.exports = router;