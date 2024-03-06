const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv/config');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');

const port = 3000;
const api = process.env.API_URL;

app.use(cors())
app.options('*', cors())

const productsRoutes = require('./routers/product');
const ordersRoutes = require('./routers/order');
const usersRoutes = require('./routers/user');
const categoriesRoutes = require('./routers/category');

// middlewares
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use(errorHandler);
// Routers
app.use(`${api}/products`, productsRoutes)
app.use(`${api}/orders`, ordersRoutes)
app.use(`${api}/users`, usersRoutes)
app.use(`${api}/categories`, categoriesRoutes)

mongoose.connect(process.env.CONNACTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'vertual-harid'
}).then(() => {
    console.log('Database connection is ready');
}).catch((err) => {
    console.log('Database connection is failed', err)
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
