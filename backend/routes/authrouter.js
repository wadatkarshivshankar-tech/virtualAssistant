const express=require("express");
const authRouter=express.Router();
const {signUp,login,logout}=require("../controllers/authcontroller")

authRouter.post("/signUp",signUp);
authRouter.post("/login",login);
authRouter.post("/logout",logout);

module.exports=authRouter;