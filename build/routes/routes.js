const express = require('express'); 
const router = express.Router(); 


router.get('/', (req, res) => {
  res.render('login'); 
});


router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
 
  if (username && password) {
    req.session.isAuthenticated = true;
    res.redirect('/storeselect'); 
  } else {
    
    res.redirect('/'); 
  }
});


router.get('/storeselect', (req, res) => {
  if (req.session.isAuthenticated) {
    res.render('storeselect'); 
  } else {
    res.redirect('/'); 
  }
});


router.post('/select-store', (req, res) => {

  res.redirect('/dashboard'); 
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
  res.redirect('/');
});

module.exports = router; 
