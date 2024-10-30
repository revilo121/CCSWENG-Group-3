const express = require('express'); 
const User = require('../models/user');
const Branch = require('../models/branch');
const Item = require('../models/item');
const PurchaseOrder = require('../models/purchaseorder');
const History = require('../models/history');
const Supplier = require('../models/supplier');
const router = express.Router(); 
const bcrypt = require('bcryptjs');
const { select } = require('cjs');




router.get('/', (req, res) => {
  res.redirect('login')
});

router.get('/supplier', async (req, res) => {

  const selectedBranch = req.session.selectedBranch || 'Main'; // Default to 'Main' if none selected
  const branches = await Branch.find({}, 'name');
  const suppliers = await Supplier.find({});
  console.log(suppliers);
  try {
    res.render('supplier', {
      currentRoute: '/supplier',
      username: req.session.username,
      role: req.session.role,
      selectedBranch: selectedBranch,
      branches: branches,
      suppliers
    });
  } catch (error) {
      console.error('Error fetching suppliers:', error);
      res.status(500).send('Server Error');
  }
});

router.post('/add-supplier', async (req, res) => {
  try {
    // Extract form data from request body
    const { name, address, contactNumber, personToContact } = req.body;
    const existingSupplier = await Supplier.findOne({ name: name });

    if (existingSupplier) {
      return res.status(400).json({ message: 'This supplier already exists in the system.' });
    }

    // Create a new Supplier instance
    const newSupplier = new Supplier({
      name,
      address,
      contactNumber,
      personToContact
    });

    // Save the supplier to the database
    await newSupplier.save();
    console.log('Supplier successfully added.');

    // Set branch for the history log
    const selectedBranch = req.session.selectedBranch || 'Main';

    // Create a new History log entry for adding the supplier
    const historyLog = new History({
      actionCategory: 'Suppliers',
      actionBy: req.session.username, // Assuming user information is stored in req.session
      actionType: 'Create',
      actionDetails: `New Supplier: ${name}`, // Log details about the supplier
      date: new Date(),
      branch: selectedBranch
    });

    // Save the history log to the database
    await historyLog.save();

    
  } catch (err) {
    console.error('Error adding supplier:', err);
    res.status(500).send('Server Error');
  }
});

router.post('/update-supplier', async (req, res) => {
  const { _id, name, address, contactNumber, personToContact } = req.body;

  try {
    // Find the existing supplier by _id
    const existingSupplier = await Supplier.findById(_id);

    if (!existingSupplier) {
      return res.status(404).json({ message: 'Supplier not found.' });
    }

    // Keep track of changes for history logging
    let actionDetails = `Updated Supplier: ${existingSupplier.name}\nChanges:\n`;

    // Compare the fields and log changes
    if (existingSupplier.name !== name) actionDetails += `- Name: ${existingSupplier.name} ➡️ ${name}\n`;
    if (existingSupplier.address !== address) actionDetails += `- Address: ${existingSupplier.address} ➡️ ${address}\n`;
    if (existingSupplier.contactNumber !== contactNumber) actionDetails += `- Contact Number: ${existingSupplier.contactNumber} ➡️ ${contactNumber}\n`;
    if (existingSupplier.personToContact !== personToContact) actionDetails += `- Contact Person: ${existingSupplier.personToContact} ➡️ ${personToContact}\n`;

    // Update the supplier with new values
    existingSupplier.name = name;
    existingSupplier.address = address;
    existingSupplier.contactNumber = contactNumber;
    existingSupplier.personToContact = personToContact;

    // Save the updated supplier
    const updatedSupplier = await existingSupplier.save();
    const selectedBranch = req.session.selectedBranch || 'Main';

    // Create a new history log entry
    const historyLog = new History({
      actionCategory: 'Suppliers',
      actionBy: req.session.username, // Assuming user information is stored in req.session
      actionType: 'Update',
      actionDetails: actionDetails,
      date: new Date(),
      branch: selectedBranch
    });

    // Save the history log
    await historyLog.save();

    res.status(200).json({ message: 'Supplier updated successfully.', supplier: updatedSupplier });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ message: 'An error occurred while updating the supplier.' });
  }
});


