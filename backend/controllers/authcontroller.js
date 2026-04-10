const User=require("../models/user");
const bcrypt=require("bcrypt")
const genToken=require("../utils/token")

const signUp= async(req,res)=>{
    try{
        const {name,emailId,password} = req.body;

        const existEmail=await User.findOne({emailId});
        if(existEmail){
            return res.status(400).json({message:'email already exist!'})
        }

        if(password.length<6){
            return res.status(400).json({message:'password at least 6 character'})
        }

        const hashPassword=await bcrypt.hash(password,10);

        const newUser=await User.create({
            name,password:hashPassword,emailId
        });

        const token=await genToken(newUser._id);

        res.cookie("token",token,{
            httpOnly:true,
            maxAge:7*24*60*60*1000,
            secure:false,
            sameSite:"lax"
        })

        return res.status(201).json(newUser)


    }
    catch(error){
        return res.status(500).json({message:`sign up error ${error}`})
    }
    
}

const login= async(req,res)=>{
    try{
        const {emailId,password} = req.body;

        const user=await User.findOne({emailId});
        
        if(!user){
            return res.status(400).json({message:'email does not exist'})
        }

       const isMatch=await bcrypt.compare(password,user.password)

       if(!isMatch){
            return res.status(400).json({message:'wrong password'})
       }

        
        const token=await genToken(user._id);

        res.cookie("token",token,{
            httpOnly:true,
            maxAge:7*24*60*60*1000,
            secure:false,
            sameSite:"lax"
        })

        return res.status(200).json(user)


    }
    catch(error){
        return res.status(500).json({message:`log in error :${error}`})
    }
    
}


const logout= async(req,res)=>{
    try{        

       res.clearCookie("token",{
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
       })
        return res.status(200).json({message:'log out successfully'})
    }
    catch(error){
        return res.status(500).json({message:'log out error'})
    }
    
}

module.exports={
    signUp,
    login,
    logout
}