import mongoose from "mongoose";
import { redis } from '../db/connectRedis.js';
import { REDIS_EXP } from "../constants.js";
import { SubDomain } from '../subdomain.model.js';
const cacheSubDomain=async(subdomain,projectID,owner)=>{
const subdomainString=`user_${subdomain}`
const subdomainData={
    owner:owner,
    projectID:projectID
}
await redis.set(subdomainString,JSON.stringify(subdomainData),"PX",REDIS_EXP)
}
const getSubDomain = async(subdomain)=>{
const subdomainString=`user_${subdomain}`
try {
    const subdomainData=await redis.get(subdomainString)
    if(subdomainData){
        const subdomainObj=await JSON.parse(subdomainData)
        return subdomainObj
    }
    else{
       const subD = await SubDomain.findOne({ subDomain: subdomain });
         await cacheSubDomain(subD.subDomain,subD.projectID,subD.owner._id,subD.public)
         const subUpdated={...subD.toObject(),Ispublic:subD.public}
        return subUpdated
    }
} catch (error) {
    throw new Error(error)
}
}

export {getSubDomain}