import mongoose from "mongoose"



export const connectdb=async()=>{
   try {
 const conn=   await mongoose.connect(process.env.MONGO_URL)
 console.log(`mongodb connect ${conn.connection.host}`);
 
   } catch (error) {
    console.log("error in connecting to database");
    
    console.error("Error in connecting to database",error.message)
    process.exit(1);
   }
}