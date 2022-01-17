const blogModel = require("../model/blogModel.js");
const authorModel = require("../model/authorModel.js");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const validator = require("../utils/validator");

// creating blog by authorizing authorId.
const createBlog = async function (req, res) {
  try {
    const requestBody = req.body;
    if (!validator.isValidRequestBody(requestBody)) {
      return res
        .status(400)
        .send({
          status: false,
          message: "Invalid request parameters. Please provide blog details",
        });
    }

    //Extract params
    const { title, body, authorId, tags, category, subcategory, isPublished } =
      requestBody;

    // Validation starts
    if (!validator.isValid(title)) {
      return res
        .status(400)
        .send({ status: false, message: "Blog Title is required" });
    }
    if (!validator.isValid(body)) {
      return res
        .status(400)
        .send({ status: false, message: "Blog body is required" });
    }
    if (!validator.isValid(authorId)) {
      return res
        .status(400)
        .send({ status: false, message: "Author id is required" });
    }
    if (!validator.isValidObjectId(authorId)) {
      return res
        .status(400)
        .send({
          status: false,
          message: `${authorId} is not a valid author id`,
        });
    }
    const author = await authorModel.findById(authorId);
    if (!author) {
      return res
        .status(400)
        .send({ status: false, message: `Author does not exit` });
    }
    if (!validator.isValid(category)) {
      return res
        .status(400)
        .send({ status: false, message: "Blog category is required" });
    }
    //validation Ends
    const blogData = {
      title,
      body,
      authorId,
      category,
      isPublished: isPublished ? isPublished : false,
      publishedAt: isPublished ? new Date() : null,
    };

    if (tags) {
      if (Array.isArray(tags)) {
        //Using array constructor here
        blogData["tags"] = [...tags];
      }
    }
    if (subcategory) {
      if (Array.isArray(subcategory)) {
        //Using array constructor here
        blogData["subcategory"] = [...subcategory];
      }
    }

    const newBlog = await blogModel.create(blogData);
    res
      .status(201)
      .send({
        status: true,
        message: "New blog created successfully",
        data: newBlog,
      });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

//get all blogs by using filters - title,tags,category & subcategory.
const getBlog = async function (req, res) {
  try {
    let filterQuery = { isDeleted: false, deletedAt: null, isPublished: true };
    let queryParams = req.query;
    if (validator.isValidRequestBody(queryParams)) {
      const { authorId, category, tags, subcategory } = queryParams;
      if (validator.isValid(authorId) && isValidObjectId(authorId)) {
        filterQuery["authorId"] = authorId;
      }
      if (validator.isValid(category)) {
        filterQuery["category"] = category.trim();
      }
      if (validator.isValid(tags)) {
        const tagsArr = tags
          .trim()
          .split(",")
          .map((x) => x.trim());
        filterQuery["tags"] = { $all: tagsArr };
      }
      if (validator.isValid(subcategory)) {
        const subcatArr = subcategory
          .trim()
          .split(",")
          .map((subcat) => subcat.trim());
        filterQuery["subcategory"] = { $all: subcatArr };
      }
    }
    const blog = await blogModel.find(filterQuery);

    if (Array.isArray(blog) && blog.length === 0) {
      return res.status(404).send({ status: false, message: "No blogs found" });
    }
    res.status(200).send({ status: true, message: "Blogs list", data: blog });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

const updateDetails = async function (req, res) {
  try {
    let userIdFromToken = req.userId;
    let blogId = req.params.blogId;

    let findBlog = await blogModel.findOne({ _id: blogId });
    if (!findBlog) {
      return res
        .status(400)
        .send({
          status: false,
          msg: "No such user found. Please register and try again",
        });
    }
    if (findBlog.authorId.toString() !== userIdFromToken) {
      res
        .status(401)
        .send({
          status: false,
          message: `Unauthorized access! Owner info doesn't match`,
        });
      return;
    }

    if (
      req.body.title &&
      req.body.body &&
      req.body.tags &&
      req.body.subcategory
    ) {
      //accessing every keys and storing their values in constant.
      const title = req.body.title;
      const body = req.body.body;
      const tags = req.body.tags;
      const subcategory = req.body.subcategory;
      const isPublished = req.body.isPublished;

      //searching a document by blogId then updating their values & assigning them a new published date.
      const updatedBlog = await blogModel.findOneAndUpdate(
        { _id: req.params.blogId },
        {
          title: title,
          body: body,
          $push: { tags: tags, subcategory: subcategory },
          isPublished: isPublished,
        },
        { new: true }
      );

      if (updatedBlog.isPublished == true) {
        updatedBlog.publishedAt = new Date();
      }
      if (updatedBlog.isPublished == false) {
        updatedBlog.publishedAt = null;
      }
      res
        .status(200)
        .send({
          status: true,
          message: "Successfully updated blog details",
          data: updatedBlog,
        });
    } else {
      return res
        .status(404)
        .send({ status: false, msg: "Mandatory body not given" });
    }
  } catch (err) {
    res
      .status(500)
      .send({
        status: false,
        message: "Something went wrong",
        Error: err.message,
      });
  }
};

//DELETE /blogs/:blogId - Mark is Deleted:true if the blogId exists and it is not deleted.
const deleteBlog = async function (req, res) {
  try {
    let id = req.params.blogId;

    if (req.params.blogId) {
      let data = await blogModel.find({ _id: id });

      if (data[0].isDeleted == false) {
        let Update = await blogModel.findOneAndUpdate(
          { _id: id },
          { isDeleted: true, deletedAt: Date() },
          { new: true }
        );
        res
          .status(200)
          .send({
            status: true,
            message: "successfully deleted blog",
            data: Update,
          });
      } else {
        return res
          .status(404)
          .send({ status: false, msg: "Blog already deleted" });
      }
    } else {
      res.status(404).send({ status: false, msg: "Blog Id not found" });
    }
  } catch (err) {
    res
      .status(500)
      .send({ status: false, message: "Something went wrong", Error: err });
  }
};

// DELETE /blogs?queryParams - delete blogs by using specific queries or filters.
const deleteSpecific = async function (req, res) {
  try {
    let userIdFromToken = req.userId;
    let blogId = req.params.blogId;

    let findBlog = await blogModel.findOne({ _id: blogId });
    if (!findBlog) {
      return res
        .status(400)
        .send({
          status: false,
          msg: "No such Blog found. Please register and try again",
        });
    }
    if (findBlog.authorId.toString() !== userIdFromToken) {
      res
        .status(401)
        .send({
          status: false,
          message: `Unauthorized access! Owner info doesn't match`,
        });
      return;
    }

    if (
      req.query.category ||
      req.query.authorId ||
      req.query.tags ||
      req.query.subcategory
    ) {
      let obj = {};
      if (req.query.category) {
        obj.category = req.query.category;
      }
      if (req.query.authorId) {
        obj.authorId = req.query.authorId;
      }
      if (req.query.tags) {
        obj.tags = req.query.tags;
      }
      if (req.query.subcategory) {
        obj.subcategory = req.query.subcategory;
      }
      if (req.query.published) {
        obj.isPublished = req.query.isPublished;
      }
      let data = await blogModel.findOne(obj);

      if (data) {
        if (data.isDeleted == false) {
          data.isDeleted = true;
          data.deletedAt = Date();
          data.save();
          res
            .status(200)
            .send({
              status: true,
              message: "Deleted successfully",
              data: data,
            });
        } else {
          return res
            .status(400)
            .send({ status: false, message: "Blog has been already deleted" });
        }
      } else {
        return res
          .status(404)
          .send({ status: false, msg: "The given data is Invalid" });
      }
    } else {
      return res
        .status(404)
        .send({ status: false, msg: "Mandatory body missing" });
    }
  } catch (err) {
    res
      .status(500)
      .send({ status: false, message: "Something went wrong", Error: err });
  }
};

module.exports = {
  createBlog,
  getBlog,
  deleteBlog,
  deleteSpecific,
  updateDetails,
};
