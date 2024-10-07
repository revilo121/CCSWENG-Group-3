const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Operations Manager', 'Front Team Member', 'Purchaser'] }
});


 const User = mongoose.model('user', UserSchema);


module.exports = User;