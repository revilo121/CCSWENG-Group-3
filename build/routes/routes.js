const express = require('express'); 
const User = require('../models/user');
const Branch = require('../models/branch');
const Item = require('../models/item');
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
  const { username, password} = req.body;
  

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

router.post('/select-branch', (req, res) => {
  const { selectedBranch } = req.body;
  
  // Store the selected branch in the session
  req.session.selectedBranch = selectedBranch;
  console.log("branch: ");
  console.log(selectedBranch);

  // Redirect back to the dashboard or the same page
  res.redirect(req.get('referer'));
});


router.get('/dashboard', async (req, res) => {
  try {
    const branches = await Branch.find({}, 'name');  // Fetch all branch names

    // Set the selected branch, defaulting to 'Main' if none is selected
    const selectedBranch = req.session.selectedBranch || 'Main';

    // Render the dashboard and pass branches and selectedBranch to the sidebar partial
    res.render('dashboard', {
      branches,
      selectedBranch,  // This is the selected branch or default 'Main'
      currentRoute: '/dashboard',
      username: req.session.username,
      role: req.session.role
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


router.get('/inventory', async (req, res) => {
  if (req.session.isAuthenticated) {
    const branches = await Branch.find({}, 'name');  // Fetch all branch names

    
    

    // Set the selected branch, defaulting to 'Main' if none is selected
    const selectedBranch = req.session.selectedBranch || 'Main';
    const inventory = await Item.find({ branchStored: selectedBranch });
    const outOfStockCount = inventory.filter(item => item.quantity === 0).length;
    const lowStockCount = inventory.filter(item => item.quantity > 0 && item.quantity <= item.lowStockThreshold).length;
    const sufficientStockCount = inventory.filter(item => item.quantity > item.lowStockThreshold).length;
    res.render('inventory', 
      {currentRoute: '/inventory', 
        username: req.session.username, 
        role: req.session.role, 
        branches, 
        selectedBranch, 
        inventory: inventory,
        outOfStockCount,
        lowStockCount,
        sufficientStockCount } ); 
  } else {
    res.redirect('/')
  }
  
});

router.post('/add-item', async (req, res) => {
  try {
    // Extract the form data from the request body
    console.log('Form Data: ', req.body)
    const { name, category, quantity, price, lowStockThreshold,  measurementUnit, branchStored} = req.body;
    
    console.log('Added to Branch: ', branchStored);
    // Create a new Item instance
    const newItem = new Item({
      name,
      category,
      quantity,
      price,
      lowStockThreshold,
      measurementUnit,
      branchStored,
  
    });

    // Save the item to the database
    await newItem.save();
    console.log('Item successfully added.');

    // Redirect or send a response after successful save
    res.redirect('/inventory'); // Redirect to your inventory page or any relevant page
  } catch (err) {
    console.error('Error adding item:', err);
    res.status(500).send('Server Error');
  }
});


router.get('/purchaseorder', (req, res) => {
  if (req.session.isAuthenticated) {
      const store = req.query.store || 'default'; 
      res.render('purchaseorder', {currentRoute: '/purchaseorder' } ); 
  } else {
      res.redirect('/'); 
  }
});


router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router; 
