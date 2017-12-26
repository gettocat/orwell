[Back to intro](https://github.com/gettocat/orwell/blob/master/docs/intro.md)

# Local Domains

The datascript technology has allowed to create a human readable and easy to remember name for each address to use it within the orwell network.

For this, a special database `b96d613764d55f0866c6f0445166ad729a0b2a10` and dataset`domain` are built into the blockchain:
http://orwellscan.org/db/b96d613764d55f0866c6f0445166ad729a0b2a10/domain

This database is open, i.e. anyone can write there, but it also has special rules for validating new records, described in the section "transaction validation".
The main essence of these rules is the correct format of the `{domain: 'validdomainname', 'address': 'validaddressname'}`, as well as the uniqueness of the domain name.

For example, a transaction:
http://orwellscan.org/tx/03c0e616ae7a47da5c1cf4156243acc7d15018266b1655a2dfbf206075dd28a5 which binds the address of the base `oZmpGpF9QFBhqksZWqRpnUv95k7pdiRDrc` and the address `namedb`. Thus, you can write down 
your domains not to the address, but to the mnemonic address `namedb@orwell/domain`

```
<database name>@orwell/<dataset name>
```

Let's take an example with an alias for the address:
http://orwellscan.org/tx/c7c76e88336477559ae1d5bd677fb7763f50d0a8eddde0c9af972cb7f70bb808
It adds a rule for the `nanocat` domain instead of the same address. So, in order to send me money - the sender needs to write `nanocat@orwell`, the system will determine where to send money after requesting the database and send funds to my address, which I can change at any time.

**The domain system is already working, but not yet implemented in the rpc server in version 0.0.1!**
