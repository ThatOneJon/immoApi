mongoose = require("mongoose")



const userSchema = new mongoose.Schema({
    username: {type: String, default: "John DOE", unique: false },
    first_name: { type: String, unique: false },
    last_name: { type: String, unique: false },
    email: { type: String, unique: true },
    password: { type: String,  unique: false },
    token: { type: String },
})

module.exports = mongoose.model("user", userSchema)
