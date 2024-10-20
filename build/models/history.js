const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HistorySchema = new Schema({
    actionCategory: { type: String, required: true }, //Inventory, Purchase Order, Transfer Order
    actionBy: { type: String, required: true }, //username of user who did the action
    actionType: { type: String, required: true }, //Create, Update, Delete, Approve (For purchase order only) 
    actionDetails: {type: String, required: true}, // 
    date: {type: Date, required: true}
  });
  
  
  module.exports = mongoose.model('History', HistorySchema);