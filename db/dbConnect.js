import mongoose from "mongoose"
export let SubDomain
export const dbConnect = async () => {
  try {
   const connectionInstance= await mongoose.connect(`${process.env.MONGO_URI}/subdomains` )
    SubDomain=await connectionInstance.connection.db.collection("subdomains");
    console.log("MongoDB connected")
  } catch (error) {
    console.error("MongoDB connection error:", error)
  }
}