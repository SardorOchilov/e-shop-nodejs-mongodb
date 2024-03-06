const express = require('express');
const router = express.Router();
const {Category} = require('../models/category');
const {Product} = require('../models/product');
const mongoose = require('mongoose');
const multer = require('multer');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');
        if (isValid) {
            uploadError = null
        }
        cb(uploadError, 'public/uploads/')
    },
    filename: (req, file, cb) => {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${file.fileName}-${Date.now()}.${extension}`)
    }
})

const uploadOptions = multer({storage: storage});

router.get(`/`, async (req, res) => {
    let filter = {};
    if (req.query.categories) {
        filter = {category: req.query.categories.split(',')}
    }
    const products = await Product.find(filter).populate('category');

    if (!products) {
        res.status(500).json({success: false})
    }

    res.send(products);
})

router.get('/:id', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id')
    }
    const product = await Product.findById(req.params.id).populate('category');

    if (!product) {
        res.status(500).json({message: 'The product with the given ID was not found.'})
    }

    res.send(product);
})

router.post(`/`, (req, res) => {
    const category = Category.findById(req.body.categoryId);

    if (!category) {
        return res.status(400).send('Invalid Category')
    }

    const file = req.file;
    if (!file) {
        return res.status(400).send('No image in the request')
    }
    
    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    const product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        images: `${basePath}${fileName}`,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        image: req.body.image,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
        dateCreated: req.body.dateCreated
    });

    product.save().then((createdProduct) => {
        res.status(201).json(createdProduct);
    }).catch((err) => {
        res.status(500).json({
            error: err,
            success: false
        })
    });
})

router.put('/:id', async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).send('Invalid Product Id')
        }

        const category = Category.findById(req.body.categoryId);
        if (!category) {
            return res.status(400).send('Invalid Category')
        }
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                description: req.body.description,
                richDescription: req.body.richDescription,
                images: req.body.images,
                brand: req.body.brand,
                price: req.body.price,
                category: req.body.category,
                image: req.body.image,
                countInStock: req.body.countInStock,
                rating: req.body.rating,
                numReviews: req.body.numReviews,
                isFeatured: req.body.isFeatured,
                dateCreated: req.body.dateCreated
            },
            {new: true}
        )

        if (!product) {
            return res.status(404).send('the product cannot be updated!')
        }
        return res.send(product);
    }
)

router.delete('/:id', (req, res) => {
    Product.findByIdAndRemove(req.params.id).then(product => {
        if (product) {
            return res.status(200).json({
                success: true,
                message: 'the product is deleted!'
            })
        } else {
            return res.status(404).json({
                success: false,
                message: 'product not found!'
            })
        }
    }).catch(err => {
        return res.status(400).json({success: false, error: err})
    })
})


router.get('/get/count', async (req, res) => {
    const productCount = await Product.countDocuments();

    if (!productCount) {
        res.status(500).json({success: false})
    }

    res.send({
        productCount: productCount
    });
})

router.get('/get/featured/:count', async (req, res) => {
    const count = req.params.count ? req.params.count : 0;
    const products = await Product.find({isFeatured: true}).limit(+count)

    if (!products) {
        res.status(500).json({success: false})
    }
    return res.send(products);
})
module.exports = router;
