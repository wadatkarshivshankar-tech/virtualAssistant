const geminiResponse = require("../gemini")
const User=require("../models/user")
const uploadOnCloudinary=require("../utils/cloudinary")
const moment=require("moment")
const getCurrentUser=async (req,res)=>{
    try{
        const userId=req.userId
        const user=await User.findById(userId).select("-password")
        if(!user){
            return res.status(400).json({message:"user not found"})
        }
        
        return res.status(200).json(user)     
    } 
    
    catch (error) {
       return res.status(400).json({message:"get current user error"}) 
    }

    

}

const updateAssistant=async (req,res)=>{
    try{
        console.log("BODY:", req.body);
        console.log("FILE:", req.file);
        console.log("USER ID:", req.userId);
        const{assistantName,imageUrl}=req.body
        let assistantImage;
        if(req.file){
            assistantImage=await uploadOnCloudinary(req.file.path)
        }else{
            assistantImage=imageUrl
        }
        console.log("FINAL IMAGE:", assistantImage);

        const user=await User.findByIdAndUpdate(req.userId,{
            assistantName,assistantImage
        },{new:true}).select("-password")
        return res.status(200).json(user)
        console.log("UPDATED USER:", user);

    }catch(error){
        return res.status(400).json({message:"upload user error"})

    }
}

const askToAssistant=async (req,res)=>{
    try{
        const{command}=req.body
        if(!command){
            return res.status(400).json({
                error: "Command is required"
            })
        }
        const user=await User.findById(req.userId);
        user.history.push(command)
        user.save()
        const userName=user.name
        const assistantName=user.assistantName
        const result=await geminiResponse(command,assistantName,userName)

        if(!result){
            return res.status(500).json({
            type: "error",
            response: "No response from Gemini"
            })
        }

        console.log("Gemini raw:", result)

        const jsonMatch=result.match(/{[\s\S]*}/)
        if(!jsonMatch){
            return res.status(400).json({response:"sorry, i can't understand"})
        }

        const gemResult=JSON.parse(jsonMatch[0])
        console.log(gemResult)
        const type=gemResult.type

        switch(type){
            case 'get-date' :
                return res.json({
                   type,
                   userInput:gemResult.userInput,
                   response:`current date is ${moment().format("YYYY-MM-DD")}`
                });
            case 'get-time':
                 return res.json({
                 type,
                 userInput:gemResult.userInput,
                 response:`current time is ${moment().format("hh:mm A")}`
                });
            case 'get-day':
                return res.json({
                type,
                userInput:gemResult.userInput,
                response:`today is ${moment().format("dddd")}`
                });
            case 'get-month':
                return res.json({
                type,
                userInput:gemResult.userInput,
                response:`today is ${moment().format("MMMM")}`
                });
            case 'google-search':
            case 'youtube-search':
            case 'youtube-play':
            case 'general':
            case  "calculator-open":
            case "instagram-open": 
            case "facebook-open": 
            case "weather-show" :
            return res.json({
                    type,
                    userInput:gemResult.userInput,
                    response:gemResult.response,
                 });
        
            default:
                    return res.status(400).json({ response: "I didn't understand that command." })
              }

    }catch (error){
        console.log("ASK ERROR:", error)

        return res.status(500).json({
            type: "error",
            response: "Assistant failed"
            })
        }
}

module.exports={
    getCurrentUser,
    updateAssistant,
    askToAssistant
}