router.delete('/delete-supplier', async (req, res) => {
  const { _id } = req.body;

  try {
    // Find the existing supplier by _id
    const existingSupplier = await Supplier.findByIdAndDelete(_id);

    if (!existingSupplier) {
      return res.status(404).json({ message: 'Supplier not found.' });
    }

    // Keep track of supplier details for history logging before deletion
    const actionDetails = `Deleted Supplier: ${existingSupplier.name}\n` +
                          `- Address: ${existingSupplier.address}\n` +
                          `- Contact Number: ${existingSupplier.contactNumber}\n` +
                          `- Contact Person: ${existingSupplier.personToContact}\n`;

    
    const selectedBranch = req.session.selectedBranch || 'Main';

    // Create a new history log entry
    const historyLog = new History({
      actionCategory: 'Suppliers',
      actionBy: req.session.username, // Assuming user information is stored in req.session
      actionType: 'Delete',
      actionDetails: actionDetails,
      date: new Date(),
      branch: selectedBranch
    });

    // Save the history log
    await historyLog.save();

    res.status(200).json({ message: 'Supplier deleted successfully.' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ message: 'An error occurred while deleting the supplier.' });
  }
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

router.get('/manageacc', async (req, res) => {
  try {
      // Fetch all users from the database
      const users = await User.find();

      // Render the 'accmanager' view, passing the users data to the template
      res.render('accmanager', { users });
  } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
  }
});

router.post('/submit-account', async (req, res) => {
  console.log('Creating Account...');
  const { username, password, role } = req.body;
  const selectedBranch = req.session.selectedBranch || 'Main';

  try {
      // Check for existing user
      const existingUser = await User.findOne({ username });
      if (existingUser) {
          return res.status(400).send('Username already exists');
      }

      // Create new user
      const newUser = new User({
          username,
          password,
          role
      });

      // Save to database
      await newUser.save();

      const historyLog = new History({
        actionCategory: 'Accounts',
        actionBy: req.session.username, // Assuming user information is stored in req.user
        actionType: 'Create',
        actionDetails: `New User: ${ username }`, // For new item added
        date: new Date(),
        branch: selectedBranch
      });
      
      await historyLog.save();

      // Redirect after successful creation
      res.redirect('manageacc');
      
  } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
  }
});

router.post('/change-role/:username', async (req, res) => {
  const { username } = req.params;
  const { newRole } = req.body;

  try {
      const user = await User.findOne({ username });
      if (!user) {
          return res.status(404).send('User not found');
      }

      user.role = newRole;
      await user.save();
      const selectedBranch = req.session.selectedBranch || 'Main';
      const historyLog = new History({
        actionCategory: 'Accounts',
        actionBy: req.session.username, // Assuming user information is stored in req.user
        actionType: 'Update',
        actionDetails: `Change Role of ${ username } into ${ newRole }`, // For new item added
        date: new Date(),
        branch: selectedBranch
      });
      
      await historyLog.save();

      res.redirect('/manageacc'); 
  } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
  }
});

