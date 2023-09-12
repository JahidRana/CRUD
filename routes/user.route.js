const {createUsers,getAllUsers,getSingleUsers,deleteUser,updateUsers } = require("../controllers/user.controller");

const route=require("express").Router();


route.get("/",getAllUsers);
route.post("/",createUsers);
route.get("/:id",getSingleUsers);
route.delete("/:id",deleteUser);
route.patch("/:id",updateUsers);



module.exports=route;