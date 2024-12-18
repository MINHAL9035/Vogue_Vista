const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const moment = require('moment')
const User = require("../model/userModel");
const Category = require("../model/category");
const Products = require("../model/product");
const Randomstring = require("randomstring");
const userOTPVerification = require("../model/userOTPVerification");
const Cart = require('../model/cartModel')
const Order = require('../model/orderModel')
dotenv.config();

// ================hash Password==========================

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    res.redirect('/500')
  }
};

// ================Load SignUp==========================

const loadsignup = async (req, res) => {
  try {
    const referralCode = req.query.referralCode
    res.render("userSignup", { referralCode });
  } catch (err) {
    res.redirect('/500')
  }
};

// ================SignUp Post==========================

const verifySignup = async (req, res) => {
  const { username, email, mobileNumber, password, confirmPassword, referralCode } = req.body;

  if (referralCode) {
    req.session.referralCode = referralCode
  }

  // check password
  if (password !== confirmPassword) {
    req.flash("message", "password do not match ");
    res.redirect("/signup");
  }

  try {
    // exist user
    const existingUser = await User.findOne({
      $or: [
        { username: username },
        { email: email },
        { mobileNumber: mobileNumber },
      ],
    });
    if (existingUser) {
      const message = 'User credentials already used'
      return res.render('userSignup', { message, username, email, mobileNumber, password, confirmPassword })
    }

    // hash password
    const hashedPassword = await securePassword(password);
    const referralCode = generateReferralCode()

    // create new user
    const newUser = new User({
      username,
      email,
      mobileNumber,
      password: hashedPassword,
      verified: false,
      referralCode: referralCode
    });

    await newUser.save();

    sendOTPVerificationEmail(newUser, res);
  } catch (error) {
    res.redirect('/500')
  }
};

function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ================Send Otp==========================

