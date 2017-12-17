/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

////usage:
//node \
//simpleminer.js \
// --address=oZmpGpF9QFBhqksZWqRpnUv95k7pdiRDrc \ //address to get mining rewart
// --text="mine some empty blocks because im can! \-(^o^)-/" //coinbase text 
require("./tools/badthings");
var exec = require('child_process').exec;
var config = require('./config');
var Block = require('./blockchain/block/block')
var dif = require('./blockchain/block/difficulty');
var time = require('./blockchain/block/time');
var argv = require('minimist')(process.argv.slice(2));
var cmd = "\"" + process.argv[0] + "\"";
//245 001fffff00000000000000000000000000000000000000000000000000000000 - 12
//0x1e0fffff 236  - more then 10 minutes
//0x1effffff 240 0000ffffff000000000000000000000000000000000000000000000000000000 - 30
//0x1e5fffff 239 00005fffff000000000000000000000000000000000000000000000000000000 - 936

function miner() {
    var r = Math.floor(Math.random() * (0xffffffff - 0x1 + 1) + 0x1);
    var text = r + "/" +
            argv.text;

    exec(cmd + ' cli-wallet.js getblocktemplate_solo ' + argv.address + ' --coinbase="' + text + '"', function (error, stdout, stderr) {
        if (error) {
            throw error;
        }


        var data = JSON.parse(stdout);
        if (data.error || data.errno)
            throw new Error(JSON.stringify(data));

        data = data.result; //forget
        var block = new Block({
            version: data.version,
            hashPrevBlock: data.previousblockhash,
            time: data.curtime, //time(),
            bits: typeof data.bits == 'string' ? parseInt(data.bits, 16) : data.bits, //log2N=245 //dif.bits(), 
            nonce: 0,
            merkle: data.merkleRoot,
            height: data.height
        });
        //if (data.transactions) {
        block.addTx(data.coinbasetxn.data)

        for (var i in data.transactions) {
            block.addTx(data.transactions[i]);
        }

        block.generate();
        //}

        var start_time = time(), hashs = 0, st = time();
        var finded = false, target = new Buffer(dif.bits2target(block.bits), 'hex'), thex = target.toString('hex');
        var h1 = "";

        while (block.nonce < 0x100000000 && !finded) {

            if (time() - start_time > 60) {
                h1 = "hashrate = " + (hashs / 60) + " h/s ";
                start_time = time();
                hashs = 0;
            } else
                hashs++;
            if (config.debug.mining)
                console.log(h1 + "nonce: " + block.nonce + ": ")
            var h = block.getHash();
            if (dif.moreThen(h, target)) {
                if (config.debug.mining)
                    console.log('success!\n\n');
                if (config.debug.mining)
                    console.log("hash=" + h.toString('hex') + ", target=" + thex, ", r=" + r);
                finded = 1;
            } else {
                //console.log("fail\n");
                block.nonce++;
            }
        }

        if (block.nonce < 0x100000000) {
            //finded block

            console.log("time: " + (time() - st))

            //commit block
            block.hash = '';
            block.getHash('hex');
            console.log(block.toJSON());
            exec(cmd + " cli-wallet.js submitblock_solo --block=" + JSON.stringify(block.toJSON()).split("\"").join("\\\""), function (error, stdout, stderr) {
                console.log(stdout)
                setTimeout(function () {
                   // miner();
                }, 10000)
            });
        } else {
            //do something with coinbase text
            console.log("out of bounds");
        }
    });
}

miner();