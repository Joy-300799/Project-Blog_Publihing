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

    module.exports = {
        isValid,
        isValidTitle,
        isValidRequestBody
    }