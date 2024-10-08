const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    quantityInStock: { type: Number, required: true },
    lowStockThreshold: { type: Number, required: true }, 
    measurementUnit: { type: String, required: true },  
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true,},
    addedBy: { type: String, required: true }, 
    editedBy: { type: String }, 
    inventoryHistory: [{
      date: { type: Date, default: Date.now },
      activity: { type: String }, 
      quantityChanged: { type: Number },
      changedBy: { type: String }  
    }]
  });
  
  
  module.exports = mongoose.model('Product', ProductSchema);