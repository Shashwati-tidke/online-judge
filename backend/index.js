const express = require('express');
const app = express();
const {DBConnection} = require('./database/db.js');
const User = require("./models/Users.js");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const cookieParser = require("cookie-parser");
dotenv.config();


//Adding middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(cookieParser());

//connect to db
DBConnection();

app.get("/",(req,res)=>{
    res.send("Welcome to Main Page");
});


//register page
app.post("/register",async (req,res)=>{ 
    console.log(req);
    try {
        //get all the data from request body
        const {firstname, lastname, email, password} = req.body;

        //check that all the data should exist
        if(!(firstname && lastname && email && password)){
            return res.status(400).send("Please enter all the required fields")
        }

        //check if user already exist
        const existingUser = await User.findOne({email});

        if(existingUser){
            return res.status(400).send("User already exists!!");
        }
        //password encryption
        const hashPassword = await bcrypt.hashSync('password', 10);
        console.log(hashPassword);

        //Save the user to DB
        const user = await User.create({
            firstname,
            lastname,
            email,
            password: hashPassword,
        });

        //Generate a (JWT token)token for user and send it (Optional) 
        const token = jwt.sign({id:user._id, email}, process.env.SECRET_KEY,{
            expiresIn: "1h"
        });
        user.token = token;
        user.password = undefined;
        res.status(201).json({
            message: "You have successfully registered!",
            sucess: true,
            user,
            token
        });
        
        //Send the response


    } catch (error) {
        console.log(error.message+ "Error in regiser page");
    }
});

//login
app.post("/login",async (req,res)=>{
    try {
        //get all the data from request body
        const{email, password} = req.body;
         //check that all the data should exist(email and password only)
        if(!(email && password))
        {
            return res.status(400).send("Please enter all the information");
        }

         //find the user in the database
         const user = await User.findOne({email});
         if(!(user))
         {
            return res.status(401).send("User not found");
         }
         //match the password
         const enterPassword = await bcrypt.compare(password, user.password);
         if(!enterPassword)
         {
            res.status(401).send("Password is incorrect");
         }

         //create token
         const token = jwt.sign({id: user_id}, process.env.SECRET_KEY,{
            expiresIn:"1d",
         });
         user.token = token;
         user.password = undefined;     

         //store cookies -- cookie parser
        const options = {
            expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            httpOnly: true, //only manipulate by server not by client/user
        }

         //send the token
         res.status(201).cookie("token", token,options).json({
            message:"You have sucessfully login",
            sucess: true,
            token,
         });

    } catch (error) {
        
        console.log(error.message + "Error in login page");
    }
});

app.listen(8000, ()=>{
    console.log("Server is listening on port 8000");
});