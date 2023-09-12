const mongoose=require("mongoose");
const config=require("./config");

const dbURL = config.db.url;

console.log(dbURL)
mongoose.connect(dbURL)
.then(()=>{
    console.log("Database is connected");
})
.catch((error)=>{
    console.log(error);
    process.exit(1);
})