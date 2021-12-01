const express = require('express');

const router = express.Router();
const authorController=require('../controller/authorController')
const blogController=require('../controller/blogController')
const middleware=require('../middleware/middleware')

// create Author API
router.post('/authors',authorController.createAuthor )

// Create Blog API
router.post('/blogs',middleware.loginCheck, blogController.createBlog )

// filter API
router.get('/filterblogs',middleware.loginCheck, blogController.getBlog  )

// update blog API
router.put('/blogs/:blogId',middleware.loginCheck,middleware.blogId,blogController.updateDetails)

// delete blog API
router.delete('/blogs/:blogId',middleware.loginCheck,blogController.deleteBlog)

// deleteByFilter API
router.delete('/blogs',middleware.loginCheck,blogController.deleteSpecific)

// Login API for Authorization while login.
router.post('/login',blogController.loginAuthor)

module.exports = router;   