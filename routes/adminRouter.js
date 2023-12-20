const express = require('express')
const adminRoute = express()
const adminController = require('../controller/adminController')
const productController = require('../controller/productController')
const multer = require('multer')
const path = require('path')


// multer middleware
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "..", "public", "myImages"))
    },
    filename: (req, file, cb) => {
        console.log(file);
        const name = Date.now() + '-' + file.originalname
        cb(null, name)
    }
})

const upload = multer({ storage: storage }).array('image', 4)


// load ejs
adminRoute.set('view engine', 'ejs')
adminRoute.set('views', './views/admin')

adminRoute.get('/adminLogin', adminController.adminLogin)

adminRoute.get('/', adminController.admindash)

adminRoute.get('/logout', adminController.logout)

adminRoute.post('/adminLogin', adminController.verifyLogin)

adminRoute.get('/users', adminController.loadUser)

adminRoute.post('/users/:action/:id', adminController.updateUserStatus)

adminRoute.get('/categ', adminController.loadCategory)

adminRoute.get('/addCateg', adminController.loadAddCateg)

adminRoute.post('/addCateg', adminController.addCateg)

adminRoute.post('/categ/:action/:id', adminController.categoryStatus)

adminRoute.get('/editCateg', adminController.loadEditCateg)

adminRoute.post('/editCateg', adminController.editCateg)

adminRoute.get('/product', productController.loadProducts)

adminRoute.get('/addProduct', productController.loadAddProduct)

adminRoute.post('/addProduct', upload, productController.addProduct)

adminRoute.post('/product/unlist/:id', productController.unList)

adminRoute.post('/product/list/:id', productController.list)

adminRoute.get('/editProduct', productController.loadEditProduct)

adminRoute.post('/editProduct', productController.editProduct)



module.exports = adminRoute



