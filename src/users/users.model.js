mongoose = require("mongoose")



const userSchema = new mongoose.Schema({
    username: {type: String,  unique: true },
    first_name: { type: String, unique: false, default:"John" },
    last_name: { type: String, unique: false, default:"Doe" },
    email: { type: String, unique: true },
    password: { type: String,  unique: false },
    token: { type: String },
})

module.exports = mongoose.model("user", userSchema)
