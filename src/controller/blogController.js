const blogModel = require("../model/blogModel.js");
const authorModel = require("../model/authorModel.js");
const jwt = require("jsonwebtoken");
const validator = require("../utils/validator");

// creating blog by authorizing authorId.
const createBlog = async function (req, res) {
  try {
    const requestBody = req.body;
    if (!validator.isValidRequestBody(requestBody)) {
      return res.status(400).send({
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
      return res.status(400).send({
        status: false,
        message: `${authorId} is not a valid author id`,
      });
    }
    const findAuthor = await authorModel.findById(authorId);
    if (!findAuthor) {
      return res
        .status(400)
        .send({ status: false, message: `Author does not exists.` });
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
        const uniqueTagArr = [...new Set(tags)];
        blogData["tags"] = uniqueTagArr; //Using array constructor here
      }
    }
    if (subcategory) {
      if (Array.isArray(subcategory)) {
        const uniqueSubcategoryArr = [...new Set(subcategory)];
        blogData["subcategory"] = uniqueSubcategoryArr; //Using array constructor here
      }
    }

    const newBlog = await blogModel.create(blogData);
    res.status(201).send({
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
    const { authorId, category, tags, subcategory } = queryParams;

    if (!validator.isValidString(authorId)) {
      return res
        .status(400)
        .send({ status: false, message: "Author id is required" });
    }
    if (authorId) {
      if (!validator.isValidObjectId(authorId)) {
        return res.status(400).send({
          status: false,
          message: `authorId is not valid.`,
        });
      }
    }

    if (!validator.isValidString(category)) {
      return res.status(400).send({
        status: false,
        message: "Category cannot be empty while fetching.",
      });
    }

    if (!validator.isValidString(tags)) {
      return res.status(400).send({
        status: false,
        message: "tags cannot be empty while fetching.",
      });
    }
    // console.log(tags)
    // console.log(subcategory)

    if (!validator.isValidString(subcategory)) {
      return res.status(400).send({
        status: false,
        message: "subcategory cannot be empty while fetching.",
      });
    }

    if (validator.isValidRequestBody(queryParams)) {
      const { authorId, category, tags, subcategory } = queryParams;
      if (validator.isValid(authorId) && validator.isValidObjectId(authorId)) {
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
    res.status(500).send({ status: false, Error: error.message });
  }
};

const updateDetails = async function (req, res) {
  try {
    let authorIdFromToken = req.authorId;
    let blogId = req.params.blogId;
    let Blog = await blogModel.findOne({ _id: blogId });
    if (!Blog) {
      return res.status(400).send({ status: false, msg: "No such blog found" });
    }
    if (Blog.authorId.toString() !== authorIdFromToken) {
      res.status(401).send({
        status: false,
        message: `Unauthorized access! Owner info doesn't match`,
      });
      return;
    }
    if (
      req.body.title ||
      req.body.body ||
      req.body.tags ||
      req.body.subcategory
    ) {
      const title = req.body.title;
      const body = req.body.body;
      const tags = req.body.tags;
      const subcategory = req.body.subcategory;
      const isPublished = req.body.isPublished;
      const updatedBlog = await blogModel.findOneAndUpdate(
        { _id: req.params.blogId },
        {
          title: title,
          body: body,
          $addToSet: { tags: tags, subcategory: subcategory },
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
      res.status(200).send({
        status: true,
        message: "Successfully updated blog details",
        data: updatedBlog,
      });
    } else {
      return res
        .status(404)
        .send({ status: false, msg: "Please give credentials to update" });
    }
  } catch (err) {
    res.status(500).send({
      status: false,
      Error: err.message,
    });
  }
};

//DELETE /blogs/:blogId - Mark is Deleted:true if the blogId exists and it is not deleted.
const deleteBlogById = async function (req, res) {
  try {
    let blogId = req.params.blogId;

    if (req.params.blogId) {
      let findBlog = await blogModel.findOne({ _id: blogId });

      if (findBlog.isDeleted == false) {
        let Update = await blogModel.findOneAndUpdate(
          { _id: blogId },
          { isDeleted: true, deletedAt: Date() },
          { new: true }
        );
        res.status(200).send({
          status: true,
          message: "successfully deleted blog",
        });
      } else {
        return res
          .status(404)
          .send({ status: false, msg: "Blog has been already deleted" });
      }
    } else {
      res
        .status(404)
        .send({ status: false, msg: `Blog not found by ${blogId}` });
    }
  } catch (err) {
    res.status(500).send({ status: false, Error: err.message });
  }
};

// DELETE /blogs?queryParams - delete blogs by using specific queries or filters.
const deleteBlogByQuery = async function (req, res) {
  try {
    let authorIdFromToken = req.authorId;
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
      let findBlog = await blogModel.find(obj);
      let blogToBeDeleted = [];
      findBlog.map((blog) => {
        if (
          blog.authorId.toString() === authorIdFromToken &&
          blog.isDeleted === false
        ) {
          blogToBeDeleted.push(blog._id);
        }
      });
      if (blogToBeDeleted.length === 0) {
        return res
          .status(404)
          .send({
            status: false,
            msg: "No such blog found Or is already been deleted",
          });
      }
      await blogModel.updateMany(
        { _id: { $in: blogToBeDeleted } },
        { $set: { isDeleted: true, deletedAt: new Date() } }
      );
      return res
        .status(200)
        .send({ status: false, message: "Blog deleted Successfully." });
    } else {
      return res
        .status(404)
        .send({ status: false, msg: `No filters passed for deletion.` });
    }
  } catch (err) {
    return res.status(500).send({ status: false, Error: err.message });
  }
};

module.exports = {
  createBlog,
  getBlog,
  updateDetails,
  deleteBlogById,
  deleteBlogByQuery
};
