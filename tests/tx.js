/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var assert = require('assert');
var transactionBuilder = require('../blockchain/transaction/builder_new');
var transactionParser = require('../blockchain/transaction/parser_new');
var Tx = require('../blockchain/transaction/transaction_new')
var dscript = require('orwelldb').datascript;
var cr = require('../crypto/crypto')
var fs = require('fs')
var pem = fs.readFileSync('./tests/pem').toString();
var bitPony = require('bitpony')
//console.log(cr.createKeyPair())
/*{ 
 status: 1,
 public: '047f3cd8b44caccd0af9b05ea31f7151520df30c2f2c3b8c451180f9632bc3604e9b77abfa3232f1247ae44fdf380404851211135012b3caf2fca22a7795e95fdb',
 private: '59f9bba83f2b374efc1539f14797fd0da60761d4d5a2154d0c793351e9cb03bb' 
 }
 */

describe('tx build check sign valid', function () {

    it('should be okay build', function () {
        var tx = new transactionBuilder()
                .setInputs([
                    ['81dbdba15fe456935c47eeeef5c61e8f850b54a482cc5324abea9602784ad4bf', 4, '1He9D3UnSkS6gBRaCJZSqb9mUJKSNWbeqM']
                ])
                .setOutputs([
                    [1148800, '14TVSSTS6xwPVrAhtDH1k3zifGL4X8AURR']
                ])
                .sign(["59f9bba83f2b374efc1539f14797fd0da60761d4d5a2154d0c793351e9cb03bb"])

        assert(tx.verify());
    });

    it('with datascript', function () {
        var tx = new transactionBuilder()
                .setInputs([
                    ['81dbdba15fe456935c47eeeef5c61e8f850b54a482cc5324abea9602784ad4bf', 4, '1He9D3UnSkS6gBRaCJZSqb9mUJKSNWbeqM']
                ])
                .setOutputs([
                    [1148800, '14TVSSTS6xwPVrAhtDH1k3zifGL4X8AURR']
                ])
                .attachData({
                    operation: 'create',
                    dataset: 'posts',
                    content: {
                        id: 1,
                        title: 'test',
                        text: '',
                    }
                })
                .sign(["59f9bba83f2b374efc1539f14797fd0da60761d4d5a2154d0c793351e9cb03bb"])

        assert(tx.verify());
    });

    it('with encrypted datascript', function () {
        var tx = new transactionBuilder()
                .setInputs([
                    ['81dbdba15fe456935c47eeeef5c61e8f850b54a482cc5324abea9602784ad4bf', 4, '1He9D3UnSkS6gBRaCJZSqb9mUJKSNWbeqM']
                ])
                .setOutputs([
                    [1148800, '14TVSSTS6xwPVrAhtDH1k3zifGL4X8AURR']
                ])
                .attachData({
                    operation: 'create',
                    dataset: 'posts',
                    content: {
                        id: 1,
                        title: 'test',
                        text: 'test data text',
                    },
                    algorithm: 'rsa'
                }, pem)
                .sign(["59f9bba83f2b374efc1539f14797fd0da60761d4d5a2154d0c793351e9cb03bb"])

        assert(tx.verify());
    });

    it('coinbase test', function () {

        var tx = new transactionBuilder()
        tx.setCoinbase("test coinbase transactions", "1He9D3UnSkS6gBRaCJZSqb9mUJKSNWbeqM", 50 * 1e8).generate();

        assert.equal(tx.getCoinBase(), "01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff1a7465737420636f696e62617365207472616e73616374696f6e73ffffffff0100f2052a010000001976a914b6884127d507cceda9c2c89a5375db5aa64981e488ac00000000")
    });

    it('coinbase can not contain datascript test', function () {

        assert.throws(function () {
            var tx = new transactionBuilder()
            tx
                    .setCoinbase("test coinbase transactions", "1He9D3UnSkS6gBRaCJZSqb9mUJKSNWbeqM", 50 * 1e8)
                    .attachData({
                        operation: 'create',
                        dataset: 'posts',
                        content: {
                            id: 1,
                            title: 'test',
                            text: 'test data text',
                        },
                        algorithm: 'rsa'
                    }, pem)
                    .generate();

        });
    })

});

