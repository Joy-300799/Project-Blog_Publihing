const authorModel = require('../model/authorModel.js')
const blogModel = require('../model/blogModel.js')
const jwt = require('jsonwebtoken')
const secretKey = "Project1-Blog_Publishing"

const loginCheck = async function (req, res, next) {
    try {

        let token = req.headers['x-api-key']
        if (!token) {
            return res.status(403).send({ status: false, message: `Missing authentication token in request` })
        }

        let decode = jwt.decode(token)
      if(Date.now() > (decode.exp) * 1000){
        return res.status(401).send({ status: false, message: `Session expired ! Please login again.` })
      }

        let verify = await jwt.verify(token, secretKey)
        if (!verify) {
            return res.status(403).send({ status: false, message: `Invalid authentication token in request` })
        }

        req.authorId = verify.authorId
        next()
    } catch (error) {
        res.status(500).send({ status: false, Error: error.message })
    }
}

module.exports = {
    loginCheck
}