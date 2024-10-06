const express = require('express'); 
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');

const routes = require('./routes/routes'); 

const app = express(); 
const PORT = process.env.PORT || 3500;


mongoose.connect('mongodb://localhost:27017/dbconnect', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB!'))
    .catch(err => console.error('MongoDB connection error:', err));


app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));


app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, 'public')));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use('/', routes);


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
