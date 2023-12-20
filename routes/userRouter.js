const express = require("express")
const userRoute = express()
const userController = require('../controller/userController')
const auth = require('../middleware/auth')


// load ejs
userRoute.set('view engine', 'ejs')
userRoute.set('views', './views/user')

userRoute.get('/', auth.isLogout, userController.loadhome)

userRoute.get('/home', auth.isLogin, userController.loadhome)

userRoute.get('/login', auth.isLogout, userController.loadlogin)

userRoute.post('/login', userController.verifyLogin)

userRoute.get('/signup', auth.isLogout, userController.loadsignup)

userRoute.post('/signup', userController.verifySignup)

userRoute.get('/Otp', auth.isLogout, userController.loadOtp)

userRoute.post('/Otp', userController.verifyOtp)

userRoute.get('/loginOtp', auth.isLogout, userController.loginOtp)

userRoute.post('/loginOtp', userController.verifyLoginOtp)

userRoute.get('/logout', auth.isLogin, userController.logout)

userRoute.get('/shop', userController.loadShop)

userRoute.get('/productDetails', userController.loadProduct)

userRoute.get('/about', userController.loadAbout)

userRoute.get('/contact', userController.loadContact)



module.exports = userRoute 