const express = require('express')
//import express from "express";
const mongoose = require('mongoose')
const route = require('./routes/route')
const app = express()

app.use(express.json())
mongoose.set('strictQuery', true);

mongoose.connect("mongodb+srv://Bhavi:Bhavi123@cluster1.yydegcy.mongodb.net/project3group6Database",{
    useNewUrlParser:true
})
.then(()=> console.log("MongoDB is Connected"))
.catch(err => console.log(err))
app.use('/',route)

app.listen(3000,function(){
    console.log("Express app running on port 3000")
})