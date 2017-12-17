module.exports = function (argv, client) {

    var path = argv._[0];
    var dbname = argv._[1];
    var datasetname = argv._[2];

    client.send("addpem", [path, dbname, datasetname]);



}