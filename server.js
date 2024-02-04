const express = require("express");
const session = require("express-session");
const nocache = require("nocache");
const morgan = require('morgan')
const path = require("path");
const flash = require("express-flash");
const connectDB = require('./database/connection')
require("dotenv").config();


const app = express();
connectDB()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(nocache());
app.use(flash());
// app.use(morgan('tiny'))

const port = process.env.PORT || 8080;

// load public
app.use(express.static(path.resolve(__dirname, "public")));

// load userRoute
const userRoute = require("./routes/userRouter");
app.use("/", userRoute);

const adminRoute = require("./routes/adminRouter");
app.use("/admin", adminRoute);

app.set('view engine', 'ejs')
app.set('views', "./views/user")


app.get('/500', (req, res) => {
  res.status(500).render('500')
})

app.get('*', (req, res) => {
  res.status(404).render('404')
})



app.listen(port, () => {
  console.log(`server is running on http://localhost:${port}`);
});

