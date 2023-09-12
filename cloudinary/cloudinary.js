const cloudinary=require("cloudinary").v2;


cloudinary.config({ 
    cloud_name: 'dztislym8', 
    api_key: '278344868192522', 
    api_secret: 'f9-ccbp65mNucb5zkFxt3aN5e2E' 
  });


  module.exports=cloudinary;