const sendOTPVerificationEmail = async ({ email }, res) => {
  try {
    console.log("pass",process.env.USER_PASS);
    console.log("user",process.env.EMAIL_USER);
    
    
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.USER_PASS,
      },
    });
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    console.log("email:", email);
    console.log("from:", process.env.email_user);

    const hashedOtp = await bcrypt.hash(otp, 10);

    const expirationTimestamp = new Date(new Date().getTime() + 1 * 60 * 1000)

    const mailOptions = {
      from: process.env.email_user,
      to: email,
      subject: "verify your email",
      html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2 style="color: #007BFF;">Verify Your Email</h2>
                <p>Please use the following OTP to verify your email:</p>
                <div style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #007BFF;">${otp}</h3>
                </div>
                <p>This OTP is valid for a short period. Do not share it with anyone.</p>
                <p>If you did not request this verification, please ignore this email.</p>
                <P style="color: #007BFF;">From Vogue Vista </p>
            </div>
        `,
    };

    const newOtpVerification = new userOTPVerification({
      email,
      otp: hashedOtp,
      createdAt: new Date(),
      expiresAt: expirationTimestamp
    });

    // save otp record
    await newOtpVerification.save();
    await transporter.sendMail(mailOptions);

    res.redirect(`/Otp?email=${email}`);
  } catch (error) {
    console.log(error);

    res.redirect('/500')
  }
};

// ===========Load OtpPage=============================

const loadOtp = async (req, res) => {
  try {
    const email = req.query.email;


    res.render("otp", { email: email });
  } catch (error) {
    res.redirect('/500')
  }
};

// ===========verify otp=============================

const verifyOtp = async (req, res) => {
  try {
    const email = req.body.email;
    const otp = req.body.one + req.body.two + req.body.three + req.body.four;
    console.log("my body otp", otp);

    const user = await userOTPVerification.findOne({ email });

    // Check if the OTP has expired
    const currentTime = new Date();
    if (!user || currentTime > user.expiresAt) {
      res.render("otp", { message: "user not found or OTP has expired. Please request a new OTP." });
      return;
    }

    const { otp: hashedOtp } = user;
    const validOtp = bcrypt.compare(otp, hashedOtp);

    if (validOtp) {
      const userData = await User.findOne({ email });
      await User.findByIdAndUpdate(userData._id, { $set: { verified: true } });
      await userOTPVerification.deleteOne({ email });

      req.session.user_id = userData._id;
      if (req.session.referralCode) {
        await User.findOneAndUpdate(
          { referralCode: req.session.referralCode },
          {
            $inc: { wallet: 250 },
            $push: {
              walletHistory: {
                date: new Date(),
                amount: 250,
                reason: `Referral Bonus for refering ${userData.username}`
              }
            }
          }
        )
        await User.findOneAndUpdate(
          { _id: req.session.user_id },
          {
            $inc: { wallet: 50 },
            $push: {
              walletHistory: {
                date: new Date(),
                amount: 50,
                reason: "Welcome bonus for using referral link"
              }
            }
          }

        )
      }
      res.redirect("/home");
    } else {
      req.flash("message", "OTP is incorrect");
      res.redirect(`/Otp?email=${email}`);
    }
  } catch (error) {
    res.redirect('/500')
  }
};


// =================load login===========================

const loadlogin = async (req, res) => {
  try {
    res.render("userLogin");
  } catch (err) {
    res.redirect('/500')
  }
};

// ====================login post=========================

const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.render('userLogin', { message: 'User not found', email, password })
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.render('userLogin', { message: 'Password is incorrect', email, password })
    }

    if (user.is_blocked) {
      return res.render('userLogin', { message: 'You have been blocked. Contact the website for assistance.', email, password })
    }

    if (!user.verified) {
      return res.render('userLogin', { message: 'User not verified. Please verify your account', email, password })
    }

    req.session.user_id = user._id;
    res.redirect("/home");

  } catch (error) {
    res.redirect('/500')
  }
};

// ================login otpload==================

const loginOtp = async (req, res) => {
  try {
    res.render("loginOtp");
  } catch (error) {
    res.redirect('/500')
  }
};

// ===================login otpverify===============================

const verifyLoginOtp = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email: email });
    console.log("user:", user);
    if (!user) {
      req.flash("message", "email doesnot exist");
      res.redirect("/loginOtp");
    }
    sendOTPVerificationEmail(user, res);
  } catch (error) {
    res.redirect('/500')
  }
};

// ====================resend otp====================
const resendOtp = async (req, res) => {
  try {
    const email = req.body.email;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await userOTPVerification.deleteOne({ email: email });
    await sendOTPVerificationEmail(user, res);
  } catch (error) {
    res.redirect('/500')
  }
};


// ==============load home=============================

const loadhome = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.user_id });
    const cartCount = await Cart.countDocuments({ user_id: req.session.user_id });
    const products = await Products.find({});

    // Get top 10 most sold products
    const result = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product_id',
          totalQuantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    if (result.length === 0) {
      return res.render("home", { user: userData, products, cartCount, topSoldProducts: [] });
    }

    const productIds = result.map(item => item._id);
    const topSoldProducts = await Products.find({ _id: { $in: productIds } });


    const recentProducts = await Products.find({})
      .sort({ date: -1 })
      .limit(4);



    res.render("home", { user: userData, products, cartCount, topSoldProducts, recentProducts });
  } catch (error) {
    console.error('Error in loadhome:', error);
    res.redirect('/500');
  }
};


// ================logout=======================

const logout = async (req, res) => {
  try {
    req.session.user_id = null
    res.redirect("/");
  } catch (error) {
    res.redirect('/500')
  }
};

const loadShop = async (req, res) => {
  const ITEMS_PER_PAGE = 8;
  try {
    const user = await User.findOne({ _id: req.session.user_id });
    const categId = req.query.categid ? req.query.categid : "";
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;
    const sort = Number(req.query.sort);

    const query = {
      is_listed: true,
      $or: [{ name: { $regex: search, $options: "i" } }],
    };

    if (categId) {
      query.category = new mongoose.Types.ObjectId(categId);
    }

    let sortOption;

    if (sort === 1) {
      sortOption = { price: 1 }; // Low to High
    } else if (sort === -1) {
      sortOption = { price: -1 }; // High to Low
    } else {
      sortOption = { createdAt: -1 }; // Latest products
    }

    const products = await Products.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(ITEMS_PER_PAGE)
      .populate({
        path: "category",
        populate: {
          path: "offer",
          match: {
            startingDate: { $lte: new Date() },
            expiryDate: { $gte: new Date() },
          },
        },
      })
      .populate({
        path: "offer",
        match: {
          startingDate: { $lte: new Date() },
          expiryDate: { $gte: new Date() },
        },
      });

    const totalProductsCount = await Products.countDocuments(query);
    const totalPages = Math.ceil(totalProductsCount / ITEMS_PER_PAGE);

    const Categdata = await Category.find({});
    const listedCategory = Categdata.filter((categ) => categ.is_listed === true);
    const listedProduct = products.filter((product) =>
      product.is_listed && listedCategory.some((category) =>
        category.name === product.category.name && category.is_listed
      )
    );
    let categName = null;

    if (categId) {
      categName = await Category.findOne({ _id: categId });
    }

    res.render('shop', {
      Categories: listedCategory,
      products: listedProduct,
      user,
      search,
      currentPage: page,
      totalPages,
      sort,
      categId,
      categName: categName ? categName.name : "All Products",
      selectedCategoryId: categId,
    });
  } catch (error) {
    res.redirect('/500');
  }
};


const loadProduct = async (req, res) => {
  try {
    const productId = req.query.productid;
    const product = await Products.findOne({ _id: productId })
      .populate({
        path: "offer",
        match: {
          startingDate: { $lte: new Date() },
          expiryDate: { $gte: new Date() },
        },
      })
      .populate({
        path: "category",
        populate: {
          path: "offer",
          match: {
            startingDate: { $lte: new Date() },
            expiryDate: { $gte: new Date() },
          },
        },
      });

    let discountedPrice = 0;
    let discountPercentage = 0;

    if (product.offer) {
      discountedPrice = product.price - (product.price * product.offer.percentage / 100);
      discountPercentage = product.offer.percentage;
    } else if (product.category && product.category.offer) {
      discountedPrice = product.price - (product.price * product.category.offer.percentage / 100);
      discountPercentage = product.category.offer.percentage;
    }

    res.render("productDetails", {
      products: product,
      discountedPrice: discountedPrice.toFixed(0),
      discountPercentage: discountPercentage,
    });
  } catch (error) {
    res.redirect('/500')
  }
};



const loadAbout = async (req, res) => {
  try {
    res.render("about");
  } catch (error) {
    res.redirect('/500')
  }
};


const loadContact = async (req, res) => {
  try {
    res.render("contact");
  } catch (error) {
    res.redirect('/500')
  }
};

const loadUserProfile = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findOne({ _id: userId });
    res.render("userProfile", { user: userData });
  } catch (error) {
    res.redirect('/500')
  }
};


const loadUpdateProfile = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findOne({ _id: userId });
    res.render("userEditProfile", { user: userData });
  } catch (error) {
    res.redirect('/500')
  }
};


const updateUserProfile = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { username, mobileNumber } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: { username, mobileNumber, },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.redirect("/userProfile");
  } catch (error) {
    res.redirect('/500')
  }
};

const loadUserAddress = async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const user = await User.findOne({ _id: user_id });
    res.render("userAddress", { user });
  } catch (error) {
    res.redirect('/500')
  }
};

const userprofileAddAddress = async (req, res) => {
  try {
    try {
      const { name, houseName, phone, place, pincode, state } = req.body;
      const user = await User.findOne({ _id: req.session.user_id });

      if (!user) {
        return res.status(400).json({ success: false, message: "User not found" });
      }

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

      res.redirect("/userAddress");
    } catch (error) {
      res.redirect('/500')
    }
  } catch (error) {
    res.redirect('/500')
  }
};

const editAddress = async (req, res) => {
  try {
    const userid = req.session.user_id;
    console.log(userid);
    const { id, name, house, phone, pin, state } = req.body;
    const updatedUser = await User.findOneAndUpdate(
      { _id: userid, "address._id": id },
      {
        $set: {
          "address.$.name": name,
          "address.$.housename": house,
          "address.$.phone": phone,
          "address.$.pincode": pin,
          "address.$.state": state,
        },
      },
      { new: true } // Return the updated document
    );
    console.log(updatedUser, "here is your updated user");
    res.json({ edited: true });
  } catch (err) {
    res.redirect('/500')
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { Addid } = req.body;
    await User.updateOne({ _id: userId }, { $pull: { address: { _id: Addid } } });
    res.json({ deleted: true });
  } catch (err) {
    res.redirect('/500')
  }
};

const loadChangePassword = async (req, res) => {
  try {
    res.render("changePassword");
  } catch (error) {
    res.redirect('/500')
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.session.user_id;

    const user = await User.findById(userId);

    if (!user) {
      req.flash("message", "User not found");
      return res.redirect("/changePassword");
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      req.flash("message", "Old password doesn't match");
      return res.redirect("/changePassword");
    }

    if (newPassword !== confirmNewPassword) {
      req.flash("message", "Passwords don't match");
      return res.redirect("/changePassword");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { $set: { password: hashedPassword } });

    res.redirect("/userProfile");

  } catch (error) {
    res.redirect('/500')
  }
};

const loadForgetPassword = async (req, res) => {
  try {
    res.render("forget");
  } catch (error) {
    res.redirect('/500')
  }
};

const verifyForget = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });

    if (!userData) {
      req.flash("message", "Email is incorrect");
      return res.redirect("/forget");
    }

    const token = require("randomstring").generate();
    await User.updateOne({ email }, { $set: { token } });

    sendResetLink(userData.username, userData.email, token);

    req.flash("message", "Please check your email to reset your password");
    res.redirect("/forget");

  } catch (error) {
    res.redirect('/500')
  }
};

// send reset email
const sendResetLink = async (username, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: true,
      auth: {
        user: "mhdminhal44@gmail.com",
        pass: "suie nejw yksp ogll",
      },
    });

    const resetLink = `http://localhost:3001/resetForgetPass?token=${token}`;

    const mailOptions = {
      from: "mhdminhal44@gmail.com",
      to: email,
      subject: "Reset password",
      html: `
      <body style="font-family: Arial, sans-serif; margin: 20px; padding: 20px; background-color: #f4f4f4;">

    <p style="margin-bottom: 15px;">Hello ${username},</p>

    <p style="margin-bottom: 15px;">We received a request to reset your password for Vogue Vista account. Click the link below to reset your password:</p>
    
    <p style="margin-bottom: 15px;"><a href="${resetLink}" style="color: #007BFF; text-decoration: none; font-weight: bold;">Reset Your Password</a></p>

    <p style="margin-bottom: 15px;">If you didn't request a password reset or if you have any questions, please contact our support team.</p>

    <p>Best regards,<br>
    Vogue Vista Team</p>
</body>
      `,
    };
    await transporter.sendMail(mailOptions);

  } catch (error) {
    console.log(error);
  }
};

