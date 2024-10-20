const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PurchaseOrderSchema = new Schema({
    supplier: { type: String, required: true },
    item: {
        itemName: { type: String, required: true }, 
        quantity: { type: Number, required: true },
        cost: { type: Number, required: true },
        branchStored: {type: String, required: true}
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema); 
