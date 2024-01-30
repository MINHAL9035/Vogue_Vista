const express = require("express");
const adminRoute = express();
const adminController = require("../controller/adminController");
const productController = require("../controller/productController");
const orderController = require("../controller/orderController");
const couponController = require('../controller/couponController')
const upload = require("../middleware/upload");
const adminAuth = require('../middleware/adminAuth')

// ===============SETTING VEIW ENGINE===========================================
adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/admin");

// ========================ADMIN LOGIN========================================
adminRoute.get("/adminLogin", adminAuth.isLogout, adminController.adminLogin);
adminRoute.post("/adminLogin", adminAuth.isLogout, adminController.verifyLogin);
// =========================DASHBOARD==========================================
adminRoute.get("/", adminController.admindash);
adminRoute.get('/salesReport', adminController.salesReport)
adminRoute.post('/salesReport', adminController.datePicker)
adminRoute.get("/logout", adminAuth.isLogin, adminController.logout);

// =============================USER==========================================
adminRoute.get("/users", adminAuth.isLogin, adminController.loadUser);
adminRoute.post("/users/:action/:id", adminAuth.isLogin, adminController.updateUserStatus);

// ==============================CATEGORY==========================================
adminRoute.get("/categ", adminAuth.isLogin, adminController.loadCategory);
adminRoute.get("/addCateg", adminAuth.isLogin, adminController.loadAddCateg);
adminRoute.post("/addCateg", adminAuth.isLogin, adminController.addCateg);
adminRoute.post("/categ/:action/:id", adminAuth.isLogin, adminController.categoryStatus);
adminRoute.get("/editCateg", adminAuth.isLogin, adminController.loadEditCateg);
adminRoute.post("/editCateg", adminAuth.isLogin, adminController.editCateg);

// ===============================PRODUCT============================================
adminRoute.get("/product", adminAuth.isLogin, productController.loadProducts);
adminRoute.get("/addProduct", adminAuth.isLogin, productController.loadAddProduct);
adminRoute.post("/addProduct", adminAuth.isLogin, upload.upload.array("image"), productController.addProduct);
adminRoute.post("/product/:action/:id", adminAuth.isLogin, productController.productStatus);
adminRoute.get("/editProduct", adminAuth.isLogin, productController.loadEditProduct);
adminRoute.post("/editProduct", adminAuth.isLogin, upload.upload.array("image"), productController.editProduct);
adminRoute.patch("/product/deleteImage", adminAuth.isLogin, productController.deleteImg);

// ============================ORDER=======================================================
adminRoute.get("/orders", adminAuth.isLogin, orderController.loadAdminOrders);
adminRoute.post("/updateOrderStatus", adminAuth.isLogin, orderController.updateOrderStatus);
adminRoute.get('/order-details', adminAuth.isLogin, orderController.loadOrderDetails)

// ==========================COUPON========================================================
adminRoute.get('/coupons', adminAuth.isLogin, couponController.loadCoupon)
adminRoute.get('/addCoupon', couponController.loadAddCoupon)
adminRoute.post('/addcoupon', couponController.addCoupon)
adminRoute.get('/block-coupon', couponController.blockCoupon)
adminRoute.get('/edit-coupon', couponController.loadEditCoupon)
adminRoute.post('/edit-coupon', couponController.editCoupon)
adminRoute.post('/delete-coupon', couponController.deleteCoupon)

module.exports = adminRoute;