const loadResetForgetPass = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token });

    if (!tokenData) {
      return res.render("404", { message: "Token is Invalid" });
    }

    res.render("resetPassword", { user_id: tokenData._id });

  } catch (error) {
    res.redirect('/500')
  }
};

const verifyForgetPass = async (req, res) => {
  try {
    const { newPassword, confirmPassword, id: user } = req.body;
    const userData = await User.findOne({ _id: user });
    const oldPassword = await bcrypt.compare(newPassword, userData.password);

    if (oldPassword) {
      return res.render("resetPassword", {
        message: "New password must be different from old password",
        user_id: user,
      });
    }

    if (newPassword !== confirmPassword) {
      return res.render("resetPassword", {
        message: "New password and confirm password should match",
        user_id: user,
      });
    }

    const hashedNewPassword = await securePassword(newPassword);
    await User.findByIdAndUpdate({ _id: user }, { password: hashedNewPassword, token: "" });

    res.redirect("/login");
  } catch (error) {
    res.redirect('/500')
  }
};

const loadBlockedUser = async (req, res) => {
  try {

    res.render('blocked-user')

  } catch (error) {
    res.redirect('/500')

  }
}

const loadWallet = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.session.user_id })
    res.render('wallet', { user, moment })

  } catch (error) {
    res.redirect('/500')

  }
}

module.exports = {
  loadsignup,
  verifySignup,
  sendOTPVerificationEmail,
  loadOtp,
  verifyOtp,
  loadlogin,
  verifyLogin,
  loginOtp,
  verifyLoginOtp,
  resendOtp,
  loadhome,
  logout,
  loadShop,
  loadProduct,
  loadAbout,
  loadContact,
  loadUserProfile,
  loadUpdateProfile,
  updateUserProfile,
  loadUserAddress,
  userprofileAddAddress,
  editAddress,
  deleteAddress,
  loadChangePassword,
  changePassword,
  loadForgetPassword,
  verifyForget,
  loadResetForgetPass,
  verifyForgetPass,
  loadBlockedUser,
  loadWallet
};
