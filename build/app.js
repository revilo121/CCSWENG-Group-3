const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();   



app.set('view engine', 'ejs');


app.use(express.static(path.join(__dirname, 'public')));


app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.render('index');
});


app.listen(3000, () => {
  console.log('Server listening on port 3000');
});