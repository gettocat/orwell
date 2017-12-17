/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var EC = require('elliptic').ec;
var da = function (privk, public) {
    this.ec = new EC('secp256k1');
    if (privk)
        this.private = this.ec.keyFromPrivate(privk, 16);

    if (!public && this.private)
        this.public = this.private.getPublic(null, 'hex');
    else if (public && this.private)
        this.public = public;
}

da.prototype = {
    ec: null,
    //In geek speak, a Bitcoin address is technically a base58 encoded RIPEMD160 hash of a SHA-256 
    //hash of 256-bit public key of an Elliptic Curve Digital Signature Algorithm key pair concatenated with a checksum.
    init: function () {


        if (!this.private) {
            this.private = this.ec.genKeyPair();
            this.public = this.private.getPublic();
            return 1;
        }


    },
    ecdsa: function () {
        return this.ec;
    }

}

module.exports = da;
