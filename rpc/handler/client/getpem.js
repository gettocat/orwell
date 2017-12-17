module.exports = function (argv, client) {

    var dbname = argv._[0];
    var datasetname = argv._[1];

    client.send("getpem", [dbname, datasetname]);



}