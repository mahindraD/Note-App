require("dotenv").config();

const config = require("./config.json")
const mongoose = require("mongoose");

mongoose.connect(config.connectionString);

const express = require("express");
const cors = require("cors");
const app = express();

const User = require("./models/user.model");
const Note = require("./models/note.model");

const jwt = require("jsonwebtoken");
const { authenticationToken } = require("./utilities");

app.use(express.json());

app.use(
    cors({
        origin:"*",
    })
)

app.get("/",(req,res)=>{
    console.log("mahindra");
    res.json({ data:"hello"});
});

// Backend Ready

// create account
app.post("/create-account", async( req,res)=>{
    const { fullName, email, password } = req.body;
    if(!fullName){
        return res.status(400).json({error:true,message:"full name is required"})
    }
    if(!email){
        return res.status(400).json({error:true,message:"Email is required"});
    }
    if(!password){
        return res.status(400).json({error:true,message:"password is required"});
    }

    const isUser = await User.findOne({email:email});

    if(isUser){
        return res.json({
            error:true,
            message:"User already Exists",
        })
    }

    const user = new User({
        fullName,
        email,
        password,
    });

    await user.save();

    const accessToken = jwt.sign({user},
        process.env.ACCESS_TOKEN_SECRET,{
            expiresIn: "36000m"
        });

    return res.json({
        error:false,
        user,
        accessToken,
        message:"Registration Successfull",
    })
});

// login
app.post("/login", async(req,res) => {
    const { email,password } = req.body;
    if(!email){
        return res.status(400).json({message:"email is required"});
    }
    
    if(!password){
        return res.status(400).json({message:"password is required"});
    }
    const userInfo = await User.findOne({email: email});
    
    if(!userInfo) {
        return res.status(400).json({ message:"user not found"});
    }

    if(userInfo.email==email && userInfo.password==password){
        const user = { user:userInfo};
        const accessToken = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
            expiresIn:"36000m",
        });
        return res.json({
            error: false,
            message: "login successfull",
            email,
            accessToken,
        })
    }
    else{
        return res.status(400).json({
            error:true,
            message:"Invalid Credentials",
        });
    }
});

// get user
app.get("/get-user",authenticationToken,async(req,res)=>{
    const { user } = req.user;
    const isUser = await User.findOne({_id: user._id});

    if(!isUser){
        return res.sendStatus(401);
    }

    return res.json({
        user: {
            fullName : isUser.fullName,
            email : isUser.email,
            "_id" : isUser._id,
            createdOn: isUser.createdOn,
        },
        message: "",
    })
});

// Add notes
app.post("/add-note",authenticationToken, async( req,res) => {
    const {title,content,tags}=req.body;
    const { user }= req.user;

    if(!title){
        return res.status(400).json({error:true, message:"title is required"});
    }

    if(!content){
        return res.status(400).json({error:true, message:"content is required"});
    }

    try{
        const note = new Note({
            title,
            content,
            tags:tags||[],
            userId:user._id,
        });

        await note.save();

        return res.json({
            error:false,
            note,
            message:"Note added successfully"
        });
    }
    catch(error){
        return res.status(401).json({
            error:true,
            message:"Internal Server Error",
        })
    }

});

// Edit a Note
app.put("/edit-note/:noteId", authenticationToken, async(req,res) => {
    const noteId = req.params.noteId;
    const { title,content,tags,isPinned } = req.body;
    const { user } = req.user;

    if( !title && !content && !tags){
        return res.status(400).json({error:true, message:"No changes provided"});
    }

    try{
        const note = await Note.findOne({_id: noteId, userId: user._id});

        if(!note){
            return req.status(400).json({ error: true, message: "note not found"});
        }

        if(title) note.title=title;
        if(content) note.content=content;
        if(tags) note.tags=tags;
        if(isPinned) note.isPinned=isPinned;

        await note.save();

        return res.json({
            error: false,
            note,
            message:"Note updated successfully",
        });
    }
    catch(error){
        return res.status(500).json({
            error:true,
            message:"Internal server error",
        })
    }
});

// Get all Notes
app.get("/get-all-notes",authenticationToken, async(req,res)=>{
    const { user } = req.user;
    try{
        const notes = await Note.find({
            userId: user._id
        }).sort({ isPinned: -1});

        return res.json({
            error:false,
            notes,
            message:'All notes retrived successfully',
        })
    }
    catch(error){
        return res.status(500).json({
            error:true,
            message: "Internal Server Error",
        })
    }
});

// Delete a Note
app.delete("/delete-note/:noteId",authenticationToken, async(req,res)=>{
    const noteId = req.params.noteId;
    const { user } = req.user;

    try{
        const note = await Note.findOne({_id: noteId, userId: user._id});

        if(!note){
            return res.status(404).json({error:true, message:"Note not found"});
        }

        await Note.deleteOne({_id:noteId, userId: user._id});

        return res.json({
            error:false,
            message:"Note delete successfully",
        })
    }
    catch(error){
        return res.status(500).json({
            errror:true,
            message:"Internal Server error",
        })
    }
});

// update isPinned
app.put("/update-note-pinned/:noteId",authenticationToken, async(req,res)=>{
    const noteId = req.params.noteId;
    const { isPinned } = req.body;
    const { user } = req.user;

    try{
        const note = await Note.findOne({_id: noteId, userId: user._id});

        if(!note){
            return req.status(400).json({ error: true, message: "note not found"});
        }

        note.isPinned=isPinned || false;

        await note.save();

        return res.json({
            error: false,
            note,
            message:"Note updated successfully",
        });
    }
    catch(error){
        console.log("error occured");
        return res.status(500).json({
            error:true,
            message:"Internal server error",
        })
    }
});

// search notes
app.put("/search-notes",authenticationToken,async(req,res)=>{
    const { user } = req.user;
    const query = req.body.params.query;
     
    if(!query){
        return res.status(400).json({error: true, message: "search query is required"});
    }

    try{
        const matchingNotes = await Note.find({
            userId: user._id,
            $or: [
                { title: { $regex: new RegExp(query,"i")}},
                { content: { $regex: new RegExp(query, "i")}},
            ],
        });
        return res.json({
            error: false,
            notes: matchingNotes,
            message: "Notes matching the search query retrived successfully",
        });
    }catch(error){
        return res.status(500).json({
            error:true,
            message:"Internal Server error",
        })
    }
});

app.listen(8000,()=>{
    console.log("server is listening to port 8000");
});

module.exports = app;