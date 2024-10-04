const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
  res.render('index'); 
});


router.post('/login', (req, res) => {
  
  if (/* login successful */) {
    req.session.isAuthenticated = true; 
    res.redirect('/dashboard');
  } else {
    req.flash('error', 'Invalid username or password');
    res.redirect('/');
  }
});

// Dashboard route 
router.get('/dashboard', (req, res) => {
  if (req.session.isAuthenticated) {
    
    res.render('dashboard');
  } else {
    req.flash('error', 'You need to be logged in to access the dashboard');
    res.redirect('/');
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;