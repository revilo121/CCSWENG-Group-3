const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PurchaseOrderSchema = new Schema({
    supplier: { type: String },
    orderNumber: { type: String, default: 1 },
    items: [{
        itemName: { type: String }, 
        quantity: { type: Number },
        cost: { type: Number },
        amount: { type: Number },
        received: { type: Boolean, default: false },
        quantityReceived: { type: Number, default: 0 },
        branchStored: { type: String, default: "Main" }
    }], 
    status: { type: String, enum: ['Pending', 'Closed'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now },
    expectedOn: {type: Date},
    deliveryCost: { type: Number, default: 20},
    totalCost: {type: Number, default: 0}
});


PurchaseOrderSchema.pre('save', function (next) {
    this.totalCost = this.items.reduce((sum, item) => sum + (item.amount || 0), 0) + (this.deliveryCost || 0);

    const allItemsReceived = this.items.every(item => item.received === true);
    this.status = allItemsReceived ? 'Closed' : 'Pending';

    next();
});

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);
