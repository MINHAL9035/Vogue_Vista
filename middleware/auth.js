const user = require('../model/userModel')


const isLogin = async (req, res, next) => {
    try {
        console.log('heyboss', req.session.user_id);

        // Check if the user is logged in
        if (req.session.user_id) {
            if (req.path === '/login') {
                res.redirect('/home');
                return;
            }
            // Continue to the next middleware if the user is logged in
            next();
        } else {
            // If the user is not logged in, redirect to the home page
            res.redirect('/login');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = async (req, res, next) => {
    try {
        console.log('heyboss', req.session.user_id);

        // Check if the user is logged in
        if (req.session.user_id) {
            // If the user is logged in, redirect to '/home'
            res.redirect('/home');
            return;
        }

        // Continue to the next middleware if the user is logged out
        next();
    } catch (error) {
        console.log(error.message);
    }
}
const isBlocked = async (req, res, next) => {
    const userId = req.session.user_id
    if (userId) {
        try {
            const userData = await user.findOne({ _id: userId })
            if (userData && userData.is_blocked == true) {
                return res.redirect('/blocked-user')
            }


        } catch (error) {
            console.error(error)

        }

    }
    next()

}

module.exports = {
    isLogin,
    isLogout,
    isBlocked
}