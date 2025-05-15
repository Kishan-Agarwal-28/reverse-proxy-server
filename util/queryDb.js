import mongoose from "mongoose";

export const getSubdomain = async (subdomain) => {

const MyModel = mongoose.model('Subdomain',{},'subdomains');
const result = await MyModel.findOne({ subDomain: subdomain })


}
const cacheSubDomain=async (subdomain,id) => {

}