const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  mobileNumber: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  is_admin: {
    type: Number,
    default: 0,
  },
  verified: {
    type: Boolean,
  },
  is_blocked: {
    type: Boolean,
    default: false,
  },
  token: {
    type: String,
    default: ''
  },
  address: [
    {
      name: {
        type: String,
      },
      housename: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      phone: {
        type: Number,
      },
      pincode: {
        type: Number,
      },
    },
  ],
  wallet: {
    type: Number,
    default: 0
  },
  walletHistory: [{
    date: {
      type: Date
    },
    amount: {
      type: Number,
    },
    reason: {
      type: String,
    }

  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
