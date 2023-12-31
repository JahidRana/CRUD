const cloudinary = require("../cloudinary/cloudinary");
const fs = require("fs");
const user_model = require("../models/user.model");


//Create User and save in database
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

    // Create  user
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

//Delete single user

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

//Delete Multiple user

exports.deleteMultiUser=async (req, res) => {
  
  try {
    const user_ids = req.body.ids;

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ message: "user_ids must be a non-empty array" });
    }
    let totalDeleted = 0;
    for (const id of user_ids) {
      const user_data = await user_model.findOne({ _id: id });
      if (!user_data) {
        return res
          .status(400)
          .json({ message: `No user exists with the provided id: ${id}` });
      }

      const imagePublicId = user_data.public_id;

      if (!imagePublicId) {
        return res.status(400).send("Image Public ID is required.");
      }

      await cloudinary.uploader.destroy(imagePublicId, (error, result) => {
        if (error) {
          return res.status(500).send(`Error deleting image: ${error.message}`);
        }
      });

      const user_deletion_result = await user_model.deleteOne({ _id: id });

      if (user_deletion_result.deletedCount === 1) {
        totalDeleted++; // Increment the total deleted count
      }
    }

    return res.status(200).json({
      message: "Users and associated images have successfully been deleted",
      deletedCount: totalDeleted,
    });
  } catch (error) {
    console.error("Error deleting users: ", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

//update users and image using cloudinary

exports.updateUser = async (req, res) => {
  try {
    // Provided user id in the param
    const user_id = req.params.id;

    // User info
    const user_info = await user_model.findOne({ _id: user_id });

    // If no user exists with the provided id
    if (!user_info) {
      return res
        .status(404)
        .json({ message: "No user exists with the provided id" });
    }

    // Variable to store image info after uploading it on Cloudinary
    let uploaded_image_info;

    // If the user has uploaded an image, delete the old image and upload the new image
    if (req.files && req.files.image) {
      // Check if public_id exists before deleting the old image
      if (user_info.public_id) {
        await cloudinary.uploader.destroy(user_info.public_id);
      }

      // Temporarily uploaded image
      const temp_image_file = req.files.image;

      // Temporarily uploaded image's path
      const temp_image_file_path = temp_image_file.tempFilePath;

      // Upload the new image
      uploaded_image_info = await cloudinary.uploader.upload(
        temp_image_file_path,
        {
          folder: "employee",
          use_filename: false,
          unique_filename: true,
          overwrite: false,
        }
      );

      // Delete the temporary image from the server
      fs.unlinkSync(temp_image_file_path);
    }

    // Filter config for "findOneAndUpdate" function
    const filter = { _id: user_id };

    // Update config for "findOneAndUpdate" function
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

      imageUrl:
        req.files && req.files.image
          ? uploaded_image_info.secure_url
          : user_info.imageUrl,

      public_id:
        req.files && req.files.image
          ? uploaded_image_info.public_id
          : user_info.public_id,
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


//get page for pagination

exports.getPage=async (req, res) => {
  try {
    const page = req.query.page || 1; // Get the requested page from query parameter
    const pageSize = 3; // Set the page size

    // Calculate the skip value to skip the correct number of records
    const skip = (page - 1) * pageSize;

    // Fetch data from your data source (e.g., database)
    const data = await user_model.find()
      .skip(skip)
      .limit(pageSize)
      .exec();

    // Get the total count of records for pagination
    const totalCount = await user_model.countDocuments();

    const totalPages = Math.ceil(totalCount / pageSize);

    // Send the paginated data and metadata back to the client
    res.json({
      data,
      currentPage: parseInt(page),
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'An error occurred while fetching data.' });
  }
}


//serach item
exports.getSearchIteam= async(req, res) => {
  
  const query = req.query.query;
  if (!query) {
    return res.json({ results: [] });
  }
  try {
  
    const results = await user_model.find({ name: new RegExp(query, 'i') }).exec();
    res.json({ results });
  } catch (err) {
    console.error('Error querying MongoDB:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }

}
