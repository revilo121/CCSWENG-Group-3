const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransferOrderSchema = new Schema({
    sourceBranch: { type: String, required: true},
    destinationBranch: { type: String, required:true },
    items: [{
        itemName: { type: String, required: true }, 
        quantity: { type: Number, required: true },
    }], 
    transfername: { type: String, required: true, unique: true },
    status: { type: String },
    date: { type: Date, default: Date.now },
    
});

module.exports = mongoose.model('TransferOrder', TransferOrderSchema);
