const express = require('express'); 
const User = require('../models/user');
const router = express.Router(); 
const bcrypt = require('bcryptjs');


router.get('/', (req, res) => {
  res.redirect('login')
});


router.get('/login', (req, res) => {
  let errors = []
  res.render('login', { errors });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  let errors = []
  console.log(username);
  try {
    
    const user = await User.findOne({ username })

    if(!user) {
      errors.push({ msg : 'User not found.'});
      return res.render('login', {
      errors
    });
    }
  

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      errors.push({ msg : 'Password incorrect.'});
      return res.render('login', {
        errors
      });
    }

    req.session.user = user;
    req.session.username = user.username;
    req.session.role = user.role;
    req.session.isAuthenticated = true;
    res.redirect('/dashboard')


  }catch (err) {
    console.error(err);
    return res.status(500).send('Server error');
  }

});


router.get('/dashboard', (req, res) => {
  if (req.session.isAuthenticated) {
      const store = req.query.store || 'default'; 
      res.render('dashboard', { store, currentRoute: '/dashboard' } ); 
  } else {
      res.redirect('/'); 
  }
});

router.get('/inventory', (req, res) => {
  console.log("inventory request")
  const store = req.query.store || 'default'; 
  res.render('inventory', { store, currentRoute: '/inventory' } ); 
});
// Logout route

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router; 
