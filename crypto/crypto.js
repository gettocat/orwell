/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var crypto = require('./index');
var hash = require('./hash');
var EC = require('elliptic').ec;
var ec = new EC('secp256k1')

module.exports = {
    createKeyPair: function () {
        var privateKey, publicKey;
        var cf = new crypto();
        if (status = cf.init()) {
            privateKey = cf.private.priv.toJSON();
            publicKey = cf.private.getPublic(null, 'hex');
        }

        return {
            status: status,
            public: publicKey,
            private: privateKey
        }
    },
    getPublicByPrivate: function (priv) {
        var cf = new crypto(priv);
        return cf.private.getPublic(null, 'hex');
    },
    sign: function (priv, messageBinary) {
        var cf = new crypto(priv),
                sig = cf.ecdsa().sign(messageBinary, new Buffer(priv, 'hex'))

        return new Buffer(sig.toDER())
    },
    verify: function (public, sign, messageBinary) {
        var key = ec.keyFromPublic(public, 'hex')
        return key.verify(messageBinary, sign, 'hex')
    }

}