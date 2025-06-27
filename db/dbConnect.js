import mongoose from "mongoose"

export const dbConnect = async () => {
  try {
   const connectionInstance= await mongoose.connect(`${process.env.MONGO_URI}/subdomains` )
    const  SubDomain=await connectionInstance.connection.db.collection("subdomains");
    console.log("MongoDB connected")
    return SubDomain
  } catch (error) {
    console.error("MongoDB connection error:", error)
  }
}