describe('tx parser check', function () {

    it('should be okay build', function () {

        //0100000001bfd44a780296eaab2453cc82a4540b858f1ec6f5eeee475c9356e45fa1dbdb81040000008a47304402201755a6998360fca30adc73b5c1b62ed6bb008f3ed568f2de2b530e17f015b78a02206b0dfc76c29a3f4455024b078950041341da31e4c8234ec73b70c086984de7f60141047f3cd8b44caccd0af9b05ea31f7151520df30c2f2c3b8c451180f9632bc3604e9b77abfa3232f1247ae44fdf380404851211135012b3caf2fca22a7795e95fdbffffffff0180871100000000001976a91425eaee8458cde2c531de7a2577cd97e26ff5e1c988ac00000000eefd34011905706f737473fd2a0153fd0001e5b3292e185c65203b23fb5a9b8c4ab9410984259a8abfae043916dc797a09b8128081a56396cd3a76a3c9c9b7e74f55d4f9082da37f2f05afb1d2f188e0bbec17c2efad157f6707d1c4aa9aa5078810d390e5f4243b1720e80f76951f0ead78768bd92d9b5915e3811454c467795821f743c30ba97bc80c332228e6ca2fb6d78b28561ca4d5b269869bafb46020e3894a99bafc770e57b4ad3206cd222e2300e55fab9ebf206611cdea3c6b1e6c0c761d82c2e066a763db16d396c0df631b6e8120c3fec6d0ce523167ee8039406dde55b8ccf938132f7817c06312e09724398e12dc185f918296c0198d2888b4b5d4773f9bf65995b5429e4f60b5206fa2395601575958182e14ee164008f85eaa7192649e72e807962556f5a94a7257af8a78fbc7a85687
        var tx = new transactionParser("0100000001bfd44a780296eaab2453cc82a4540b858f1ec6f5eeee475c9356e45fa1dbdb81040000008a47304402200ae938c7dcab6e981269b25727e9ddf9538f3e6a5ba47f074cc0e6ae7dd65e210220156bb8c70ceed86d8eae4ff92f6de5f51d45bff988e51a9efd627050ed1b31d80141047f3cd8b44caccd0af9b05ea31f7151520df30c2f2c3b8c451180f9632bc3604e9b77abfa3232f1247ae44fdf380404851211135012b3caf2fca22a7795e95fdbffffffff0180871100000000001976a91425eaee8458cde2c531de7a2577cd97e26ff5e1c988ac00000000ee2c1905706f73747324542201f0f000fdc8896af40003f202696401f1057469746c650474657374f20474657874");
        var t = tx.toJSON();

        var sc = new dscript(t.datascript);

        assert.equal(true, sc.toJSON().canRead)
    });


    it('cant read but ok', function () {

        /*var d = new dscript({
         operation: 'write',
         algorithm: 'rsa',
         dataset: 'set1',
         content: {
         test: '123',
         'qwrqwr': 'weg23g23g',
         'num': 0.5251,
         }
         }, pem);*/

        //console.log(dscript.writeArray([d.toHEX()]))

        var tx = new transactionParser("0100000001bfd44a780296eaab2453cc82a4540b858f1ec6f5eeee475c9356e45fa1dbdb81040000008a47304402201755a6998360fca30adc73b5c1b62ed6bb008f3ed568f2de2b530e17f015b78a02206b0dfc76c29a3f4455024b078950041341da31e4c8234ec73b70c086984de7f60141047f3cd8b44caccd0af9b05ea31f7151520df30c2f2c3b8c451180f9632bc3604e9b77abfa3232f1247ae44fdf380404851211135012b3caf2fca22a7795e95fdbffffffff0180871100000000001976a91425eaee8458cde2c531de7a2577cd97e26ff5e1c988ac00000000ef01fd3301200473657431fd2a0153fd00013c6cc0b07594660cc03411b419ad44eefc8ae4112175c82d9f2ce98f0e54ca310379265d20d9d1e31301d64264ef415b70d9004d0442823c449a8782bccf2dc81064640557914b5e8bb639365a21a81f79148e9a35caf540c62a451d2102db0076b4a1e796f7ba28371e0aebe9f14c486ff11eee83aa18c9321238d834e03614186000d5d70decf147f95901dfdd5a503c666b6fbc3f6891d3b6968929d8dec1fd761aeb8983b9a7f3ec498576d19eeea7af10d7b8a71631f18a45a658cefb77571b273f6ecdbafabe99265147654b3985d249ac26a17974c2696ad8fb4c7970dcc3065f95ec90704c488096074e71978ffb851c929e73d103c0a4a6b60ab3585601575958fc0281f3079cce2d0ac70fe52278414a62b677fa9a6338ce3c740ed88583542387");
        var t = tx.toJSON();
        var list = dscript.readArray(t.datascript);

        for (var i in list) {
            var sc = new dscript(list[i]);
            assert.equal(false, sc.toJSON().canRead)

        }
    });

    it('test coinbase parser', function () {

        var tx = new transactionParser("01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff1a7465737420636f696e62617365207472616e73616374696f6e73ffffffff0100f2052a010000001976a914b6884127d507cceda9c2c89a5375db5aa64981e488ac00000000");
        var t = tx.toJSON();
        assert.equal(true, t.coinbase)
    });



});



