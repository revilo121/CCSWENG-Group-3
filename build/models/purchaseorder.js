const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
    orderNumber: { type: String, required: true },
    fullName: { type: String, required: true },
    supplier: { type: String, required: true },
    cost: { type: Number, required: true },
    arrivalDate: { type: Date, required: true }
});

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

module.exports = PurchaseOrder;
