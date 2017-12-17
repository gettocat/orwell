/*
 * Orwell http://github.com/gettocat/orwell
 * Platform for building decentralized applications
 * MIT License
 * Copyright (c) 2017 Nanocat <@orwellcat at twitter>
 */

module.exports = {
    appname: 'orwell',
    net: 'mainnet',
    agent: "OrwellCore official",
    agent_version: 0x000000f0,
    relay: true, //can this node transmit info to another nodes
    services: 0, //0 - default node, 1 - listener
    mainnet: {
        port: 33001,
        magic: 'ff4c2b1e',
    },
    testnet: {
        port: 32001,
        magic: 'afe1ffcd'
    },
    debug: {
        include: false,
        fs: false,
        network: false,
        peers: true,
        protocol: true,
        nettime: true,
        db: {
            storage: true,
            keyval: true,
            common: true,
        },
        'blockchain': {
            orphanblock: true,
            sync: true,
            netsync: true,
            indexing: true,
            txvalidate: true,
            blockvalidate: true,
            persistenindex: true, //if set to true - use fs to store index of blockchain (use more system settings and disk) but increase loading
            events: true,
        },
        mining: true,
        rpc: true,
        democracy: true,
    },
    nodes: [
        // host//port(if non-standart)
        // all nodes have equal alias on all domains:
        // orwell.media, orwellcoin.org, telescr.in, 1984coin.org 
        'kenny.node.orwellcoin.org',
        'piter.node.orwell.media',
        'morty.node.telescr.in',
    ],
    limits: {
        invblocks: 500,
        maxtxfrompool: 200,
        invtx: 2000,
    },
    network: {
        timeout: 300,
        performunknowmessages: true
    },
    blockchain: {
        version: 5,
        satoshicoin: 1e8, //satoshi per coin
        halving: 100000,
        max_coins: 20e6, //coin supply
        txversion: 1,
        block_size: 1e7,
        max_block_sigops: 1e7 / 50, //
        coinbase_maturity: 100, //how much need confirmation to use coinbase coinss
        synctxpool: true, //sync memory pool (only memory tx unconfirmed list)
        mining: {
            maxtarget: 0x1d00ffff,
        }
    },
    rpc: {
        server: {
            port: 49999,
            host: '127.0.0.1',
            path: '/',
            strict: false,
            ssl: null
        },
        client: {
            port: 49999,
            host: '127.0.0.1',
            path: '/',
            strict: false,
            ssl: null
        },
    },
    client: {
        version: "0.0.0.1",
        name: 'orwell',
        cliname: 'cli-wallet',
    },
    wallet: {
        type: 'random', // random now is one variant. Later: seed wallet will be added
        changeAddress: true, //every time create new address for change on this account. Dont work for datascript transactions
        fee: {
            minimum: 10,
            medium: 20,
            maximum: 50
        },
        operationfee: {
            create: 1e6,
            write: 10,
            settings: 100,
        }
    },
    orwelldb: {
        path: '%home%/orwelldb/'
    }
}