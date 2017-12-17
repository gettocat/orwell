/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var config = require('./config');
var Client = require('./rpc/client')
var argv = require('minimist')(process.argv.slice(2));

var cmd = argv._.shift();
var client = new Client(config.rpc.client);

if (!cmd)
    cmd = 'help';
var res = require('./rpc/handler/client/' + cmd)(argv, client);
//process.exit(0)

