const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true }, //Price per Unit
    quantity: { type: Number, required: true },
    lowStockThreshold: { type: Number, required: true }, 
    measurementUnit: { type: String, required: true },  
    branchStored: {type: String, required: true}
  });
  
  
  module.exports = mongoose.model('Item', ItemSchema);