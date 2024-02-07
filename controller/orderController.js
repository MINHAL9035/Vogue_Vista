const User = require("../model/userModel");
const orderModel = require("../model/orderModel");
const moment = require("moment");
const product = require("../model/product");
const order = require("../model/orderModel");
const puppeteer = require('puppeteer')
const ejs = require('ejs')
const path = require('path')

const loadOrders = async (req, res) => {
  const ITEMS_PER_PAGE = 2
  try {
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;
    const userData = req.session.user_id;
    const data = await orderModel.find({ user_id: userData })
      .skip(skip)
      .limit(ITEMS_PER_PAGE)
      .sort({ date: -1 })

    const totalOrders = await orderModel.countDocuments({ user_id: userData })
    const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE)

    res.render("orderList", { orders: data, moment, totalPages, currentPage: page });
  } catch (error) {
    res.redirect('/500')
  }
};

const loadSingleOrderDetails = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const orderId = req.query.orderId;

    const order = await orderModel
      .findOne({ _id: orderId, user_id: userId })
      .populate("items.product_id");
    const user = await User.findById(userId);

    res.render("singleOrder", { order, user, moment });
  } catch (error) {
    res.redirect('/500')
  }
};

// admin side

const loadAdminOrders = async (req, res) => {
  try {
    const orders = await orderModel.find().populate("items.product_id").populate('user_id').sort({ _id: -1 });
    res.render("orders", { orders, moment });
  } catch (error) {
    res.redirect('/500')
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, itemId, newStatus } = req.body;
    const user_id = req.session.user_id
    const update = {
      "items.$.ordered_status": newStatus,
      "items.$.status": newStatus,
    };
    const order = await orderModel.findById(orderId);
    const item = order.items.find((item) => item._id.toString() === itemId);

    // increase quantity if return or cancel
    if (['cancelled', 'returned'].includes(newStatus)) {
      const { product_id, quantity } = item;
      await product.findByIdAndUpdate(product_id, { $inc: { quantity } });

      const discountAmount = item.discountPerItem || 0
      const finalAmount = item.total_price - discountAmount

      const user = await User.findById(user_id)
      user.wallet += finalAmount

      user.walletHistory.push({
        date: new Date(),
        amount: finalAmount,
        reason: "refund for order"

      })

      await user.save()

    }


    const updatedOrder = await orderModel.findOneAndUpdate(
      { _id: orderId, "items._id": itemId },
      { $set: update },
      { new: true }
    );

    res.json({ success: true, updatedOrder });
  } catch (error) {
    res.redirect('/500')
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId, itemId, reason, returnReason } = req.body;

    if (reason || returnReason) {
      const order = await orderModel.findById(orderId);

      // Find the item in the order
      const item = order.items.find((item) => item._id.toString() === itemId);

      // Calculate the reduction in total amount based on the canceled/returned item
      const reductionAmount = item.total_price;

      const updateFields = {
        "items.$.ordered_status": reason ? "request_cancellation" : "request_return",
        "items.$.cancellationReason": reason || returnReason,
      };

      // Update the order with the new fields
      const updatedOrder = await orderModel.findOneAndUpdate(
        { _id: orderId, "items._id": itemId },
        { $set: updateFields },
        { new: true }
      );

      // Calculate the new total amount after reducing the canceled/returned item
      const newTotalAmount = order.total_amount - reductionAmount;

      // Update the order with the reduced total amount
      await orderModel.findByIdAndUpdate(orderId, { $set: { total_amount: newTotalAmount } });

      const message =
        reason
          ? "Order cancellation requested"
          : "Order return requested";

      res.status(200).json({ message, order: updatedOrder });
    }
  } catch (error) {
    res.redirect('/500')

  }
};



const loadOrderDetails = async (req, res) => {
  try {
    const { itemId, orderId } = req.query;
    const orderDetails = await order.findOne({ _id: orderId })
      .populate('user_id')
      .populate({
        path: "items.product_id",
        populate: {
          path: 'category'
        }
      })

    const { items } = orderDetails;
    const orderItems = items.find(item => item._id.toString() === itemId);


    res.render('order-details', { order: orderDetails, item: orderItems, moment })


  } catch (error) {
    res.redirect('/500')

  }
}

const loadInvoice = async (req, res) => {
  try {
    const { orderId } = req.query
    const { user_id } = req.session


    const userData = await User.findById(user_id)
    const orderData = await order.findById(orderId).populate('items.product_id')
    const sumTotal = orderData.items.reduce((total, item) => total + item.product_id.price * item.quantity, 0);

    const date = new Date()
    const data = {
      order: orderData,
      user: userData,
      date,
      sumTotal,
      moment
    }

    // Render the EJS template
    const ejsTemplate = path.resolve(__dirname, '../views/user/invoice.ejs');
    const ejsData = await ejs.renderFile(ejsTemplate, data);

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(ejsData, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

    // Close the browser
    await browser.close();

    // Set headers for inline display in the browser
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename=order_invoice.pdf'
    }).send(pdfBuffer);

  } catch (error) {
    console.error('Error in loadInvoice:', error);
    res.redirect('/500')
  }

}

module.exports = {
  loadOrders,
  loadSingleOrderDetails,
  cancelOrder,
  // admin side
  loadAdminOrders,
  updateOrderStatus,
  loadOrderDetails,
  // invoice
  loadInvoice
};
