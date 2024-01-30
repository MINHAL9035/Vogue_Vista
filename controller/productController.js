const product = require("../model/product");
const Category = require("../model/category");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const category = require("../model/category");

const loadProducts = async (req, res) => {
  try {
    const products = await product.find({}).populate('category');
    res.render("products", { products });
  } catch (error) {
    console.log(error);
  }
};

const loadAddProduct = async (req, res) => {
  try {
    const category = await Category.find({ is_listed: true });
    res.render("addProduct", { category });
  } catch (error) {
    console.error(error);
  }
};

const addProduct = async (req, res) => {
  try {
    const { productName, description, quantity, price, category, brand, date } = req.body;

    const existProduct = await product.findOne({ name: productName });
    if (existProduct) {
      res.status(404).send({ message: "product already exist" });
    }

    const selectedCategory = await Category.findOne({ name: category });
    const categories = await Category.find({ is_listed: true });

    const allowedImageFormats = ['image/jpeg', 'image/png'];

    if (req.files.length !== 4 || req.files.some(file => !allowedImageFormats.includes(file.mimetype))) {
      return res.render("addProduct", { message: "Please upload 4 images of JPEG or PNG format", category: categories });
    }

    // resize and save each uploaded images
    const filenames = await Promise.all(req.files.map(async (file) => {
      const imagesPath = path.join(__dirname, "../public/sharpimages", file.filename);
      await sharp(file.path).resize(800, 1200, { fit: "fill" }).toFile(imagesPath);
      return file.filename;
    }));

    const newProduct = new product({
      name: productName,
      description,
      quantity,
      price,
      image: filenames,
      category: selectedCategory._id,
      brand,
      date,
    });

    await newProduct.save();
    res.redirect("/admin/product");

  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};


const productStatus = async (req, res) => {
  try {
    const productId = req.params.id;
    const productData = await product.findById(productId);

    if (!productData) {
      return res.status(404).send("Product not found");
    }

    const updatedProduct = await product.findByIdAndUpdate(
      productId,
      { $set: { is_listed: !productData.is_listed } },
      { new: true }
    );

    res.json({ status: "success", products: updatedProduct });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const loadEditProduct = async (req, res) => {
  try {
    const productId = req.query.productId;
    const categories = await Category.find({ is_listed: true });
    const productData = await product.findOne({ _id: productId }).populate("category");

    if (!productData) {
      req.flash("message", "product not found");
      return res.redirect(`/admin/editProduct?productId=${id}`);
    }
    res.render("editProduct", { products: productData, categ: categories });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const editProduct = async (req, res) => {
  try {
    const { id, productName, description, quantity, price, category, brand } = req.body;

    const existingProduct = await product.findById(id);
    const categories = await Category.find({ is_listed: true });

    // check if new image is added
    let imageData = [];

    if (req.files) {
      const allowedImageFormats = ['image/jpeg', 'image/png'];

      if (existingProduct.image.length + req.files.length !== 4 || req.files.some(file => !allowedImageFormats.includes(file.mimetype))) {
        req.flash("message", "Please upload 4 images of JPEG or PNG format");
        return res.redirect(`/admin/editProduct?productId=${id}`);
      }

      // Resize and save each uploaded image
      imageData = await Promise.all(req.files.map(async (file) => {
        const resizedPath = path.join(__dirname, "../public/sharpimages", file.filename);
        await sharp(file.path).resize(800, 1200, { fit: "fill" }).toFile(resizedPath);
        return file.filename;
      }));
    }

    // Find the category by name
    const selectedCategory = await Category.findOne({ name: category, is_listed: true });

    const updatedProduct = await product.findByIdAndUpdate(
      id,
      {
        name: productName,
        description,
        price,
        category: selectedCategory._id,
        quantity,
        brand,
        $push: { image: { $each: imageData } },
      },
      { new: true }
    );

    // Redirect back to the product page
    res.redirect("/admin/product");

  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }

};

const deleteImg = async (req, res) => {
  try {
    const { image, prdtId } = req.body;

    // Delete the image file
    fs.unlink(path.join(__dirname, "../public/sharpimages", image), () => { });

    // Remove the image from the product's image array
    await product.updateOne({ _id: prdtId }, { $pull: { image } });

    res.send({ success: true });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ success: false, error: error.message });
  }
};

module.exports = {
  loadProducts,
  loadAddProduct,
  addProduct,
  productStatus,
  loadEditProduct,
  editProduct,
  deleteImg,
};
