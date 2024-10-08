const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const supplierSchema = new Schema({
    name: {type: String,required: true,},
    address: {type: String,required: true,},
    contactNumber: {type: String,required: true, },
    personToContact: {type: String,required: true,}
}, { timestamps: true });

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;
