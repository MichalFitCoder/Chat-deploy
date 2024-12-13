const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {type: String, required: true, maxLength: 30},
    email: {
        encryptedData: { 
            type: String, 
            required: true, 
            unique: true  
        },
        iv: { 
            type: String, 
            required: true 
        },
    },
    password: {type: String, required: true, minLength: 8, maxLength: 100},
    publicKey: {type: String, required: true, maxLength: 200},
}, {
    timestamps: true 
});

userSchema.index({ 'email.encryptedData': 1 }, { unique: true });

const userModel = mongoose.model("User", userSchema);
module.exports = userModel;