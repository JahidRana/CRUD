const {createUser,getAllUsers,deleteUser,getSingleUsers,updateUser,deleteMultiUser,getPage,getSearchIteam} =require('../controllers/test.controller');

const route=require("express").Router();


route.get("/search",getSearchIteam);
route.get("/",getAllUsers);
route.post("/",createUser);
route.get("/:id",getSingleUsers);
route.delete("/:id",deleteUser);
route.delete("/api/deleteDocs/",deleteMultiUser);
route.patch("/:id",updateUser);
route.get("/api/pagination",getPage);



module.exports=route;