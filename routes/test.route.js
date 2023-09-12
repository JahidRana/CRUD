const {createUser,getAllUsers,deleteUser,getSingleUsers,updateUser} =require('../controllers/test.controller');

const route=require("express").Router();



route.get("/",getAllUsers);
route.post("/",createUser);
route.get("/:id",getSingleUsers);
route.delete("/:id",deleteUser);
route.patch("/:id",updateUser);

module.exports=route;