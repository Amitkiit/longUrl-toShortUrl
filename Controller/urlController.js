const UrlModel=require("../model/urlModel");
const shortid=require("shortid");
const axios=require("axios")
const redis = require("redis")
const {promisify} = require("util");
const { arrayBuffer } = require("stream/consumers");

const redisClient = redis.createClient(
    12528,
    "redis-12528.c305.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
  );
  redisClient.auth("0xa8wqjSDVnbenDx487mH0PlMMNoWExy", function (err) {
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
  });

const SETEX_ASYNC = promisify(redisClient.SETEX).bind(redisClient);
const GETEX_ASYNC = promisify(redisClient.GETEX).bind(redisClient);
//---------------------------------------Creating urlData--------------------------------------------------------
const createShortUrl=async function(req,res){
    try{
        let obj={};
        let data =req.body;

    if(Object.keys(data).length==0) return res.status(400).send({status:false,message:"Provide data in body"})
    if(!data.longUrl) return res.status(400).send({status:false,message:"Provide Long URL"})

    if (typeof data.longUrl!=="string") return res.status(400).send({ status: false, message: "Long url is not String" });

    let urlfound= false;
    await axios.get(data.longUrl)
    .then((result)=>{
        if(result.status==200||result.status==201)
            urlfound=true;
    })
    .catch((error)=>{})

    if(urlfound==false) return res.status(400).send({status:false,message:"Invalid long Url"})
     
    //............check in cache-memory...................
    let cacheData = await GETEX_ASYNC(data.longUrl)
    let obj2=JSON.parse(cacheData)
    if(cacheData) return res.status(200).send({status:true,data:obj2})

    //............ Check in DataBase................
    let longUrlPresent = await UrlModel.findOne({longUrl:data.longUrl}).select({_id:0,createdAt:0,updatedAt:0,__v:0})
    if(longUrlPresent){
         await SETEX_ASYNC(longUrlPresent.longUrl, 86400, JSON.stringify(longUrlPresent))
        return res.status(200).send({status:true,data:longUrlPresent})}

    //..............Generate....................................
    let urlCode= shortid.generate().toLowerCase();

    let urlCodePresent = await UrlModel.findOne({urlCode:urlCode})
    if(urlCodePresent) return res.status(400).send({status:false,message:"Url code is already present"})

    let shortUrl= "http://localhost:3000/"+urlCode;

    obj.longUrl=data.longUrl;
    obj.shortUrl=shortUrl;
    obj.urlCode=urlCode;

    let created = await UrlModel.create(obj)

    //...............Take data and store in cache-memory.......................
    await SETEX_ASYNC(created.longUrl, 86400, JSON.stringify(obj))
    //...........................................................................

    return res.status(201).send({status:true,data:obj})
}catch(error){
        return res.status(500).send({status:false,Error:error.message})
    }
}

//------------------------------ Get urlData --------------------------------------------------

const redirectUrl=async function(req,res){
    try{
        let urlCode=req.params.urlCode;

    if(!shortid.isValid(urlCode)) return res.status(400).send({status:false,message:"Please enter correct Url code"})
    
    //...............Check UrlCode in cache-memory or Not........................................
    let cacheData = await GETEX_ASYNC(urlCode)
    let obj= JSON.parse(cacheData)
    if(obj) return res.status(302).redirect(obj.longUrl)

    //..............Check Url code in DataBase .................................................
    let checkUrlCode = await UrlModel.findOne({urlCode:urlCode}).select({longUrl:1,_id:0})
    if(!checkUrlCode) return res.status(404).send({status:false,message:"Url Code not found"})
     
    let Url = checkUrlCode.longUrl 

    await SETEX_ASYNC(urlCode, 86400, JSON.stringify(checkUrlCode))

    return res.status(302).redirect(Url)
}
    catch(error){
        return res.status(500).send({status:false,Error:error.message})
    }
}

module.exports={createShortUrl,redirectUrl}

