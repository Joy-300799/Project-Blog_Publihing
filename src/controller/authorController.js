const authorModel = require('../model/authorModel.js')
const jwt = require('jsonwebtoken')

//Validating functions - 
const isValid = function(value) {
    if (typeof value === "undefined" || value === null) return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true
}

const isValidTitle = function(title) {
        return ['Mr', 'Mrs', 'Miss', 'Mast'].indexOf(title) !== -1
    }
    // So, for example: 'undefined'.indexOf() will return 0, as undefined is found at position 0 in the
    //  string undefined. 'undefine'.indexOf() however will return -1, as undefined is not found in the string undefine.

const isValidRequestBody = function(requestBody) {
        return Object.keys(requestBody).length > 0
    } //Validating fucntions ends here.

//Creating Author documents by validating the details.
const createAuthor = async function(req, res) {
    try {
        // Request body verifying
        let requestBody = req.body

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: true, message: "Invalid request parameter, please provide author Detaills" })
        }

        //Extract body params
        const { fname, lname, title, email, password } = requestBody // Object destruturing

        // Validation started & detecting here the falsy values .

        if (!isValid(fname)) {
            return res.status(400).send({ status: true, message: 'First name is required' })
        }
        if (!isValid(lname)) {
            return res.status(400).send({ status: true, message: 'Last name is required' })
        }
        if (!isValid(title)) {
            return res.status(400).send({ status: true, message: 'Title is required' })
        }
        if (!isValidTitle(title)) {
            return res.status(400).send({ status: false, message: `Title should be among Mr, Mrs, Miss and Mast` })
        }
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: `Email is required` })
        }

        //Email validation whether it is entered perfectly or not.
        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
            res.status(400).send({ status: false, message: `Email should be a valid email address` })
            return
        }

        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: `Password is required` })
        }
        const isEmailAlredyUsed = await authorModel.findOne({ email })
        if (isEmailAlredyUsed) {
            return res.status(400).send({ status: false, message: `${email} email address is already registered` })
        }
        //validation Ends

        const authorData = { fname, lname, title, email, password }
        const newAuthor = await authorModel.create(authorData)
        res.status(201).send({ status: true, message: `Author created successfully`, data: newAuthor })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }

}

//Login author Handler - Author won't be able to login with wrong credentials.
const loginAuthor = async function(req, res) {
    try {
        const requestBody = req.body
        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide login details' })
        }

        //Extract params
        const { email, password } = requestBody

        //Validation starts -
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: `Email is required` })
        }

        //Email validation whether it is entered perfectly or not.
        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
            res.status(400).send({ status: false, message: `Email should be a valid email address` })
            return
        }
        if (!isValid(password)) { //Password is entered correctly or not.
            return res.status(400).send({ status: false, message: `Password is required` })
        }
        //Validitions ends

        const author = await authorModel.findOne({ email, password }) //finding author details in DB to get a match of the provided Email and password.

        if (!author) {
            return res.status(401).send({ status: false, message: `Invalid login Email` });
        }
        let token = await jwt.sign({ authorId: author._id }, "projectBlog")
        res.header('x-api-key', token)
        res.status(200).send({ status: true, message: `Author login successfull`, data: { token } });
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

module.exports = {
    createAuthor,
    loginAuthor
}