const express=require("express")
const userRouter=express.Router()
const {getCurrentUser,updateAssistant,askToAssistant}=require("../controllers/usercontroller")
const isAuth=require("../middlewares/isAuth")
const upload=require("../middlewares/multer")

userRouter.get("/current",isAuth,getCurrentUser);
userRouter.post("/update",isAuth,upload.single("assistantImage"),updateAssistant)
userRouter.post("/asktoassistant",isAuth,askToAssistant)
    

module.exports=userRouter