router.post('/delete-user/:username', async (req, res) => {
  try {

      const deletedUser = req.params.username;

      await User.findOneAndDelete({ username: req.params.username });
      

      const selectedBranch = req.session.selectedBranch || 'Main';
      const historyLog = new History({
        actionCategory: 'Accounts',
        actionBy: req.session.username, // Assuming user information is stored in req.user
        actionType: 'Delete',
        actionDetails: `Deleted User: ${ deletedUser } `, // For new item added
        date: new Date(),
        branch: selectedBranch
      });
      await historyLog.save();


      res.redirect('/manageacc'); // After deletion, redirect back to account manager
  } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
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

router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page
    const pageSize = 10; // Page size
    const branches = await Branch.find({}, 'name');
    const selectedBranch = req.session.selectedBranch || 'Main'; // Default to 'Main' if none selected

    // Fetch filter parameters
    const selectedUser = req.query.user || ''; // Action By filter
    const selectedActionType = req.query.actionType || ''; // Action Type filter
    const selectedDateRange = req.query.dateRange || ''; // Date Range filter

    // Build query object for filters
    const query = { branch: selectedBranch }; // Ensure it only shows actions from the selected branch
    
    if (selectedUser) {
      query.actionBy = selectedUser; // Filter by Action By
    }
    if (selectedActionType) {
      query.actionType = selectedActionType; // Filter by Action Type
    }

    // Apply Date Range filter
    const now = new Date();
    if (selectedDateRange === 'today') {
      query.date = {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
      };
    } else if (selectedDateRange === 'this-week') {
      const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      query.date = { $gte: firstDayOfWeek };
    } else if (selectedDateRange === 'this-month') {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      query.date = { $gte: firstDayOfMonth };
    }

    // Fetch total actions count for pagination
    const totalActions = await History.countDocuments(query);

    // Fetch history actions with pagination and sorting
    const historyActions = await History.find(query)
                                        .sort({ date: -1 })
                                        .skip((page - 1) * pageSize)
                                        .limit(pageSize);

    // Fetch unique usernames for the Action By dropdown
    const users = await History.distinct('actionBy', { branch: selectedBranch }); // Filter by branch

    // Calculate total pages for pagination
    const totalPages = Math.ceil(totalActions / pageSize);

    // Render the history page with filters
    res.render('history', {
      branches,
      historyActions,
      currentPage: page,
      totalPages,
      users, // Send users to the view for Action By dropdown
      selectedUser,
      selectedActionType,
      selectedDateRange,
      selectedBranch, // Pass the selected branch to the view
      username: req.session.username,
      role: req.session.role
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


router.get('/dashboard', async (req, res) => {
  try {
    const branches = await Branch.find({}, 'name');  // Fetch all branch names
    const selectedBranch = req.session.selectedBranch || 'Main';
    let query = { branchStored: selectedBranch };
    let inventory = await Item.find(query);

    // Set the selected branch, defaulting to 'Main' if none is selected
    

    // For Inventory Summary in Dashboard
    const outOfStockCount = inventory.filter(item => item.quantity === 0).length;
    const lowStockCount = inventory.filter(item => item.quantity > 0 && item.quantity <= item.lowStockThreshold).length;
    const sufficientStockCount = inventory.filter(item => item.quantity > item.lowStockThreshold).length;

    // For History Box in Dashboard
    const latestHistory = await History.find( {branch: selectedBranch} )
                                       .sort({ date: -1 })
                                       .limit(5);

    // Render the dashboard and pass branches and selectedBranch to the sidebar partial
    res.render('dashboard', {
      branches,
      selectedBranch,  // This is the selected branch or default 'Main'
      currentRoute: '/dashboard',
      username: req.session.username,
      role: req.session.role,
      outOfStockCount,
      lowStockCount,
      sufficientStockCount,
      latestHistory
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
    const selectedBranch = req.session.selectedBranch || 'Main';
    
    const historyLog = new History({
      actionCategory: 'Inventory',
      actionBy: req.session.username, // Assuming user information is stored in req.user
      actionType: 'Create',
      actionDetails: `New Item: ${name}`, // For new item added
      date: new Date(),
      branch: selectedBranch
    });
    
    await historyLog.save();

    // Redirect or send a response after successful save
    res.redirect('/inventory'); // Redirect to your inventory page or any relevant page
  } catch (err) {
    console.error('Error adding item:', err);
    res.status(500).send('Server Error');
  }
});

router.post('/update-item', async (req, res) => {
  const { _id, name, category, price, quantity, lowStockThreshold, measurementUnit, branchStored } = req.body;

  try {
    // Find the existing item by _id and branch
    const existingItem = await Item.findById(_id);

    if (!existingItem) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    // Keep track of changes for history logging
    let actionDetails = `Updated Item: ${existingItem.name} (${existingItem.category})\nChanges:\n`;

    // Compare the fields and log changes
    if (existingItem.name !== name) actionDetails += `- Name: ${existingItem.name} ➡️ ${name}\n`;
    if (existingItem.category !== category) actionDetails += `- Category: ${existingItem.category} ➡️ ${category}\n`;
    if (existingItem.price !== price) actionDetails += `- Price: ₱${existingItem.price} ➡️ ₱${price}\n`;
    if (existingItem.quantity !== quantity) actionDetails += `- Quantity: ${existingItem.quantity} ➡️ ${quantity}\n`;
    if (existingItem.lowStockThreshold !== lowStockThreshold) actionDetails += `- Low Stock Threshold: ${existingItem.lowStockThreshold} ➡️ ${lowStockThreshold}\n`;
    if (existingItem.measurementUnit !== measurementUnit) actionDetails += `- Measurement Unit: ${existingItem.measurementUnit} ➡️ ${measurementUnit}\n`;

    // Update the item with new values
    existingItem.name = name;
    existingItem.category = category;
    existingItem.price = price;
    existingItem.quantity = quantity;
    existingItem.lowStockThreshold = lowStockThreshold;
    existingItem.measurementUnit = measurementUnit;

    // Save the updated item
    const updatedItem = await existingItem.save();
    const selectedBranch = req.session.selectedBranch || 'Main';

    // Create a new history log entry
    const historyLog = new History({
      actionCategory: 'Inventory',
      actionBy: req.session.username, // Assuming user information is stored in the session
      actionType: 'Update',
      actionDetails: actionDetails,
      date: new Date(),
      branch: selectedBranch
    });

    // Save the history log
    await historyLog.save();

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
    const deletedItem = await Item.findOneAndDelete({ name, branchStored });

    if (!deletedItem) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    // Log deletion in history
    const actionDetails = `Deleted Item: ${deletedItem.name} (${deletedItem.category}) from branch: ${branchStored}`;
    const selectedBranch = req.session.selectedBranch || 'Main';

    const historyLog = new History({
      actionCategory: 'Inventory',
      actionBy: req.session.username, // Assuming user information is stored in the session
      actionType: 'Delete',
      actionDetails: actionDetails,
      date: new Date(),
      branch: selectedBranch
    });

    // Save the history log
    await historyLog.save();

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
    const oldQuantity = item.quantity;
    item.quantity = newQuantity;
    await item.save();

    // Log stock adjustment in history
    const actionDetails = `Stock Adjusted for Item: ${item.name} (${item.category})\n`
      + `Quantity: ${oldQuantity} ➡️ ${newQuantity} (${adjustment > 0 ? '+' : ''}${adjustment})`;

    const selectedBranch = req.session.selectedBranch || 'Main';

    const historyLog = new History({
      actionCategory: 'Inventory',
      actionBy: req.session.username, // Assuming user information is stored in the session
      actionType: 'Stock Adjustment',
      actionDetails: actionDetails,
      date: new Date(),
      branch: selectedBranch
    });

    // Save the history log
    await historyLog.save();

    // Respond with the updated item
    res.status(200).json(item);
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});


router.get('/purchaseorder', async (req, res) => {
  if (req.session.isAuthenticated) {
    const branches = await Branch.find({}, 'name'); 
    const selectedBranch = req.session.selectedBranch || 'Main';
    const searchTerm = req.query.search || ''; 
    const sortBy = req.query.sortBy || ''; 

    let itemQuery = {
      branchStored: selectedBranch, 
      name: { $regex: searchTerm, $options: 'i' } 
    };

    const latestOrder = await PurchaseOrder.findOne().sort({ orderNumber: -1 });
    const nextOrderNumber = latestOrder ? Number(latestOrder.orderNumber) + 1 : 1;

    let items = await Item.find(itemQuery);
    const purchaseorder = await PurchaseOrder.find({}).populate('items.itemName'); 

    if (sortBy === 'alphabetical') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price-asc') {
      items.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      items.sort((a, b) => b.price - a.price);
    }

    res.render('purchaseorder', {
      currentRoute: '/purchaseorder',
      username: req.session.username,
      role: req.session.role,
      branches,
      selectedBranch,
      items, 
      searchTerm,
      purchaseorder, 
      sortBy,
      nextOrderNumber
    });
  } else {
    res.redirect('/');
  }
});

router.get('/purchaseorder/:id', async (req, res) => {
  try {
      const orderId = req.params.id;
      const order = await PurchaseOrder.findById(orderId).populate('items.itemName');
      
      if (!order) {
          return res.status(404).json({ message: 'Order not found' });
      }
      
      res.json(order);
  } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/purchaseorder/:id', async (req, res) => {
  try {
      const orderId = req.params.id;
      const updatedData = req.body;

      const updatedOrder = await PurchaseOrder.findByIdAndUpdate(orderId, updatedData, { new: true });

      if (!updatedOrder) {
          return res.status(404).json({ message: 'Order not found' });
      }

      res.json(updatedOrder);
  } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

router.put('/purchaseorder/:orderId/items/:itemId/receive', async (req, res) => {
  try {
      const { orderId, itemId } = req.params;

      const purchaseOrder = await PurchaseOrder.findById(orderId);
      if (!purchaseOrder) {
          return res.status(404).json({ message: 'Purchase Order not found.' });
      }

      const item = purchaseOrder.items.id(itemId);
      if (!item) {
          return res.status(404).json({ message: 'Item not found.' });
      }

      if (item.received) {
          return res.status(400).json({ message: 'Item has already been marked as received.' });
      }

      item.received = true;

      item.quantityReceived = item.quantity; 

      const allReceived = purchaseOrder.items.every(i => i.received);
      if (allReceived) {
          purchaseOrder.status = 'Closed'; 
      }

      await purchaseOrder.save();

      res.json(purchaseOrder); 
  } catch (err) {
      console.error('Error marking item as received:', err);
      res.status(500).send('Server Error');
  }
});



router.post('/add-purchase-order', async (req, res) => {
  try {

    console.log('Form Data: ', req.body);
    const { supplier, orderNumber, items, expectedOn } = req.body; 

    const purchaseItems = [];
    for (let item of items) {
      const { itemName, quantity, cost } = item;

      const foundItem = await Item.findOne({ name: itemName });
      if (!foundItem) {
        return res.status(400).json({ message: `Item '${itemName}' not found.` });
      }

      purchaseItems.push({
        itemName,
        quantity,
        cost,
        amount: (cost * quantity).toFixed(2),
        received: false,
        quantityReceived: 0,
        branchStored: foundItem.branchStored,
      });
    }

    const purchaseOrder = new PurchaseOrder({
      supplier,
      orderNumber, 
      items: purchaseItems,
      status: 'Pending',
      createdAt: new Date(),
      expectedOn: new Date(expectedOn), 
    });

    await purchaseOrder.save();
    console.log('Purchase Order successfully added.');

    res.redirect('/purchaseorder');
  } catch (err) {
    console.error('Error adding purchase order:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router; 
