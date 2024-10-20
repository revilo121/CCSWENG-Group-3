const mongoose = require('mongoose');
<<<<<<< HEAD
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
=======

const purchaseOrderSchema = new mongoose.Schema({
    orderNumber: { type: String, required: true },
    fullName: { type: String, required: true },
    supplier: { type: String, required: true },
    cost: { type: Number, required: true },
    arrivalDate: { type: Date, required: true }
});

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

module.exports = PurchaseOrder;
>>>>>>> 9f1041c9cab39ac7f1acaa76d5eac5c07d43d882
