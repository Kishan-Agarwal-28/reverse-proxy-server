import mongoose from "mongoose";
import { redis } from '../db/connectRedis.js';
import { REDIS_EXP } from "../constants.js";

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

        return JSON.parse(subdomainData)
    }
    else{
       const subD = await SubDomain.findOne({ subDomain: subdomain });
         await cacheSubDomain(subD.subDomain,subD.projectID,subD.owner._id)
        return subD
    }
} catch (error) {
    throw new Error(error)
}
}

export {getSubDomain}