const offer = require('../model/offerModel')
const categories = require('../model/category')
const products = require('../model/product')
const moment = require('moment')
const { Touchscreen } = require('puppeteer')

const loadOffers = async (req, res) => {
    try {
        const offers = await offer.find({})
        res.render('offers', { offers, moment })

    } catch (error) {
        console.error(error);

    }
}

const loadAddOffer = async (req, res) => {
    try {
        res.render('addOffer')

    } catch (error) {
        console.error(error);

    }
}

const addOffer = async (req, res) => {
    try {
        const { name, startingDate, expiryDate, percentage } = req.body;

        const offerExist = await offer.findOne({ name: name })

        if (offerExist) {
            res.render('addOffer', { message: "offer already exist" })
        } else {
            const offers = new offer({
                name: name,
                startingDate: startingDate,
                expiryDate: expiryDate,
                percentage: percentage
            })
            await offers.save()

            res.redirect('/admin/offers')
        }

    } catch (error) {
        console.error(error);

    }
}

const applyProductOffer = async (req, res) => {
    try {
        const { offerId, productId } = req.body
        await products.updateOne({ _id: productId }, { $set: { offer: offerId } })

        await products.find({ _id: productId })
        res.json({ success: true })

    } catch (error) {
        console.error(error);

    }
}

const removeProductOffer = async (req, res) => {
    try {
        const { productId } = req.body
        await products.updateOne({ _id: productId }, { $unset: { offer: "" } })
        res.json({ success: true })

    } catch (error) {
        console.error(error);

    }
}

const applyCategoryOffer = async (req, res) => {
    try {
        const { offerId, categoryId } = req.body
        await categories.updateOne({ _id: categoryId }, { $set: { offer: offerId } })

        res.json({ success: true })

    } catch (error) {
        console.error(error);

    }
}

const removeCategoryOffer = async (req, res) => {
    try {
        const { categoryId } = req.body
        await categories.updateOne({ _id: categoryId }, { $unset: { offer: "" } })
        res.json({ success: true })

    } catch (error) {
        console.error(error);

    }
}



const deleteOffer = async (req, res) => {
    try {
        const offerId = req.body.id
        await offer.deleteOne({ _id: offerId })
        res.json({ success: true })

    } catch (error) {
        console.error(error);

    }

}

module.exports = {
    loadOffers,
    loadAddOffer,
    addOffer,
    applyProductOffer,
    removeProductOffer,
    applyCategoryOffer,
    removeCategoryOffer,
    deleteOffer

}