import mongoose from "mongoose";
import { redis } from '../db/connectRedis.js';
import { REDIS_EXP } from "../constants.js";
import { subdomainDB as SubDomain } from "../index.js";
const cacheSubDomain = async (subdomain, projectID, owner,Ispublic) => {
  const key = formatSubdomainKey(subdomain);
  const subdomainData = { owner, projectID ,Ispublic};
  if(redis.get(key)){
    await redis.del(key);
  }
  await redis.set(key, JSON.stringify(subdomainData), "PX", REDIS_EXP);
};
const getSubDomain = async(subdomain) => {
    const subdomainString = `user_${subdomain}`;
    
    try {
        // First check Redis cache
        const subdomainData = await redis.get(subdomainString);
        if (subdomainData) {
            const subdomainObj = JSON.parse(subdomainData);
            return subdomainObj;
        }
        
        // If not in cache, query database
        const subD = await SubDomain.findOne({ subDomain: subdomain });
        
        // Check if subdomain exists in database
        if (!subD) {
            return null; // Return null if subdomain not found
        }
        
        // Cache the subdomain data
        await cacheSubDomain(subD.subDomain, subD.projectID, subD.owner._id, subD.public);
        
        // Return the subdomain object with public flag
        const subUpdated = { ...subD.toObject(), Ispublic: subD.public };
        return subUpdated;
        
    } catch (error) {
        console.error('Error in getSubDomain:', error);
        throw new Error(`Failed to get subdomain: ${error.message}`);
    }
};
export {getSubDomain}