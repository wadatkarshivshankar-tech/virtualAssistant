const mongoose=require("mongoose");

const main=async ()=>{
    try{
        await mongoose.connect(process.env.MONGO_URL)
        console.log("database connected")
    }
    catch(error){
        console.log("error occur :",error);
        
    }

    
}

module.exports=main;