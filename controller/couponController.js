const coupon = require('../model/couponModel')
const User = require('../model/userModel')
const moment = require('moment')

// ================ Show Coupon ===============================
const loadCoupon = async (req, res) => {
    try {
        const coupons = await coupon.find({})
        res.render('coupon', { coupons: coupons })
    } catch (error) {
        console.log(error);

    }
}

const loadAddCoupon = async (req, res) => {
    try {
        res.render('addCoupon')
    } catch (error) {
        console.error(error)

    }
}

const addCoupon = async (req, res) => {
    try {
        console.log("my coupon", req.body);
        const { couponName, Code, description, availability, Minimum, discount, Expiry } = req.body

        const couponData = new coupon({
            couponName: couponName,
            couponCode: Code,
            discountAmount: discount,
            minAmount: Minimum,
            couponDescription: description,
            availability: availability,
            expiryDate: Expiry,
            status: true
        })

        await couponData.save()
        res.redirect('/admin/coupons')

    } catch (error) {
        console.error(error);

    }
}

// ===================== Block Coupon ============================

const blockCoupon = async (req, res) => {
    try {
        const coupons = await coupon.findOne({ _id: req.query.id })
        if (coupons.status == true) {
            await coupon.updateOne({ _id: req.query.id }, { $set: { status: false } })
        } else {
            await coupon.updateOne({ _id: req.query.id }, { $set: { status: true } })
        }
        res.json({ success: true })

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });


    }
}

// =====================load edit coupon page ===============================

const loadEditCoupon = async (req, res) => {
    try {
        const couponData = await coupon.findOne({ _id: req.query.id })
        res.render('editCoupon', { coupon: couponData })

    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Internal server error' });

    }
}

// ===============================edit Coupon===============================

const editCoupon = async (req, res) => {
    try {
        const { couponName, Code, description, availability, Minimum, discount, Expiry } = req.body

        const updated = await coupon.updateOne(
            { _id: req.query.id },
            {
                $set: {
                    couponName: couponName,
                    couponCode: Code,
                    discountAmount: discount,
                    minAmount: Minimum,
                    couponDescription: description,
                    availability: availability,
                    expiryDate: Expiry,

                }
            }
        )
        res.redirect('/admin/coupons')

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });

    }
}

// ==========================delete Coupon=====================

const deleteCoupon = async (req, res) => {
    try {
        const couponId = req.body.id
        await coupon.deleteOne({ _id: couponId })

        res.json({ success: true })

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// ========================apply Coupon===========================
const applyCoupon = async (req, res) => {
    try {
        const code = req.body.code;
        const amount = Number(req.body.amount);
        req.session.code = code;

        // Check if the coupon is used by the user
        const userExist = await coupon.findOne({
            couponCode: code,
            "userUsed.user_id": req.session.user_id
        });

        if (userExist) {
            return res.json({ user: true });
        }

        // Retrieve coupon data
        const couponData = await coupon.findOne({ couponCode: code });

        if (!couponData) {
            return res.json({ invalid: true });
        }

        // Check if the minimum amount condition is met
        if (couponData.minAmount >= amount) {
            return res.json({ maxAmount: true });
        }

        // Calculate discount amount and total
        const disAmount = couponData.discountAmount;
        const disTotal = Math.round(amount - disAmount);

        console.log("my disAmount:", disAmount);
        console.log("my distotal:", disTotal);

        return res.json({ amountOkey: true, disAmount, disTotal });

    } catch (error) {
        console.error('Error applying coupon:', error);
        return res.json({ success: false, message: 'Internal server error.' });
    }
};




module.exports = {
    loadCoupon,
    loadAddCoupon,
    addCoupon,
    blockCoupon,
    loadEditCoupon,
    editCoupon,
    deleteCoupon,
    applyCoupon
}