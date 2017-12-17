module.exports = function (status, res) {
    if (status)
        console.log(JSON.stringify(res, null, " "))
    else
        console.log(JSON.stringify({code: -1, message: 'cant connect to server'}))
    
    process.exit(0)
}