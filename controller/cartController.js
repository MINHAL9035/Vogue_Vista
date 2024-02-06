const cart = require("../model/cartModel");
const product = require("../model/product");
const User = require("../model/userModel");
const { productStatus } = require("./productController");

const loadCart = async (req, res) => {
  try {
    const userData = req.session.user_id;
    const cartDetails = await cart.findOne({ user_id: userData })
      .populate({
        path: "items.product_id",
        model: "product",
        populate: [
          {
            path: "offer"
          },
          {
            path: "category",
            populate: {
              path: "offer"
            }
          }
        ]
      });

    const user = await User.findOne({ _id: userData });

    let total = 0
    let discountAmnt = 0
    let orginalAmt = 0


    if (cartDetails) {
      cartDetails.items.forEach((product) => {
        let itemPrice = product.product_id.price;
        orginalAmt += itemPrice * product.quantity

        // check if there is offer on product
        if (product.product_id.offer) {
          const { percentage } = product.product_id.offer
          itemPrice += (itemPrice * percentage) / 100
        }

        // Check if there's an offer on the category
        else if (product.product_id.category.offer) {
          const { percentage } = product.product_id.category.offer;
          itemPrice -= (itemPrice * percentage) / 100;
        }

        total += itemPrice * product.quantity
        discountAmnt = orginalAmt - total

      })
    }
    res.render("cart", { cartDetails, user, subTotal: orginalAmt, total, discountAmnt });

  } catch (error) {
    res.redirect('/500')
  }
};

const addCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const { user_id } = req.session;
      
    if (!user_id) {
      return res.json({ loginRequired: true });
    } else {
      const productData = await product.findOne({ _id: productId })
        .populate({
          path: "offer",
          match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } }
        })
        .populate({
          path: "category",
          populate: {
            path: "offer",
            match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } }
          }
        })
      const cartData = await cart.findOne({ user_id: user_id });

      if (cartData) {
        const existProduct = cartData.items.find(
          (x) => x.product_id.toString() === productId
        );

        if (existProduct) {

          let itemPrice = productData.price

          if (productData.offer) {
            const { percentage } = productData.offer
            itemPrice -= (itemPrice * percentage) / 100
          }
          else if (productData.category.offer) {
            const { percentage } = productData.category.offer
            itemPrice -= (itemPrice * percentage) / 100
          }


          await cart.findOneAndUpdate(
            { user_id: user_id, "items.product_id": productId },
            {
              $inc: {
                "items.$.quantity": quantity,
                "items.$.total_price": quantity * productData.price,
              },
            }
          );
        } else {

          let itemPrice = productData.price

          if (productData.offer) {
            const { percentage } = productData.offer
            itemPrice -= (itemPrice * percentage) / 100
          }
          else if (productData.category.offer) {
            const { percentage } = productData.category.offer
            itemPrice -= (itemPrice * percentage) / 100
          }

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
                  offerPercentage: productData.offer
                    ? productData.offer.percentage
                    : productData.category && productData.category.offer
                      ? productData.category.offer.percentage
                      : 0,
                },
              },
            }
          );
        }
      } else {

        let itemPrice = productData.price

        if (productData.offer) {
          const { percentage } = productData.offer
          itemPrice -= (itemPrice * percentage) / 100
        }
        else if (productData.category.offer) {
          const { percentage } = productData.category.offer
          itemPrice -= (itemPrice * percentage) / 100
        }




        // create a new cart and add product
        const newCart = new cart({
          user_id: user_id,
          items: [
            {
              product_id: productId,
              quantity: quantity,
              price: productData.price,
              total_price: quantity * productData.price,
              offerPercentage: productData.offer
                ? productData.offer.percentage
                : productData.category && productData.category.offer
                  ? productData.category.offer.percentage
                  : 0,
            },
          ],
        });
        await newCart.save();
      }
      res.json({ success: true });
    }
  } catch (error) {
    res.redirect('/500')
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
    res.redirect('/500')
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
    res.redirect('/500')
  }
};

module.exports = {
  loadCart,
  addCart,
  increaseQuantity,
  deleteCartItem,
};
