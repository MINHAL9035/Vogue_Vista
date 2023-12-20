const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
const User = require('../model/userModel')
const Category = require('../model/category')
const Products = require('../model/product')

const userOTPVerification = require('../model/userOTPVerification')
dotenv.config()

const loadhome = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id })
        res.render('home', { user: userData })
    }
    catch (err) {
        console.log(err);
    }

}

const loadlogin = async (req, res) => {
    try {
        res.render("userLogin")
    }
    catch (err) {
        console.log(err);
    }
}

const verifyLogin = async (req, res) => {

    try {
        const { email, password } = req.body
        const user = await User.findOne({ email: email })
        console.log('user:', user);

        if (!user) {
            req.flash('message', 'user not found')
            res.redirect('/login')
            // res.render('userLogin',{ message: 'User not Found' })
        }
        const passwordMatch = await bcrypt.compare(password, user.password)
        if (!passwordMatch) {
            req.flash('message', 'password do not match ')
            res.redirect('/login')
        }
        req.session.user_id = user._id
        console.log(req.session.user_id);
        res.redirect('/')
    }
    catch (error) {
        console.log(error);
    }
}

const loadsignup = async (req, res) => {
    try {
        res.render('userSignup')
    }
    catch (err) {
        console.log(err);
    }
}

const verifySignup = async (req, res) => {
    const { username, email, mobileNumber, password, confirmPassword } = req.body



    // check password
    if (password !== confirmPassword) {
        req.flash('message', 'password do not match ')
        res.redirect('/signup')
    }

    try {
        // hash password
        const hashedPassword = await bcrypt.hash(password, 10)
        // create new user
        const newUser = new User({
            username,
            email,
            mobileNumber,
            password: hashedPassword,
            verified: false,
        })

        await newUser.save()

        sendOTPVerificationEmail(newUser, res);
    }
    catch (error) {
        console.log(error);
        req.flash('message', 'Internal server Error')
        res.redirect('/signup')
    }
}

const sendOTPVerificationEmail = async ({ email }, res) => {
    try {
        // const { email } = req.body
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: true,
            auth: {
                user: process.env.email_user,
                pass: 'hztv uavn vwnp hcby',
            }
        })
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`
        console.log('email:', email);
        console.log('from:', process.env.email_user);
        const mailOptions = {
            from: process.env.email_user,
            to: email,
            subject: 'verify your email',
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
        }

        // hash otp
        const saltrounds = 10

        const hashedOtp = await bcrypt.hash(otp, saltrounds)
        const newOtpVerification = await new userOTPVerification({
            email: email,
            otp: hashedOtp,
            createdAt: new Date(),
        })

        // save otp record
        await newOtpVerification.save()
        await transporter.sendMail(mailOptions)

        res.redirect(`/Otp?email=${email}`)

    }
    catch (error) {
        console.log(error.meassage);
        return res.status(500).send('Internal Server Error');

    }
}

const loadOtp = async (req, res) => {
    try {
        const email = req.query.email;
        res.render('otp', { email: email });

    }
    catch (error) {
        console.log(error);

    }
}

const verifyOtp = async (req, res) => {
    try {
        const email = req.body.email
        console.log('email:', req.body.email);
        const otp = req.body.one + req.body.two + req.body.three + req.body.four;



        const user = await userOTPVerification.findOne({ email: email })
        console.log('user:', user);

        if (!user) {
            res.render('otp', { message: "otp expired" });
        }

        const { otp: hashedOtp } = user;

        const validOtp = await bcrypt.compare(otp, hashedOtp);
        console.log(validOtp);

        if (validOtp === true) {

            const userData = await User.findOne({ email: email })
            await User.findByIdAndUpdate({ _id: userData._id }, { $set: { verified: true } })
            await userOTPVerification.deleteOne({ email: email });

            req.session.user_id = userData._id
            res.redirect('/home');

        } else {
            req.flash('message', "otp is inncorrect")
            res.redirect('/otp')
        }

    } catch (error) {
        console.log(error);
    }

}

const loginOtp = async (req, res) => {
    try {
        res.render('loginOtp')
    } catch (error) {
        console.log(error);

    }
}

const verifyLoginOtp = async (req, res) => {
    try {
        const email = req.body.email
        const user = await User.findOne({ email: email })
        console.log('user:', user);
        if (!user) {
            // res.status(400).send({ error: 'email doesnot exist' })
            req.flash('message', "email doesnot exist")
            res.redirect('/loginOtp')
        }
        sendOTPVerificationEmail(user, res)
        res.redirect(`/Otp?email=${email}`)
    } catch (error) {
        console.log(error);

    }
}

const logout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/')


    } catch (error) {
        console.log(error);

    }
}


const loadShop = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.user_id })
        const categId = req.query.categid
        let products = [];

        if (categId) {
            const categoryId = new mongoose.Types.ObjectId(categId);
            products = await Products.find({ category: categoryId }).populate('category');
        } else {
            products = await Products.find({}).populate('category');
        }

        const Categdata = await Category.find({});
        const listedCategory = Categdata.filter((categ) => categ.is_listed === false);
        const listedProduct = products.filter((product) => {
            const isProductListed = product.is_listed === false;

            const productCategory = listedCategory.find((category) =>
                category.name === product.category.name && category.is_listed === false
            );

            return isProductListed && productCategory;
        });

        console.log(products.length);

        res.render('shop', {
            Categories: listedCategory,
            products: listedProduct,
            user,
        });

    } catch (error) {
        console.log(error);
    }
};


const loadProduct = async (req, res) => {
    try {
        const productId = req.query.productid
        // const Categdata = await Category.find({ is_listed: 0 })
        const data = await Products.findOne({ _id: productId })
        res.render('productDetails', { products: data })
        console.log(data);
    } catch (error) {
        console.log(error);

    }
}

const loadAbout = async (req, res) => {
    try {
        res.render('about')

    } catch (error) {
        console.log(error);

    }
}

const loadContact = async (req, res) => {
    try {
        res.render('contact')

    } catch (error) {
        console.log(error);

    }
}

module.exports = {
    loadhome,
    loadlogin,
    loadsignup,
    verifySignup,
    sendOTPVerificationEmail,
    loadOtp,
    verifyOtp,
    verifyLogin,
    loginOtp,
    verifyLoginOtp,
    logout,
    loadShop,
    loadProduct,
    loadAbout,
    loadContact
}                    