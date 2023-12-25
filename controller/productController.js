const product = require('../model/product')
const Category = require('../model/category')
const sharp = require('sharp')
const path = require('path')

const loadProducts = async (req, res) => {
    try {
        const productData = await product.find({})
        res.render('products', { products: productData })

    } catch (error) {
        console.log(error);

    }
}

const loadAddProduct = async (req, res) => {
    try {
        const data = await Category.find({ is_listed: false })
        res.render('addProduct', { category: data })

    } catch (error) {
        console.log(error);

    }
}

const addProduct = async (req, res) => {
    try {
        const existProduct = await product.findOne({ name: req.body.productName })
        if (existProduct) {
            res.status(404).send({ message: 'category already exist' })
        } else {
            const { productName, description, quantity, price, category, brand, date } = req.body
            const filenames = []
            console.log(req.body);

            const selectedCategory = await Category.findOne({ name: category })

            const data = await Category.find({ is_listed: false })

            if (req.files.length !== 4) {
                return res.render('addProduct', { message: '4 images needed', category: data })
            }
            // resize and save each uploaded images
            for (let i = 0; i < req.files.length; i++) {
                const imagesPath = path.join(__dirname, '../public/sharpimages', req.files[i].filename)
                await sharp(req.files[i].path).resize(800, 1200, { fit: 'fill' }).toFile(imagesPath)
                filenames.push(req.files[i].filename)
            }
            const newProduct = new product({
                name: productName,
                description,
                quantity,
                price,
                image: filenames,
                category: selectedCategory._id,
                brand,
                date,
            })
            await newProduct.save()
            res.redirect('/admin/product')
        }
    } catch (error) {
        console.log(error);

    }
}

const unList = async (req, res) => {
    try {
        const productid = req.params.id
        const updatedProduct = await product.findByIdAndUpdate(productid, { is_listed: true }, { new: true })
        console.log('Updated Product:', updatedProduct);

        if (!updatedProduct) {
            return res.status(404).send({ message: "product is not found" })
        } else {
            res.send({ status: "success", products: updatedProduct })
        }

    } catch (error) {
        console.log(error);

    }
}
const list = async (req, res) => {
    try {
        const productid = req.params.id
        const updatedProduct = await product.findByIdAndUpdate(productid, { is_listed: false }, { new: true })
        if (!updatedProduct) {
            return res.status(404).send({ message: "product is not found" })
        } else {
            res.send({ status: "success", products: updatedProduct })

        }

    } catch (error) {
        console.log(error);

    }
}

const loadEditProduct = async (req, res) => {
    try {
        const id = req.query.productId
        const categories = await Category.find({ is_listed: false })
        const data = await product.findOne({ _id: id })
        if (!data) {
            req.flash('message', "product not found")
            return res.redirect(`/admin/editProduct?productId=${id}`);
        }
        res.render('editProduct', { products: data, categ: categories })

    } catch (error) {
        console.log(error);

    }
}


// const editProduct = async (req, res) => {
//     try {
//         const id = req.body.id
//         const { productName, description, quantity, price, category, brand } = req.body

//         const data = await product.findOne({ _id: id })
//         const categories = await Category.findOne({ is_listed: false })

//         // Check if category is provided as a string, convert it to ObjectId
//         const categoryId = mongoose.Types.ObjectId.isValid(category) ? mongoose.Types.ObjectId(category) : category;

//         // update the prodocut in database
//         // const updatedProduct = await product.findByIdAndUpdate({ _id: id }, { name: productName, description, quantity, price, category, brand }, { new: true }).populate('category');
//         const updatedProduct = await product.findByIdAndUpdate(
//             id,
//             { name: productName, description, quantity, price, category: categoryId, brand },
//             { new: true }
//         );



//         res.redirect('/admin/product')
//     } catch (error) {
//         console.log(error);
//     }
// }

const editProduct = async (req, res) => {
    try {
        const id = req.body.id
        const { productName, description, quantity, price, category, brand } = req.body

        // product exist
        const existingProduct = await product.findOne({ _id: id })
        if (existingProduct) {
            req.flash('message', 'product already exist')
            return res.redirect('/admin/editProduct')
        }

        // updtae
        await product.findByIdAndUpdate({ _id: id }, { name: productName, description, quantity, price, category, brand }, { new: true })

        req.flash('message', 'product updated successfully')
        req.redirect('/admin/product')

    } catch (error) {
        console.log(error);

    }
}

module.exports = {
    loadProducts,
    loadAddProduct,
    addProduct,
    unList,
    list,
    loadEditProduct,
    editProduct
}