const mongoose=require("mongoose");

const userSchema=mongoose.Schema({

    name:{
        type:String,
        required: true
    },
    email:{
        type:String,
        required: true
    },
    address:{
        type:String,
        required: true
    },
    phone:{
        type:String,
        required: true
    },
    public_id:{
        type:String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    createdOn:{
        type:Date,
        default:Date.now
    },
})

module.exports=mongoose.model("user",userSchema);