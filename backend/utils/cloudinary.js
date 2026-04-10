const cloudinary = require("cloudinary").v2;
const fs = require("fs")

const uploadOnCloudinary =async (filePath)=>{
     cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME, 
        api_key: process.env.API_KEY, 
        api_secret: process.env.API_SECRET
    });

    try {
        if (!filePath) return null;
        const uploadResult = await cloudinary.uploader.upload(filePath);
        fs.unlinkSync(filePath)
        return uploadResult.secure_url
    } 
    catch (error) {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        throw new Error("Cloudinary upload failed")
    }
}

module.exports=uploadOnCloudinary