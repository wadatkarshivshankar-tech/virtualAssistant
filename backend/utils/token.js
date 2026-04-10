const jwt=require("jsonwebtoken");


const genToken=async(userId)=>{
    try{
        const token=await jwt.sign({id:userId},process.env.SECRET_KEY,{expiresIn:"10d"})
        return token;


    }catch(error){
        throw new Error(`Token not generated: ${error.message}`);
    }

}

module.exports=genToken;