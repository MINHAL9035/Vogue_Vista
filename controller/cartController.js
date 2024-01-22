const cart = require("../model/cartModel");
const product = require("../model/product");
const User = require("../model/userModel");
const { productStatus } = require("./productController");

const loadCart = async (req, res) => {
  try {
    const userData = req.session.user_id;
    const cartDetails = await cart.findOne({ user_id: userData }).populate({ path: "items.product_id", model: "product" });
    const user = await User.findOne({ _id: userData });

    let subTotal = 0;
    if (cartDetails) {
      subTotal = cartDetails.items.reduce((total, cartItem) => total + cartItem.price * cartItem.quantity, 0);
    }
    res.render("cart", { cartDetails, user, subTotal });

  } catch (error) {
    console.log(error);
  }
};

const addCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const { user_id } = req.session;

    if (!user_id) {
      res.redirect("/login"); 
    } else {
      const productData = await product.findOne({ _id: productId });
      const cartData = await cart.findOne({ user_id: user_id });

      if (cartData) {
        const existProduct = cartData.items.find(
          (x) => x.product_id.toString() === productId
        );

        if (existProduct) {
          await cart.findOneAndUpdate(
            { user_id: user_id, "items.product_id": productId },
            {
              $inc: {
                "items.$.quantity": quantity,
                "items.$.total_price": quantity * existProduct.price,
              },
            }
          );
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
                  total_price: quantity * productData.price,
                },
              },
            }
          );
        }
      } else {
        // create a new cart and add product
        const newCart = new cart({
          user_id: user_id,
          items: [
            {
              product_id: productId,
              quantity: quantity,
              price: productData.price,
              total_price: quantity * productData.price,
            },
          ],
        });
        await newCart.save();
      }
      res.json({ success: true });
    }
  } catch (error) {
    console.log(error);
  }
};

const increaseQuantity = async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const productId = req.body.productId;
    const count = req.body.count;

    const Cart = await cart.findOne({ user_id: user_id });

    if (!Cart) {
      return res.json({ success: false, message: "Cart not found" });
    }

    const cartProduct = Cart.items.find(
      (item) => item.product_id.toString() === productId
    );

    if (!cartProduct) {
      return res.json({
        success: false,
        message: "Product not found in the cart.",
      });
    }

    const products = await product.findById(productId);
    if (!products) {
      return res.json({
        success: false,
        message: "Product not found in the database.",
      });
    }

    if (count == 1) {
      if (cartProduct.quantity < products.quantity) {
        await cart.updateOne(
          { user_id: user_id, "items.product_id": productId },
          {
            $inc: {
              "items.$.quantity": 1,
              "items.$.total_price": products.price,
            },
          }
        );
        return res.json({ success: true });
      } else {
        const allowedQuantity = products.quantity;
        return res.json({
          success: false,
          message: `The maximum quantity avialable for this product is ${allowedQuantity}.Please adjust your quantity `,
        });
      }
    } else if (count == -1) {
      if (cartProduct.quantity > 1) {
        await cart.updateOne(
          { user_id: user_id, "items.product_id": productId },
          {
            $inc: {
              "items.$.quantity": -1,
              "items.$.total_price": -products.price,
            },
          }
        );
        return res.json({ success: true });
      } else {
        return res.json({
          success: false,
          message: "Quantity cannot be less than 1.",
        });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const deleteCartItem = async (req, res) => {
  try {
    const productOgId = req.body.productOgId;
    const userId = req.session.user_id;

    const cartUser = await cart.findOne({ user_id: userId });
    if (cartUser.items.length == 1) {
      await cart.deleteOne({ user_id: userId });
    } else {
      await cart.findOneAndUpdate(
        { user_id: userId },
        { $pull: { items: { _id: productOgId } } }
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  loadCart,
  addCart,
  increaseQuantity,
  deleteCartItem,
};
