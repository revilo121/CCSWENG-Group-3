const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PurchaseOrderSchema = new Schema({
    supplier: { type: String, required: true },
    orderNumber: { type: String, required: true },
    items: [{
        itemName: { type: String, required: true }, 
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        amount: { type: Number, required: true },
        quantityReceived: { type: Number, default: 0 },
        branchStored: { type: String, required: true }
    }], 
    status: { type: String, enum: ['Pending', 'Approved', 'Completed'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);
