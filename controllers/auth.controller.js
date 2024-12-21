import express from "express";
import { User } from "../model/user.model.js"
import jwt from "jsonwebtoken"
import { redis } from "../lib/redis.js";
import dotenv from "dotenv";
dotenv.config();
/// generate tokens


  // Store refresh token in Redis
  const storerefreshtoken = async (userid, refreshtoken) => {
    await redis.set(`refresh_token:${userid}`, refreshtoken, "EX", 7 * 24 * 60 * 60); // 7 days
  };
  
  // Set cookies in response
  const setcookies = (res, accesstoken, refreshtoken) => {
    res.cookie("access_token", accesstoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie("refresh_token", refreshtoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  };
  // Token generation function
  const generatetokens = (user_id) => {
    const accesstoken = jwt.sign({ user_id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    const refreshtoken = jwt.sign({ user_id }, process.env.REFRESS_TOKEN_SECRET, { expiresIn: "7d" });
    return { accesstoken, refreshtoken }; // Return tokens
  };
  
  // Signup function
  export const signup = async (req, res) => {

   
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
      const { email, password, name } = req.body;
  
      // Check if all required fields are provided
      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          message: "Please provide all the fields",
        });
      }

      if(password.length<6){
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }
  
      // Validate email format
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email",
        });
      }
  
      // Check if user already exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }
  
      // Create the new user
      const user = await User.create({
        name,
        email,
        password,
      });
  
      // Generate tokens and store refresh token
      const { accesstoken, refreshtoken } = generatetokens(user._id);
      await storerefreshtoken(user._id, refreshtoken);
  
      // Set cookies with tokens
      setcookies(res, accesstoken, refreshtoken);
  
      // Send success response
      return res.status(201).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        message: "User created successfully",
      });
    } catch (error) {
      console.error("Error during signup:", error);
      // Catch any unexpected errors
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
  export const login = async (req, res) => {
try {
    const {email,password}=req.body;
    if(!email || !password){
        return res.status(400).json({
            success:false,
            message:"Please provide email and password"
        })
    }
    const user=await User.findOne({email});
    if(!user){
        return res.status(400).json({
            success:false,
            message:"User not found"
        })
    }
    const isMatch=await user.comparePassword(password);
    if(!isMatch){
        return res.status(400).json({
            success:false,
            message:"Invalid credentials"
        })
    }
    const {accesstoken,refreshtoken}=generatetokens(user._id);
    await storerefreshtoken(user._id,refreshtoken); 
    setcookies(res,accesstoken,refreshtoken);
    return res.status(200).json({
        success:true,
        user:{
            id:user._id,
            name:user.name,
            email:user.email,
            role:user.role      
        },
        message:"User logged in successfully"
    }
)

} catch (error) {
    console.error("Error during login:", error);
    // Catch any unexpected errors
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
    
};
export const logout = async (req, res) => {
  
    
    try {
        const refreshtoken=req.cookies.refresh_token;

        if(refreshtoken) {
            const decoded=await jwt.verify(refreshtoken,process.env.REFRESS_TOKEN_SECRET);
            await redis.del(`refresh_token:${decoded.user_id}`);
        } 
        
        res.clearCookie("access_token");
        res.clearCookie("refresh_token");
        res.json({message:"logout successfully"});
    } catch (error) {
        console.error("Error during logout:", error);
        // Catch any unexpected errors
        return res.status(500).json({
          success: false,
          message: "Internal server error",
        });
    }
};


export const refreshtoken = async (req, res) => {

   try{

   
        const refreshtoken=req.cookies.refresh_token;
        if(!refreshtoken){
            return res.status(401).json({
                success:false,
                message:"Unauthorized"
            })
        }
        const decoded=await jwt.verify(refreshtoken,process.env.REFRESS_TOKEN_SECRET);
        const storedtoken=await redis.get(`refresh_token:${decoded.user_id}`);
        if(refreshtoken!==storedtoken){
            return res.status(401).json({
                success:false,
                message:"invalid refresh token"
            })
        }
        const accesstoken = jwt.sign({userId: decoded.user_id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
        res.cookie("access_token", accesstoken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000, // 15 minutes
          });
        return res.status(200).json({
            success:true,
            
            message:"Token refreshed successfully"
        })
    }catch(error){
        console.log("error in token refresh",error.message);
        
        return res.status(500).json({
            success: false,
            message: "Internal server error",
          });
}
}

export const getProfile=async(req,res)=>{
    try {
      
       const user=req.user;
        return res.status(200).json({
            success:true,
            user
        })
    } catch (error) {
      console.log("Error in getProfile controller",);
      
      
      res.status(500).json({
        message:"Internal server error",
        error:error.message
      })
    }
}