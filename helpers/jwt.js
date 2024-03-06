const {expressjwt} = require('express-jwt');

function authJwt() {
    const secret = process.env.SECRET
    return expressjwt({
        secret,
        algorithms: ['HS256'],
        isRevoked: isRevoked
    }).unless({
        path: [{
            url: /\/app\/v1\/products(.*)/,
            methods: ['GET', 'OPTIONS']
        }, {
            url: /\/app\/v1\/categories(.*)/,
            methods: ['GET', 'OPTIONS']
        }, '/app/v1/users/login', '/app/v1/users/register']
    })
}

async function isRevoked(req, payload, done) {
    if (!payload.isAdmin) {
        done(null, true)
    }

    done();
}

module.exports = authJwt;
