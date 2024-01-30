const User = require("../model/userModel");
const order = require('../model/orderModel')
const bcrypt = require("bcrypt");
const category = require("../model/category");
const product = require('../model/product')
const moment = require('moment')

const adminLogin = async (req, res) => {
  try {
    res.render("adminLogin");
  } catch (error) {
    console.log(error);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email: email });

    // If user with the given email is not found
    if (!userData) {
      req.flash("message", "Admin not found");
      res.redirect("/admin/adminLogin");
      return;
    }

    const passwordMatch = await bcrypt.compare(password, userData.password);

    // If the password does not match
    if (!passwordMatch) {
      req.flash('message', "Incorrect Password");
      res.redirect('/admin/adminLogin');
      return;
    }

    if (userData.is_admin === 1) {
      req.session.admin = userData._id;
      res.redirect("/admin/");
    } else {
      // If the user is not an admin
      req.flash("message", "You are not authorized as an admin");
      res.redirect("/admin/adminLogin");
    }

  } catch (error) {
    console.log(error);
  }
};

const admindash = async (req, res) => {
  try {
    // ==============orders count====================
    const ordersCount = await order.aggregate([
      {
        $unwind: "$items"
      },
      {
        $match: {
          "items.ordered_status": { $ne: "pending" }
        }
      },
      {
        $group:
        {
          _id: null,
          totalOrders: { $sum: 1 },
          deliveredOrders: {
            $sum: {
              $cond: [
                { $eq: ["$items.ordered_status", "delivered"] },
                1,
                0
              ]
            }
          },
          otherOrders: {
            $sum: {
              $cond: [
                { $ne: ["$items.ordered_status", "delivered"] },
                1,
                0
              ]
            }
          },
          cancelOrders: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$items.ordered_status", "cancelled"] },
                    { $eq: ["$items.ordered_status", "returned"] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ])
    const totalOrder = ordersCount.length != 0 ? ordersCount[0].totalOrders : 0
    const deliveredOrders = ordersCount.length != 0 ? ordersCount[0].deliveredOrders : 0
    const otherOrders = ordersCount.length != 0 ? ordersCount[0].otherOrders : 0
    const cancelOrders = ordersCount.length != 0 ? ordersCount[0].cancelOrders : 0

    console.log("my orders count", ordersCount)
    // =======================TOTAL REVENUE=====================================
    const totalSales = await order.aggregate([
      {
        $unwind: "$items"
      },
      {
        $match: {
          "items.ordered_status": "delivered"
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $subtract: [
                {
                  $multiply: ["$items.quantity", "$items.price"],
                },
                "$items.discountPerItem",
              ],
            },
          },
        },
      },
    ])

    const totalSale = totalSales.length != 0 ? totalSales[0].totalRevenue : 0
    console.log("total sales revenue", totalSales)

    // =============PRODUCT AND CATEGORY COUNT================
    const productCount = await product.countDocuments({})
    const categoryCount = await category.countDocuments({})

    // =================MONTHLY EARNINGS========================
    const monthlyEarnings = await order.aggregate([
      {
        $unwind: "$items"
      },
      {
        $match: {
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          "items.ordered_status": "delivered"
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalSales: {
            $sum: {
              $subtract: [
                {
                  $multiply: ["$items.quantity", "$items.price"],
                },
                "$items.discountPerItem",
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
    ])

    const monthlyEarn = monthlyEarnings.length != 0 ? monthlyEarnings[0].totalSales : 0
    console.log("my monthly sales", monthlyEarnings)

    const currentYear = new Date().getFullYear();
    const yearsToInclude = 7;
    const currentMonth = new Date().getMonth() + 1

    const deafultMonthlyValues = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      total: 0,
      count: 0,
    }))

    const defaultYearlyValues = Array.from({ length: yearsToInclude }, (_, i) => ({
      year: currentYear - yearsToInclude + i + 1,
      total: 0,
      count: 0,
    }))

    // monthely salesData Graph
    const monthlySalesData = await order.aggregate([
      {
        $unwind: "$items"

      },
      {
        $match: {
          "items.ordered_status": "delivered",
          createdAt: { $gte: new Date(currentYear, currentMonth - 1, 1) },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: {
            $sum: {
              $subtract: [
                {
                  $multiply: ["$items.quantity", "$items.price"],
                },
                "$items.discountPerItem",
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: '$_id',
          total: '$total',
          count: '$count'
        }
      }
    ])

    const updatedMonthlyValues = deafultMonthlyValues.map((defaultMonth) => {
      const foundMonth = monthlySalesData.find((monthData) => monthData.month === defaultMonth.month)
      return foundMonth || defaultMonth
    })

    console.log("monthly Sales Data", updatedMonthlyValues);

    //========================= yearly SalesData graph======================

    const yearlySalesData = await order.aggregate([
      {
        $unwind: "$items"
      },
      {
        $match: {
          "items.ordered_status": "delivered",
          createdAt: { $gte: new Date(currentYear - yearsToInclude, 0, 1) },
        },
      },
      {
        $group: {
          _id: { $year: '$createdAt' },
          total: {
            $sum: {
              $subtract: [
                {
                  $multiply: ["$items.quantity", "$items.price"],
                },
                "$items.discountPerItem",
              ],
            },
          },
          count: { $sum: 1 },
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id",
          total: "$total",
          count: "$count",
        }
      }
    ])

    const updatedYearlyValues = defaultYearlyValues.map((defaultYear) => {
      const foundYear = yearlySalesData.find((yearData) => yearData.year === defaultYear.year)
      return foundYear || defaultYear
    })

    console.log(" yearly sales Data", updatedYearlyValues);

    // =================monthly orders==========================
    const monthlyOrders = await order.aggregate([
      {
        $unwind: "$items"
      },
      {
        $match: {
          "items.ordered_status": "delivered",
          createdAt: { $gte: new Date(currentYear, currentMonth - 1, 1) },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalOrders: { $sum: 1 }
        },
      },
    ])

    const updatedMonthlyOrders = deafultMonthlyValues.map((defaultMonth) => {
      const foundMonth = monthlyOrders.find(
        (monthData) => monthData._id === defaultMonth.month)
      return { month: defaultMonth.month, totalOrders: foundMonth ? foundMonth.totalOrders : 0 };
    })

    console.log("monthly orders", updatedMonthlyOrders);

    // ========================yearly orders======================
    const yearlyOrders = await order.aggregate([
      {
        $unwind: "$items"
      },
      {
        $match: {
          "items.ordered_status": "delivered",
          createdAt: { $gte: new Date(currentYear - yearsToInclude, 0, 1) },
        },
      },
      {
        $group: {
          _id: { $year: "$createdAt" },
          totalOrders: { $sum: 1 }
        },
      },
    ])

    const updatedYearlyOrders = defaultYearlyValues.map((defaultYear) => {
      const foundYear = yearlyOrders.find(
        (yearData) => yearData._id === defaultYear.year
      )
      return { year: defaultYear.year, totalOrder: foundYear ? foundYear.totalOrders : 0 }
    })

    console.log("yearly orders", updatedYearlyOrders);

    // =============================monthly users===========================
    const monthlyUsers = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(currentYear, currentMonth - 1, 1) },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalUsers: { $sum: 1 },
        }
      }
    ])

    const updatedMonthlyUsers = deafultMonthlyValues.map((defaultMonth) => {
      const foundMonth = monthlyUsers.find(
        (monthData) => monthData._id === defaultMonth.month
      )
      return { month: defaultMonth.month, totalUsers: foundMonth ? foundMonth.totalUsers : 0 };
    })

    console.log("my monthlytotal users", updatedMonthlyUsers);

    // =============================yearly users===================================
    const yearlyUsers = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(currentYear - yearsToInclude, 0, 1) },
        },
      },
      {
        $group: {
          _id: { $year: "$createdAt" },
          totalUsers: { $sum: 1 }
        }
      }
    ])

    const updatedYearlyUsers = defaultYearlyValues.map((defaultYear) => {
      const foundYear = yearlyUsers.find(
        (yearData) => yearData._id === defaultYear.year
      )
      return { year: defaultYear.year, totalUsers: foundYear ? foundYear.totalUsers : 0 }
    })

    console.log("my yearlytotal users", updatedYearlyUsers);

    // new users
    const latestUsers = await User.find({ verified: true }).sort({ createdAt: -1 }).limit(5)

    // latest orders
    const latestOrders = await order.aggregate([
      {
        $unwind: "$items"
      },
      {
        $match: {
          "items.ordered_status": { $ne: "pending" }
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $limit: 10
      },
    ])


    res.render("admin", {
      // orders count
      totalOrder,
      deliveredOrders,
      otherOrders,
      cancelOrders,

      // revenue
      totalSale,
      monthlyEarn,

      // monthly $ yearly 
      updatedMonthlyValues,
      updatedYearlyValues,
      updatedMonthlyOrders,
      updatedYearlyOrders,
      updatedMonthlyUsers,
      updatedYearlyUsers,

      // product and category
      productCount,
      categoryCount,

      // leatest users and orders
      latestUsers,
      latestOrders,
      moment
    });

  } catch (error) {
    console.log(error);
  }
};



