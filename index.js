require('dotenv').config();
const config  = require('./config/config');
const app=require("./app");
const PORT=config.app.port;

app.listen(PORT,()=>{
    console.log(`Server running at http://localhost:${PORT}`)
})