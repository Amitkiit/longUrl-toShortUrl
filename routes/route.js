const express=require("express");
const router=express.Router();
const UrlController=require("../Controller/urlController")

//------------------ Creating Url Data --------------------------------------
router.post("/url/shorten",UrlController.createShortUrl)

//-----------------------Get url-----------------------------------------------
router.get("/:urlCode",UrlController.redirectUrl)

//----------------------------Default----------------------------------------
router.all("/**",function(req,res){
    return res.status(400).send({status:false,message:"Invalid URL"})
})

module.exports=router;