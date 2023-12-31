const isLogin = async (req, res, next) => {
    try {
        console.log('heyboss', req.session.user_id);

        // Check if the user is logged in
        if (req.session.user_id) {
            // If the user is logged in and trying to access the '/login' route, redirect to '/home'
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

module.exports = {
    isLogin,
    isLogout
}