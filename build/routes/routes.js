const express = require('express'); 
const User = require('../models/user');
const Branch = require('../models/branch');
const Item = require('../models/item');
const PurchaseOrder = require('../models/purchaseorder');
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


router.get('/api/item/name/:name', async (req, res) => {
  try {
      const item = await Item.findOne({ name: req.params.name });
      if (item) {
          res.json(item);
      } else {
          res.status(404).send('Item not found');
      }
  } catch (error) {
      res.status(500).send('Server error');
  }
});

router.get('/inventory', async (req, res) => {
  if (req.session.isAuthenticated) {
    const branches = await Branch.find({}, 'name');
    const selectedBranch = req.session.selectedBranch || 'Main';
    const searchTerm = req.query.search || '';
    const sortBy = req.query.sortBy || '';
    const filterBy = req.query.filterBy || '';
    const categoryFilter = req.query.category || ''; // Category filter

    // Fetch unique categories
    const categories = await Item.distinct('category');

    // Build query based on search, sorting, and filtering
    let query = {
      branchStored: selectedBranch,
      name: { $regex: searchTerm, $options: 'i' } // Case-insensitive search
    };

    if (categoryFilter) {
      query.category = categoryFilter; // Apply category filter
    }

    let inventory = await Item.find(query);

    // Sort inventory
    if (sortBy === 'alphabetical') {
      inventory.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price-asc') {
      inventory.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      inventory.sort((a, b) => b.price - a.price);
    }

    const outOfStockCount = inventory.filter(item => item.quantity === 0).length;
    const lowStockCount = inventory.filter(item => item.quantity > 0 && item.quantity <= item.lowStockThreshold).length;
    const sufficientStockCount = inventory.filter(item => item.quantity > item.lowStockThreshold).length;

    res.render('inventory', {
      currentRoute: '/inventory',
      username: req.session.username,
      role: req.session.role,
      branches,
      selectedBranch,
      inventory,
      categories, // Send categories to the view
      sortBy,
      filterBy,
      categoryFilter,
      outOfStockCount,
      lowStockCount,
      sufficientStockCount
    });
  } else {
    res.redirect('/');
  }
});



router.post('/add-item', async (req, res) => {
  try {
    // Extract the form data from the request body
    console.log('Form Data: ', req.body)
    const { name, category, quantity, price, lowStockThreshold,  measurementUnit, branchStored} = req.body;
    const existingItem = await Item.findOne({ name: name, branchStored: branchStored });

        if (existingItem) {
            return res.status(400).json({ message: 'An item with this name already exists in the inventory.' });
        }
    
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

router.post('/update-item', async (req, res) => {
  const { name, category, price, quantity, lowStockThreshold, measurementUnit, branchStored } = req.body;

  try {
    // Assuming you are using Mongoose to interact with MongoDB
    const updatedItem = await Item.findOneAndUpdate(
      { name: name, branchStored: branchStored }, // Find the item by name and branch
      { name, category, price, quantity, lowStockThreshold, measurementUnit }, // Fields to update
      { new: true } // Return the updated document
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    res.status(200).json({ message: 'Item updated successfully.', item: updatedItem });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'An error occurred while updating the item.' });
  }
});

// DELETE route for deleting an item
router.delete('/delete-item', async (req, res) => {
  const { name, branchStored } = req.body;  // Assuming you're sending name and branch

  try {
    const deletedItem = await Item.findOneAndDelete({ name: name, branchStored: branchStored });

    if (!deletedItem) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    res.status(200).json({ message: 'Item deleted successfully.' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'An error occurred while deleting the item.' });
  }
});

router.get('/search-item', async (req, res) => {
  const searchTerm = req.query.q.toLowerCase();
  console.log("Searching Item...")

  try {
     
      const items = await Inventory.find({
          $or: [
              { name: { $regex: searchTerm, $options: 'i' } },
              { category: { $regex: searchTerm, $options: 'i' } }
          ]
      });

      res.json(items);  // Return matched items
  } catch (error) {
      console.error('Error searching items:', error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/purchaseorders', async (req, res) => {
  const { orderNumber, fullName, supplier, cost, arrivalDate } = req.body;

  try {
      const newOrder = new PurchaseOrder({
          orderNumber,
          fullName,
          supplier,
          cost,
          arrivalDate
      });

      await newOrder.save();
      res.status(201).json({ message: 'Purchase Order created successfully!' });
  } catch (error) {
      res.status(500).json({ message: 'Failed to create purchase order', error });
  }
});

router.post('/stock-adjust', async (req, res) => {
  const { name, branchStored, adjustment } = req.body;

  // Validate input
  if (!name || !branchStored || typeof adjustment !== 'number') {
      return res.status(400).json({ message: 'Invalid request data.' });
  }

  try {
      // Find the item
      const item = await Item.findOne({ name, branchStored });

      if (!item) {
          return res.status(404).json({ message: 'Item not found.' });
      }

      // Calculate the new quantity
      const newQuantity = item.quantity + adjustment;

      if (newQuantity < 0) {
          return res.status(400).json({ message: 'Resulting stock cannot be negative.' });
      }

      // Update the item's quantity
      item.quantity = newQuantity;
      await item.save();

      // Respond with the updated item
      res.status(200).json(item);
      
  } catch (error) {
      console.error('Error adjusting stock:', error);
      res.status(500).json({ message: 'Server error.' });
  }
});

router.get('/purchaseorders', async (req, res) => {
  try {
      const orders = await PurchaseOrder.find();
      res.json(orders); // Return the orders as JSON
  } catch (error) {
      res.status(500).json({ message: 'Failed to fetch purchase orders', error });
  }
});
/*
router.get('/purchaseorder', async (req, res) => {
  if (req.session.isAuthenticated) {
      const store = req.query.store || 'default'; 
      const branches = await Branch.find({}, 'name');
      const selectedBranch = req.session.selectedBranch || 'Main';
      const inventory = await Item.find({ branchStored: selectedBranch });
      const outOfStockCount = inventory.filter(item => item.quantity === 0).length;
      const lowStockCount = inventory.filter(item => item.quantity > 0 && item.quantity <= item.lowStockThreshold).length;
      const sufficientStockCount = inventory.filter(item => item.quantity > item.lowStockThreshold).length;
      
      try {
          const purchaseOrders = await Item.find({ branchStored: selectedBranch });
          res.render('purchaseorder', { 
              currentRoute: '/purchaseorder', 
              purchaseOrders: purchaseOrders,
              username: req.session.username, 
              role: req.session.role, 
              branches, 
              selectedBranch,
              outOfStockCount,
              lowStockCount,
              sufficientStockCount

          }); 
      } catch (error) {
          console.error(error);
          res.status(500).send("Error fetching purchase orders.");
      }

  } else {
      res.redirect('/'); 
  }
});
*/



router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router; 
