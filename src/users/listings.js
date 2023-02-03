mongoose = require("mongoose")

const listingSchema = new mongoose.Schema({
    title : {type: String, required : true}, 
    squareMeters : {type: Number, required : true},
    price: {type:Number, required : true},
    city: {type: String},
    image:{type: String},
    description: {type: String}
})

module.exports = mongoose.model("listing", listingSchema)