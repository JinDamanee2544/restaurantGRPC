// mongoose model

const mongoose = require("mongoose");

const MenuSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        default: "",
    },
    price: {
        type: Number,
        default: 0,
        min: 0,
        required: true,
    },
});

module.exports = mongoose.model("Menu", MenuSchema);
