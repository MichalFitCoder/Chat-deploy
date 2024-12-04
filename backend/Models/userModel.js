const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
    name: {type: String, required: true, maxlenght: 30},
    email: {type: String, required: true, maxlenght: 100, unique:true},
    password: {type: String, required: true, minlenght: 8, maxlenght: 50},
},{
    timestamps: true
}
);

const userModel = mongoose.model("User", userSchema);
module.exports = userModel;