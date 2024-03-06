const express = require('express');
const router = express.Router();
const {User} = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.get(`/`, async (req, res) => {
    const users = await User.find()
    if (!users) {
        res.status(500).json({success: false})
    }
    res.send(users);
})

router.post(`/`, (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country
    });

    user.save().then((createdUser) => {
        res.status(201).json(createdUser);
    }).catch((err) => {
        res.status(500).json({
            error: err,
            success: false
        })
    });
})

router.post('/login', async (req, res) => {
    const user = await User.findOne({email: req.body.email})

    if (!user) {
        return res.status(400).send('The user not found')
    }

    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        const secret = process.env.SECRET;
        const token = jwt.sign(
            {
                userId: user.id,
                isAdmin: user.isAdmin
            },
            secret,
            {expiresIn: '1d'}
        )

        res.status(200).send({user: user.email, token: token})
    }
})

router.get(`/count`, async (req, res) => {
    const userCount = await User.countDocuments((count) => count)
    if (!userCount) {
        res.status(500).json({success: false})
    }
    res.send({
        userCount: userCount
    });
})

router.delete('/:id', (req, res) => {
    User.findByIdAndDelete(req.params.id).then(user => {
        if (user) {
            return res.status(200).json({
                success: true,
                message: 'The user is deleted!'
            })
        } else {
            return res.status(404).json({
                success: false,
                message: 'user not found!'
            })
        }
    }).catch(err => {
        return res.status(400).json({success: false, error: err})
    })
})
module.exports = router;
