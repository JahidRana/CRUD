const cloudinary = require("../cloudinary/cloudinary");
const fs = require("fs");
const user_model = require("../models/user.model");

exports.createUser = async (req, res) => {
  try {
    // Check if image is uploaded
    if (!req.files || !req.files.image) {
      return res.status(400).json({ message: "Image is required" });
    }

    // Validate other fields from req.body
    const { name, email, address, phone } = req.body;

    if (!name || !email || !address || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Temporarily upload image
    const temporarily_uploaded_image = req.files.image;

    // Temporary uploaded image's path
    const image_temp_path = temporarily_uploaded_image.tempFilePath;

    // Variable to store image info after uploading it on Cloudinary
    let uploaded_image_on_cloudinary;

    // Upload the image
    try {
      uploaded_image_on_cloudinary = await cloudinary.uploader.upload(
        // Temporary image's path
        image_temp_path,
        {
          // On Cloudinary, the image would get uploaded in a folder, specifying that folder name
          folder: "employee",

          // Not using the temporarily uploaded image's name
          use_filename: false,

          // Let Cloudinary set a unique name for the new image
          unique_filename: true,

          // As every new image will have a unique name, overwriting is not possible
          overwrite: false,
        }
      );

      // Deleting the temporary image from the server
      fs.unlinkSync(image_temp_path);
    } catch (error) {
      console.error("Cloudinary Error:", error);
      return res.status(500).json({ message: "Failed to upload the image" });
    }

    // Create the user
    const created_document = await user_model.create({
      name,
      email,
      address,
      phone,
      imageUrl: uploaded_image_on_cloudinary.secure_url,
      public_id: uploaded_image_on_cloudinary.public_id,
    });

    return res.status(200).json({
      message: "User has been created successfully",
      user_info: created_document,
    });
  } catch (error) {
    console.error("Server Error:", error);

    return res.status(500).json({ message: "Server Error" });
  }
};

//get All users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await user_model.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//get Sinle Users Data
exports.getSingleUsers = async (req, res) => {
  try {
    const single_user = await user_model.findOne({ _id: req.params.id });
    res.status(200).json(single_user);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//Delete user

exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user_data = await user_model.findOne({ _id: id });
    if (!user_data) {
      return res
        .status(400)
        .json({ message: "No user exists with the provided id" });
    }
    const imagePublicId = user_data.public_id;

    if (!imagePublicId) {
      return res.status(400).send("Image Public ID is required.");
    }

    cloudinary.uploader.destroy(imagePublicId, (error, result) => {
      if (error) {
        return res.status(500).send(`Error deleting image: ${error.message}`);
      }

      res.send("Image deleted successfully.");
    });
   
    const user_deletion_result = await user_model.deleteOne({ _id: id });

    if (user_deletion_result.deletedCount !== 1) {
      return res
        .status(500)
        .json({ message: "Error deleting user from database" });
    }
    return res.status(200).json({
      message: "User and associated image have successfully been deleted",
    });
  } catch (error) {
    console.error("Error deleting user: ", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

//update users

exports.updateUser = async (req, res) => {
 
  try {
    let uploaded_image_info;

    const temp_image_file = req.files.image;
  
    const temp_image_file_path = temp_image_file.tempFilePath;
    const user_id = req.params.id;

    const user_info = await user_model.findOne({ _id: user_id });

    if (!user_info) {
      return res
        .status(404)
        .json({ message: "No user exists with the provided id" });
    }

    // Variable to store image info after uploading it on Cloudinary

    if (req.files && req.files.image) {
      try {
        // Check if public_id exists before deleting the old image
        if (user_info.public_id) {
          try {
            await cloudinary.uploader.destroy(
              user_info.public_id,
              (error, result) => {
                if (error) {
                  return res
                    .status(500)
                    .send(`Error deleting image: ${error.message}`);
                }

                res.send("Image deleted successfully.");
              }
            );
          } catch (error) {
            console.error("An error occurred while deleting the asset:", error);
          }
        }


        // Upload the new image
        try {
          uploaded_image_info = await cloudinary.uploader.upload(
            temp_image_file_path,
            {
              folder: "employee",
              use_filename: false,
              unique_filename: true,
              overwrite: false,
            }
          );

          await fs.unlink(temp_image_file_path);
        } catch (error) {
          console.error("An error occurred while uploading the image:", error);
        }
      } catch (error) {
        return res
          .status(400)
          .json({ message: "Failed to update the image", error });
      }
    }
    
    // Filter config for "findOneAndUpdate" function
    const filter = { _id: user_id };


   
    
   
   
    const update = {
      name: req.body.hasOwnProperty("name") ? req.body.name : user_info.name,

      email: req.body.hasOwnProperty("email")
        ? req.body.email
        : user_info.email,

      address: req.body.hasOwnProperty("address")
        ? req.body.address
        : user_info.address,

      phone: req.body.hasOwnProperty("phone")
        ? req.body.phone
        : user_info.phone,
      public_id:
        req.files && req.files.image
          ? uploaded_image_info.public_id
          : user_info.public_id,
      imageUrl:
        req.files && req.files.image
          ? uploaded_image_info.secure_url
          : user_info.imageUrl,
    };

    // Options config for "findOneAndUpdate" function
    const options = { new: true, runValidators: true };

    // Update the user info
    const updated_user = await user_model.findOneAndUpdate(
      filter,
      update,
      options
    );

    // Send success response
    return res.status(200).json({
      message: "User has successfully been updated",
      user_info: updated_user,
    });
  } catch (error) {
    return res.status(500).json({ message: "An error has occurred", error });
  }
};