describe('tx interface check', function () {

    it('build coinbase', function () {


        var tx = new Tx();
        tx.fromCoinBase("test coinbase transactions", "1He9D3UnSkS6gBRaCJZSqb9mUJKSNWbeqM", 50 * 1e8);
        assert.equal(tx.toHex(), "01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff1a7465737420636f696e62617365207472616e73616374696f6e73ffffffff0100f2052a010000001976a914b6884127d507cceda9c2c89a5375db5aa64981e488ac00000000");


    });

    it('build tx', function () {

        var tx = new Tx();
        tx.setInputs([
            {
                hash: '855057c671bb8aa8eb1239c06c56a61c1f0fd0ccefd71647245aa515e326fc97',
                index: 1,
                scriptSig: '483045022100bc24a7dd4527c36085958467baf09dc11e1cef3bb43b7cc65902f5274b1ddf4402204ef0c9f49374be5fed9f978d1bb3d8f313d83fc03b02dde046cbe7b621e9c94b0121034bac87656710b07b400d925104ac57e96332e74879f966fd6028c1b8fda695af',
                sequence: 4294967295,
                prevAddress: '1NsSPYpdwt8hs64PXZXRwGnsq277NGN6pN',
            }
        ]);

        tx.setOutputs([
            {
                amount: 387358377,
                scriptPubKey: '76a914176d67d30bbb77e0ebb93e39c793612a66f4571688ac',
            },
            {
                amount: 300000,
                scriptPubKey: '76a91421002fcd8771194d1fb0ea6b4f99c6e2f5959ed788ac',
            }
        ])
        tx.setVersion(2)
        tx.setLockTime(0);
        tx.build([//for inputs - previous address out, or you can use in.prevAddress field
            '1NsSPYpdwt8hs64PXZXRwGnsq277NGN6pN'
        ])

        //https://blockchain.info/ru/tx/e0ef7b30886cb0638a1eb53611d9b6c28fcfe49f833dc0443c8b6a52fcb0aa35?format=hex
        assert.equal(tx.toHex(), "020000000197fc26e315a55a244716d7efccd00f1f1ca6566cc03912eba88abb71c6575085010000006b483045022100bc24a7dd4527c36085958467baf09dc11e1cef3bb43b7cc65902f5274b1ddf4402204ef0c9f49374be5fed9f978d1bb3d8f313d83fc03b02dde046cbe7b621e9c94b0121034bac87656710b07b400d925104ac57e96332e74879f966fd6028c1b8fda695afffffffff02a99e1617000000001976a914176d67d30bbb77e0ebb93e39c793612a66f4571688ace0930400000000001976a91421002fcd8771194d1fb0ea6b4f99c6e2f5959ed788ac00000000");

    });

    it('create tx and sign with private key', function () {

        var tx = new Tx();
        tx.setInputs([
            {
                hash: '855057c671bb8aa8eb1239c06c56a61c1f0fd0ccefd71647245aa515e326fc97',
                index: 1,
                sequence: 4294967295,
                prevAddress: '1NsSPYpdwt8hs64PXZXRwGnsq277NGN6pN',
            }
        ]);

        tx.setOutputs([
            {
                amount: 387358377,
                scriptPubKey: '76a914176d67d30bbb77e0ebb93e39c793612a66f4571688ac',
            }
        ])
        tx.setVersion(2)
        tx.setLockTime(0);


        assert.equal(tx.sign(["59f9bba83f2b374efc1539f14797fd0da60761d4d5a2154d0c793351e9cb03bb"]), true)

    });

    it('parse coinbase', function () {


        var tx = new Tx();
        tx.fromHex("01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff1a7465737420636f696e62617365207472616e73616374696f6e73ffffffff0100f2052a010000001976a914b6884127d507cceda9c2c89a5375db5aa64981e488ac00000000");
        assert.equal(tx.toJSON().coinbase, true);


    });

    it('parse with data', function () {


        var tx = new Tx();
        tx.fromHex("0100000001bfd44a780296eaab2453cc82a4540b858f1ec6f5eeee475c9356e45fa1dbdb81040000008a47304402200ae938c7dcab6e981269b25727e9ddf9538f3e6a5ba47f074cc0e6ae7dd65e210220156bb8c70ceed86d8eae4ff92f6de5f51d45bff988e51a9efd627050ed1b31d80141047f3cd8b44caccd0af9b05ea31f7151520df30c2f2c3b8c451180f9632bc3604e9b77abfa3232f1247ae44fdf380404851211135012b3caf2fca22a7795e95fdbffffffff0180871100000000001976a91425eaee8458cde2c531de7a2577cd97e26ff5e1c988ac00000000ee2c1905706f73747324542201f0f000fdc8896af40003f202696401f1057469746c650474657374f20474657874");

        assert.equal(tx.toJSON().in.length, 1)

        assert.equal(tx.toJSON().in[0].hash, "81dbdba15fe456935c47eeeef5c61e8f850b54a482cc5324abea9602784ad4bf")
        assert.equal(tx.toJSON().in[0].index, 4)
        assert.equal(tx.toJSON().in[0].scriptSig, "47304402200ae938c7dcab6e981269b25727e9ddf9538f3e6a5ba47f074cc0e6ae7dd65e210220156bb8c70ceed86d8eae4ff92f6de5f51d45bff988e51a9efd627050ed1b31d80141047f3cd8b44caccd0af9b05ea31f7151520df30c2f2c3b8c451180f9632bc3604e9b77abfa3232f1247ae44fdf380404851211135012b3caf2fca22a7795e95fdb")


        assert.equal(tx.toJSON().out.length, 1)
        assert.equal(tx.toJSON().out[0].amount, 1148800)
        assert.equal(tx.toJSON().out[0].scriptPubKey, "76a91425eaee8458cde2c531de7a2577cd97e26ff5e1c988ac")

        assert.equal(tx.toJSON().datascript, "ef012d2c1905706f73747324542201f0f000fdc8896af40003f202696401f1057469746c650474657374f20474657874");
        var sc = new dscript(tx.toJSON().datascript);
        assert.equal(true, sc.toJSON().canRead)


    });


});