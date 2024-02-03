const express = require("express");
const userRoute = express();

const userController = require("../controller/userController");
const cartController = require("../controller/cartController");
const checkoutController = require("../controller/checkoutController");
const orderController = require("../controller/orderController");
const couponController = require("../controller/couponController");
const auth = require("../middleware/auth");

// ===============SETTING VEIW ENGINE===========================================
userRoute.set("view engine", "ejs");
userRoute.set("views", "./views/user");

// ==================USER REGISTER===============================================
userRoute.get("/signup", auth.isLogout, userController.loadsignup);
userRoute.post("/signup", userController.verifySignup);

// =================USER OTP VERIFYING===========================================
userRoute.get("/Otp", auth.isLogout, userController.loadOtp);
userRoute.post("/Otp", userController.verifyOtp);

// =================USER LOGIN====================================================
userRoute.get("/login", auth.isLogout, userController.loadlogin);
userRoute.post("/login", userController.verifyLogin);

// ================USER LOGIN OTP================================================
userRoute.get("/loginOtp", auth.isLogout, userController.loginOtp);
userRoute.post("/loginOtp", userController.verifyLoginOtp);

// ====================Resend Otp===============================================
userRoute.post("/resendOtp",auth.isLogout,userController.resendOtp)

// ===============FORGOT PASSWORD=================================================
userRoute.get('/forget', auth.isLogout, userController.loadForgetPassword)
userRoute.post('/forget', userController.verifyForget)
userRoute.get('/resetForgetPass', auth.isLogout, userController.loadResetForgetPass)
userRoute.post('/resetForgetPass', userController.verifyForgetPass)

// =================USER LOAD HOME================================================
userRoute.get("/", auth.isLogout, userController.loadhome);
userRoute.get("/home", auth.isBlocked, auth.isLogin, userController.loadhome);
userRoute.get("/about", userController.loadAbout);
userRoute.get("/contact", userController.loadContact);
userRoute.get("/logout", auth.isLogin, userController.logout);

// ==================USER SHOP=====================================================
userRoute.get("/shop", auth.isBlocked, userController.loadShop);
userRoute.get("/productDetails", userController.loadProduct);

// ==================CART============================================================
userRoute.get("/cart", auth.isLogin, auth.isBlocked, cartController.loadCart);
userRoute.post("/cart", auth.isLogin, cartController.addCart);
userRoute.post("/changeQuantity", cartController.increaseQuantity);
userRoute.post("/deleteCartProduct", auth.isLogin, cartController.deleteCartItem);
userRoute.get("/checkout", auth.isBlocked, auth.isLogin, checkoutController.loadCheckout);

//============================CHECKOUT==================================================
userRoute.post("/addAddress", checkoutController.addAddress);
userRoute.get("/orderPage/:id", auth.isLogin, checkoutController.loadPlaceOrder);
userRoute.post("/placeOrder", checkoutController.orderPlacement);
userRoute.post('/verify-payment', checkoutController.verifyPayment)
userRoute.post('/apply-coupon', auth.isLogin, couponController.applyCoupon)

// ===========================ORDERS====================================================
userRoute.get("/order", auth.isLogin, orderController.loadOrders);
userRoute.get("/single-order", auth.isLogin, orderController.loadSingleOrderDetails);
userRoute.post("/cancel-order", orderController.cancelOrder);

// ==============================USER PROFILE============================================
userRoute.get("/userProfile", auth.isLogin, userController.loadUserProfile);
userRoute.get("/editProfile", userController.loadUpdateProfile);
userRoute.post("/editProfile", auth.isLogin, userController.updateUserProfile);
userRoute.get("/userAddress", auth.isLogin, userController.loadUserAddress);
userRoute.post("/userAddress", auth.isLogin, userController.userprofileAddAddress);
userRoute.post("/edit-address", userController.editAddress);
userRoute.post("/delete-address", userController.deleteAddress);
userRoute.get('/wallet', auth.isLogin, userController.loadWallet)

// ==========================CHANGE PASSWORD===============================================
userRoute.get("/changePassword", auth.isLogin, userController.loadChangePassword);
userRoute.post("/changePassword", userController.changePassword);

// ============================BLOCK & INVOICE=============================================
userRoute.get('/invoice', auth.isLogin, orderController.loadInvoice)
userRoute.get('/blocked-user', auth.isLogin, userController.loadBlockedUser)

module.exports = userRoute; 
