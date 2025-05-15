import mongoose from "mongoose";

// const Subdomain=mongoose.model("Subdomain")
export const getSubdomain = async (subdomain) => {
// Subdomain.findOne({ subdomain: subdomain }, (err, result) => {
//     if (err) {
//       console.error("Error fetching subdomain:", err);
//       return null;
//     }
//     if (!result) {
//       console.log("Subdomain not found");
//       return null;
//     }
//     console.log("Subdomain found:", result);
//     console.log(result)
//     cacheSubDomain(subdomain,result._id)
//     return result;
// })
//  const mySchema = new mongoose.Schema({...});
const MyModel = mongoose.model('Subdomain',{},'subdomains');
const result = await MyModel.findOne({ subDomain: subdomain })
console.log(result)

}
const cacheSubDomain=async (subdomain,id) => {

}