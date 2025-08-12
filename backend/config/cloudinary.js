import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config(); // ✅ Make sure this is at the top before using process.env

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (filePath) => {
  console.log("🌐 Cloudinary ENVs:", {
    cloud: process.env.CLOUDINARY_CLOUD_NAME,
    key: process.env.CLOUDINARY_API_KEY,
    secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    if (!filePath) throw new Error("No file path provided");

    const result = await cloudinary.uploader.upload(filePath);
    console.log("✅ Upload successful:", result.secure_url);

    fs.unlinkSync(filePath); // cleanup
    return result.secure_url;
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error.message);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return null;
  }
};

export default uploadOnCloudinary;
