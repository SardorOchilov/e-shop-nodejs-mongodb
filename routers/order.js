const express = require('express');
const router = express.Router();
const {Order} = require('../models/order');
const {Category} = require("../models/category");
const {OrderItem} = require("../models/order-item");

router.get(`/`, async (req, res) => {
    const orders = await Order.find().sort({'dateOrdered': -1}).populate('user', 'name')
    if (!orders) {
        res.status(500).json({success: false})
    }
    res.send(orders);
})


router.get(`/:id`, async (req, res) => {
    const orders = await Order.findById(req.params.id).populate('user', 'name').populate({
        path: 'OrderItems',
        populate: {path: 'product', populate: 'category'}
    })
    if (!orders) {
        res.status(500).json({success: false})
    }
    res.send(orders);
})

router.post('/', async (req, res) => {
    const orderItemsIds = Promise.all(req.body.orderItems.map(async (orderItem) => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        })

        newOrderItem = await newOrderItem.save();

        return newOrderItem._id;
    }))
    const orderItemsIdsResolved = await orderItemsIds;

    const TotalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId) => {
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        const totalPrice = orderItem.product.price * orderItem.quantity;

        return totalPrice;
    }))

    const totalPrice = TotalPrices.reduce((a, b) => a + b, 0);

    let order = new Order({
        OrderItems: orderItemsIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user,
        dateOrdered: req.body.dateOrdered
    });

    order.save().then((createdCategory) => {
        res.status(201).json(order);
    }).catch((err) => {
        res.status(500).json({
            error: err,
            success: false
        })
    })
})

router.put('/:id', async (req, res) => {
    const order = await Order.findByIdAndUpdate(req.params.id, {
        status: req.body.status
    }, {
        new: true
    })

    if (!order) {
        res.status(500).json({success: false})
    }
    res.send(order);
})

router.delete('/:id', (req, res) => {
    Order.findByIdAndDelete(req.params.id).then(async order => {
        if (order) {
            order.OrderItems.map(async orderItem => {
                await OrderItem.findByIdAndDelete(orderItem)
            })
            return res.status(200).json({
                success: true,
                message: 'The order is deleted'
            })
        } else {
            return res.status(404).json({
                success: false,
                message: 'order not found'
            })
        }
    }).catch(err => {
        return res.status(400).json({
            success: false,
            error: err
        })
    })
})

router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([
        {$group: {_id: null, totalsales: {$sum: '$totalPrice'}}}
    ])

    if (!totalSales) {
        res.send(400).json('The order sales cannot be generated')
    }

    res.send({totalsales: totalSales.pop().totalsales})
})

router.get('/get/totalsales', async (req, res) => {
    const totalCounts = await Order.countDocuments((count) => count)

    if (!totalCounts) {
        res.send(500).json('The order sales cannot be generated')
    }

    res.send({totalcounts: totalSales.pop().totalsales})
})

router.get('/userorders/:userid', async (req, res) => {
    const userOrdersList = await Order.find({user: req.params.userid}).populate({
        path: 'OrderItems',
        populate: {path: 'product', populate: 'category'}
    }).sort({'dateOrdered': -1})

    if (!userOrdersList) {
        res.send(500).json('The order sales cannot be generated')
    }

    res.send(userOrdersList)
})

module.exports = router;
