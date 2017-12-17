/*
* Orwell http://github.com/gettocat/orwell
* Platform for building decentralized applications
* MIT License
* Copyright (c) 2017 Nanocat <@orwellcat at twitter>
*/

var generator = require('merkle-tree-stream/generator')
var gen = generator({
    leaf: function (leaf, roots) {
        // this function should hash incoming data
        // roots in the current partial roots of the merkle tree
        return crypto.createHash('sha256').update(leaf.data).digest()
    },
    parent: function (a, b) {
        // hash two merkle tree node hashes into a new parent hash
        return crypto.createHash('sha256').update(a.hash).update(b.hash).digest()
    }
}) // same options as above

var nodes = gen.next('some data')
console.log(nodes) // returns the tree nodes generated, similar to the stream output
console.log(gen.roots) // contains the current roots nodes