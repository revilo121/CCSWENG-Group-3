const express = require('express'); 
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const cookieParser = require('cookie-parser');


const routes = require('./routes/routes'); 

const app = express(); 
const PORT = process.env.PORT || 3500;


const dbURL = 'mongodb+srv://julrquirante:MioOpFVk8eEnFpay@cluster0.df7qo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
mongoose.connect(dbURL)
.then(() => {
    console.log("Connected to Database");
})
.catch(() => {
    console.log("Failed to connect to the Database");
})

const User = require('./models/user');
const Branch = require('./models/branch');
const Item = require('./models/item');
const PurchaseOrder = require('./models/purchaseorder');


app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use((req, res, next) => {
    res.locals.currentRoute = req.path;
    next();
});


app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, 'public')));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use('/', routes);


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
