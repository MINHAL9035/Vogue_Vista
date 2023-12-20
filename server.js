const mongoose = require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/users')
// --------------------------------------------------------------
require('dotenv').config()

const express = require('express')
const session = require('express-session')
const nocache = require('nocache')
const path = require('path')
const flash = require('express-flash')


const app = express()
  
app.use(express.json()) 
app.use(express.urlencoded({ extended: true }))

app.use(session({
    secret: process.env.SECRET, 
    resave: false,   
    saveUninitialized: false
}))  

app.use(nocache())  
app.use(flash());


const port = process.env.PORT || 8080

// load public     
app.use(express.static(path.resolve(__dirname, 'public')))
 
// load userRoute 
const userRoute = require('./routes/userRouter')
app.use('/', userRoute)

const adminRoute = require('./routes/adminRouter')
app.use('/admin', adminRoute)


app.listen(port, () => { console.log(`server is running on http://localhost:${port}`) })


 