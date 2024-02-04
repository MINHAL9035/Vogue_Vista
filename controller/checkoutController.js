const User = require("../model/userModel");
const mongoose = require('mongoose')
const cart = require("../model/cartModel");
const product = require("../model/product");
const orderModel = require("../model/orderModel");
const moment = require("moment");
const order = require("../model/orderModel");
const dotenv = require('dotenv')
const coupon = require('../model/couponModel')
const razorpay = require('razorpay');
const { kernel } = require("sharp");
dotenv.config()

var instance = new razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

const loadCheckout = async (req, res) => {
  try {
    const userData = req.session.user_id;
    const cartDetails = await cart.findOne({ user_id: userData }).populate({ path: "items.product_id", model: "product" });
    const couponData = await coupon.find({ status: true })

    const user = await User.findOne({ _id: userData });
    const subTotal = cartDetails?.items.reduce((total, cartItem) => total + cartItem.price * cartItem.quantity, 0) || 0;

    res.render("checkout", { cartDetails, user, subTotal, coupon: couponData });

  } catch (error) {
    res.redirect('/500')
  }
};

const addAddress = async (req, res) => {
  try {
    const { name, houseName, phone, place, pincode, state } = req.body;

    const user = await User.findOne({ _id: req.session.user_id });

    if (user) {
      await User.updateOne(
        { _id: req.session.user_id },
        {
          $push: {
            address: [
              {
                name: name,
                housename: houseName,
                phone: phone,
                city: place,
                state: state,
                pincode: pincode,
              },
            ],
          },
        },
        { new: true }
      );
      res.json({ success: true, message: "Address added successfully" });
    } else {
      res.status(400).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    res.redirect('/500')
  }
};

const loadPlaceOrder = async (req, res) => {
  try {
    const userid = req.session.user_id;
    const id = req.params.id;
    const orders = await orderModel.findOne({ _id: id }).populate('user_id');
    const coupons = await coupon.find({});
    const user = await User.findOne({ _id: userid });

    const appliedCouponCode = orders.couponCode;
    const appliedCoupon = coupons.find(coupon => coupon.couponCode === appliedCouponCode);
    const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;

    res.render("order", { user, orders, moment, coupons, discountAmount });
  } catch (error) {
    res.redirect('/500')
  }
};

const orderPlacement = async (req, res) => {
  try {
    const date = new Date();
    const user_id = req.session.user_id;
    const { address, paymentMethod } = req.body;
    const cartData = await cart.findOne({ user_id: user_id });
    const userData = await User.findById(user_id);
    const cartProducts = cartData.items;
    const status = paymentMethod === "COD" || paymentMethod === "Wallet" ? "placed" : "pending";
    const delivery = new Date(date.getTime() + 10 * 24 * 60 * 60 * 1000);
    const deliveryDate = delivery.toLocaleString("en-US", { year: "numeric", month: "short", day: "2-digit" }).replace(/\//g, "-");
    const totalPrice = cartData.items.reduce((total, item) => total + item.total_price, 0);
    let discountPerItem;
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const orderRand = "MFTS" + randomNum;
    const code = req.body.couponCode;

    const couponDetails = await coupon.findOne({ couponCode: code })

    // User limit decreasing
    if (code) {
      await coupon.updateOne({ couponCode: code }, { $inc: { availability: -1 }, $push: { userUsed: { user_id: mongoose.Types.ObjectId.createFromHexString(user_id) } } });
    }

    if (!userData) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Calculate total amount after coupon (if applied)
    let totalAfterCoupon = totalPrice;

    if (code) {
      const coupons = await coupon.findOne({ couponCode: code });
      const disAmount = coupons.discountAmount;
      totalAfterCoupon -= disAmount;
      const numberOfProducts = cartData.items.length
      discountPerItem = disAmount / numberOfProducts
    }

    const updatedItems = cartProducts.map(item => {
      const updatedItem = { ...item, ordered_status: status, discountPerItem: discountPerItem }
      return updatedItem
    })

    // Create order
    const orderData = new orderModel({
      user_id: user_id,
      order_id: orderRand,
      delivery_address: address,
      user_name: userData.username,
      total_amount: totalAfterCoupon,
      date: Date.now(),
      expected_delivery: deliveryDate,
      payment: paymentMethod,
      items: updatedItems,
      discount: couponDetails ? couponDetails.discountAmount : 0,
      couponCode: code || null,
    });

    let orders = await orderData.save();
    const orderId = orders._id;

    // Update user's wallet if payment is from the wallet
    if (status === "placed" && paymentMethod === "Wallet") {
      // Check if the wallet has sufficient balance
      if (userData.wallet < totalAfterCoupon) {
        return res.json({ insufficientBalance: true });
      }

      userData.wallet -= totalAfterCoupon;
      userData.walletHistory.push({
        date: new Date(),
        amount: totalAfterCoupon,
        reason: `Placed Order From Wallet`
      });
      await userData.save();
    }
    // Check product quantity
    for (const cartItem of cartProducts) {
      const productId = cartItem.product_id;
      const Product = await product.findById(productId);

      if (!Product || cartItem.quantity > Product.quantity) {
        return res.json({ outOfStock: true })
      }
    }

    // ============cash on delivery====================
    if (orders.items.some(item => item.ordered_status === 'placed')) {
      await cart.deleteOne({ user_id: user_id });
      for (let i = 0; i < cartData.items.length; i++) {
        const productId = cartProducts[i].product_id;
        const count = cartProducts[i].quantity;

        await product.updateOne(
          { _id: productId },
          { $inc: { quantity: -count } }
        );
      }

      return res.json({ success: true, params: orderId });
    } else {
      // Razorpay
      const total = totalAfterCoupon; // Use the adjusted total amount
      console.log("razorpay total:", total);

      var options = {
        amount: total * 100,
        currency: "INR",
        receipt: "" + orderId,
      };

      instance.orders.create(options, function (err, order) {
        console.log(order);
        return res.json({ success: false, order: order });
      });
    }
  } catch (error) {
    res.redirect('/500')
  }
};




const verifyPayment = async (req, res) => {
  try {
    const cartData = await cart.findOne({ user_id: req.session.user_id });
    const cartProducts = cartData.items;
    const details = req.body
    console.log("my verify payment body", req.body);

    const crypto = require("crypto");

    secretKey = process.env.RAZORPAY_SECRET_KEY

    const hmac = crypto.createHmac("sha256", secretKey);

    // Updating the HMAC with the data
    hmac.update(details.payment.razorpay_order_id + "|" + details.payment.razorpay_payment_id);
    console.log("my razorpay orderid", details.payment.razorpay_order_id);
    console.log("my razorpay paymentid", details.payment.razorpay_payment_id);

    // Getting the hexadecimal representation of the HMAC
    const hmacFormat = hmac.digest("hex");
    console.log("my hmac", hmacFormat);
    console.log('my details is here', details.payment.razorpay_signature)

    if (hmacFormat == details.payment.razorpay_signature) {

      await order.updateOne(
        { "_id": details.order.receipt },
        {
          $set: {
            "paymentId": details.payment.razorpay_payment_id,
            "items.$[].ordered_status": "placed"
          }
        }
      )
      for (let i = 0; i < cartProducts.length; i++) {
        let count = cartProducts[i].quantity;
        await product.updateOne(
          { "_id": cartProducts[i].product_id },
          { $inc: { "quantity": -count } }
        );
      }

      await cart.deleteOne({ user_id: req.session.user_id });

      res.json({ success: true, params: details.order.receipt });

    }
    else {
      await order.deleteOne({ "order_id": details.order.receipt });
      res.json({ success: false });
    }

  } catch (error) {
    res.redirect('/500')

  }
}


module.exports = {
  loadCheckout,
  addAddress,
  loadPlaceOrder,
  orderPlacement,
  verifyPayment
};

