const cart = require('../model/cartModel')
const product = require('../model/product')
const User = require('../model/userModel')


const loadCart = async (req, res) => {
    try {
        const userData = req.session.user_id
        const cartDetails = await cart.findOne({ user_id: userData }).populate({ path: 'items.product_id', model: 'product' })
        const user = await User.findOne({ _id: userData })
        console.log(cartDetails);
        res.render('cart', { cartDetails, user })
    } catch (error) {
        console.log(error);

    }
}

const addCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body
        const { user_id } = req.session

        if (!user_id) {
            res.redirect('/login')
        } else {
            const productData = await product.findOne({ _id: productId })
            const cartData = await cart.findOne({ user_id: user_id })

            if (cartData) {
                const existProduct = cartData.items.find((x) => x.product_id.toString() === productId)

                if (existProduct) {
                    await cart.findOneAndUpdate(
                        { user_id: user_id, 'items.product_id': productId },
                        {
                            $inc: {
                                'items.$.quantity': quantity,
                                'items.$.total_price': quantity * existProduct.price
                            }
                        }
                    )
                } else {
                    // add a new product to cart
                    await cart.findOneAndUpdate(
                        { user_id: user_id },
                        {
                            $push: {
                                items: {
                                    product_id: productId,
                                    quantity: quantity,
                                    price: productData.price,
                                    total_price: quantity * productData.price
                                }
                            }
                        }
                    )
                }
            } else {
                // create a new cart and add product
                const newCart = new cart({
                    user_id: user_id,
                    items: [{
                        product_id: productId,
                        quantity: quantity,
                        price: productData.price,
                        total_price: quantity * productData.price
                    }]
                })
                await newCart.save()
            }
            res.json({ success: true })
        }
    } catch (error) {
        console.log(error);

    }
}

module.exports = {
    loadCart,
    addCart
}  