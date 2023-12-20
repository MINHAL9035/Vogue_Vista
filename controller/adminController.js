const User = require('../model/userModel')
const bcrypt = require('bcrypt')
const category = require('../model/category')

const adminLogin = async (req, res) => {
    try {
        res.render('adminLogin')

    } catch (error) {
        console.log(error);

    }
}

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email
        const password = req.body.password
        const userData = await User.findOne({ email: email })
        console.log("adminid:", email);
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password)

            if (passwordMatch) {
                if (userData.is_admin === 1) {
                    res.redirect('/admin/')
                }
            }
        }
        else {
            req.flash('message', 'admin not found')
            res.redirect('/admin/adminLogin')

        }

    } catch (error) {
        console.log(error);

    }
}

const admindash = async (req, res) => {
    try {
        res.render('admin')

    } catch (error) {
        console.log(error);

    }
}

const logout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/admin/adminLogin')

    } catch (error) {
        console.log(error);

    }
}

const loadUser = async (req, res) => {
    try {
        const usersData = await User.find({ is_admin: 0 })
        res.render('userManagement', { users: usersData })

    } catch (error) {
        console.log(error);

    }
}

const updateUserStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const userData = await User.findById(userId);

        if (!userData) {
            return res.status(404).send('User not found');
        }

        let updatedUser;
        if (userData.is_blocked) {
            updatedUser = await User.findByIdAndUpdate(userId, { $set: { is_blocked: false } }, { new: true });
        } else {
            updatedUser = await User.findByIdAndUpdate(userId, { $set: { is_blocked: true } }, { new: true });
        }

        res.send({ status: 'success', user: updatedUser });
    } catch (error) {
        console.log(error);
    }
};

const loadCategory = async (req, res) => {
    try {
        const categData = await category.find({})
        res.render('category', { categ: categData })
    } catch (error) {
        console.log(error);

    }
}

const loadAddCateg = async (req, res) => {
    try {
        res.render('addCateg')

    } catch (error) {
        console.log(error);

    }
}

const addCateg = async (req, res) => {
    try {
        const existCategory = await category.findOne({ name: req.body.categoryName })
        if (existCategory) {
            req.flash('message', "Category already exist")
            res.redirect('/admin/addCateg')
        } else {
            const { categoryName, description } = req.body
            // new categ
            const newCateg = new category({
                name: categoryName,
                description,
            })
            await newCateg.save()
            res.redirect('/admin/categ')

        }
    } catch (error) {
        console.log(error);
    }
}

const categoryStatus = async (req, res) => {
    try {
        const categoryId = req.params.id
        const categoryData = await category.findById(categoryId)
        if (!categoryData) {
            return res.status(404).send('category not found')
        }

        let updatedCategory;
        if (categoryData.is_listed) {
            updatedCategory = await category.findByIdAndUpdate(categoryId, { $set: { is_listed: false } }, { new: true })
        } else {
            updatedCategory = await category.findByIdAndUpdate(categoryId, { $set: { is_listed: true } }, { new: true })
        }
        res.send({ status: 'success', categories: updatedCategory })
    } catch (error) {
        console.log(error);

    }
}

const loadEditCateg = async (req, res) => {
    try {
        const id = req.query.categid
        const data = await category.findOne({ _id: id })
        if (!data) {
            return res.status(404).send("Category not found");
        }
        res.render('editCateg', { categories: data })
    } catch (error) {
        console.log(error);

    }
}

const editCateg = async (req, res) => {
    try {
        await category.findByIdAndUpdate({ _id: req.body.id }, { name: req.body.categoryName, description: req.body.description })
        res.redirect('/admin/categ')
    }
    catch (error) {
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

} 