const logout = async (req, res) => {
  try {
    req.session.admin = null;
    res.redirect("/admin/adminLogin");
  } catch (error) {
    console.log(error);
  }
};

const loadUser = async (req, res) => {
  try {
    const usersData = await User.find({ is_admin: 0 });
    res.render("userManagement", { users: usersData });
  } catch (error) {
    console.log(error);
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const userData = await User.findById(userId);

    if (!userData) {
      return res.status(404).send("User not found");
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { is_blocked: !userData.is_blocked } },
      { new: true }
    );

    res.send({ status: "success", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


const loadCategory = async (req, res) => {
  try {
    const categData = await category.find({});
    res.render("category", { categ: categData });
  } catch (error) {
    console.log(error);
  }
};

const loadAddCateg = async (req, res) => {
  try {
    res.render("addCateg");
  } catch (error) {
    console.log(error);
  }
};

const addCateg = async (req, res) => {
  try {
    const existCategory = await category.findOne({
      name: req.body.categoryName.toUpperCase(),
    });
    if (existCategory) {
      req.flash("message", "Category already exist");
      res.redirect("/admin/addCateg");
    } else {
      const { categoryName, description } = req.body;
      // new categ
      const newCateg = new category({
        name: categoryName.toUpperCase(),
        description,
      });
      await newCateg.save();
      res.redirect("/admin/categ");
    }
  } catch (error) {
    console.log(error);
  }
};


const categoryStatus = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const categoryData = await category.findById(categoryId);

    if (!categoryData) {
      return res.status(404).send("Category not found");
    }

    const updatedCategory = await category.findByIdAndUpdate(
      categoryId,
      { $set: { is_listed: !categoryData.is_listed } },
      { new: true }
    );

    res.json({ status: "success", categories: updatedCategory });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};


const loadEditCateg = async (req, res) => {
  try {
    const id = req.query.categid;
    const data = await category.findOne({ _id: id });

    if (!data) {
      req.flash("message", "Category not found");
      return res.redirect("/admin/editCateg");
    }

    res.render("editCateg", { categories: data });
  } catch (error) {
    console.log(error);
  }
};

const editCateg = async (req, res) => {
  try {
    const existingCategory = await category.findOne({
      name: req.body.categoryName.toUpperCase(),
    });

    if (existingCategory && existingCategory._id.toString() !== req.body.id) {
      req.flash("message", "Category already exists");
      return res.redirect("/admin/editCateg?categid=" + req.body.id);
    }

    await category.findByIdAndUpdate(
      { _id: req.body.id },
      {
        name: req.body.categoryName.toUpperCase(),
        description: req.body.description,
      }
    );
    res.redirect("/admin/categ");
  } catch (error) {
    console.log(error);
  }
};


const salesReport = async (req, res) => {
  try {
    const firstOrder = await order.find().sort({ createdAt: 1 })
    const lastOrder = await order.find().sort({ createdAt: -1 })

    const salesReport = await order.find({ "items.ordered_status": "delivered" })
      .populate("user_id")
      .populate("items.product_id")
      .sort({ createdAt: -1 })


    res.render('salesReport', {
      firstOrder: moment(firstOrder[0].createdAt).format("YYYY-MM-DD"),
      lastOrder: moment(firstOrder[0].createdAt).format("YYYY-MM-DD"),
      salesReport,
      moment
    })

  } catch (error) {
    console.error(error);

  }
}

const datePicker = async (req, res) => {
  try {
    const { startDate, endDate } = req.body
    const startDateObj = new Date(startDate)
    startDateObj.setHours(0, 0, 0, 0)
    const endDateObj = new Date(endDate)
    endDateObj.setHours(23, 59, 59, 999)

    const selectedDate = await order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDateObj,
            $lte: endDateObj,
          },
          "items.ordered_status": "delivered"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        }
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product_id",
          foreignField: "_id",
          as: "items.product"
        }
      },
      {
        $unwind: "$items.product",
      },
      {
        $group: {
          _id: "$_id",
          user: { $first: "$user" },
          delivery_address: { $first: "$delivery_address" },
          order_id: { $first: "$order_id" },
          date: { $first: "$date" },
          payment: { $first: "$payment" },
          items: { $push: "$items" }
        }
      }
    ])

    res.status(200).json({ selectedDate: selectedDate });
  } catch (error) {
    console.log(error);

  }

}

module.exports = {
  adminLogin,
  admindash,
  verifyLogin,
  logout,
  loadUser,
  updateUserStatus,
  loadCategory,
  loadAddCateg,
  addCateg,
  categoryStatus,
  loadEditCateg,
  editCateg,
  salesReport,
  datePicker
};
