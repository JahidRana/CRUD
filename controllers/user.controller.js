const user = require("../models/user.model");

const cloudinary=require("../cloudinary/cloudinary");


//create users
exports.createUsers = (req, res) => {

  uploadImage(req, res, async (err) => {
    if (err) {
      return res
        .status(400)
        .json({ message: "Image upload failed", error: err.message });
    }
    const cloudinaryUrl=req.file.path;
    const public_id = cloudinaryUrl.substring(
        cloudinaryUrl.lastIndexOf('/')+1,
        cloudinaryUrl.lastIndexOf('.')
      );

    // Create a new user instance with data from the request
    const newUser = new user({
      name: req.body.name,
      email: req.body.email,
      address: req.body.address,
      phone: req.body.phone,
      public_id: public_id,
      imageUrl: req.file.path,
    });

    // Save the user data to the database
    await newUser
      .save()
      .then(() => {
        res.status(201).json({ message: "User created successfully" });
      })
      .catch((error) => {
        res
          .status(500)
          .json({ message: "Error saving user data", error: error.message });
      });
  });
};




//get all users

exports.getAllUsers=async(req,res)=>{
    try {
        const users= await user.find();
    res.status(200).json(users);
    } catch (error) {
        res.status(500).send(error.message);
    }
}


//get single user
exports.getSingleUsers = async(req, res) => {
    try {
        const single_user=await user.findOne({_id:req.params.id});
        res.status(200).json(single_user);
    } catch (error) {
        res.status(500).send(error.message);
    }
    };




  exports.deleteUser = async(req, res) => { 
    try {
        
        const user_id = req.params.id

        // user data
        const user_data = await user.findOne({_id: user_id})

        if(!user_data) {
            return res.status(400).json({message: "No user exists with the provided id"}); 
        }

        // delete the image
        const publicId = 'employee/' + user_data.public_id;
        const image_deletion_result = await cloudinary.uploader.destroy(publicId);

        if (image_deletion_result.result !== 'ok') {
            return res.status(400).json({message: 'Error Deleting Image'});
        }

        // delete the user  
        const user_deletion_result = await user.deleteOne({_id: user_id});

        if (user_deletion_result.deletedCount !== 1) {
            return res.status(500).json({message: "Error deleting user from database"});
        }

        return res.status(200).json({message: "User and associated image have successfully been deleted"});
    } 
    
    catch (error) { 
        console.error("Error deleting user: ", error);
        return res.status(500).json({message: "Server Error"});
    } 
}




exports.updateUsers = async (req, res) => {
  uploadImage(req, res, async (err) => {
    if (err) {
      return res
        .status(400)
        .json({ message: 'Image upload failed', error: err.message });
    }
    try {
      const find_user = await user.findOne({ _id: req.params.id });

      find_user.name = req.body.name;
      find_user.email = req.body.email;
      find_user.address = req.body.address;
      find_user.phone = req.body.phone;

      // Check if a new image file was uploaded
      if (req.file) {
        // Upload the new image to Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(req.file.path);

        // Store Cloudinary public_id and URL in the user object
        find_user.public_id = cloudinaryResponse.public_id;
        find_user.imageUrl = cloudinaryResponse.secure_url;
      }

      await find_user.save();
      res.status(200).json(find_user);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
};
