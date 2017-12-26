[Back to intro](https://github.com/gettocat/orwell/blob/master/docs/intro.md)

# Fees

Fees in the orwell network are calculated based on the number of bytes in the transaction, as well as for each operator in the datascript.

The minimum commission in the network is per byte - 10 satoshi + for each operation there is a fee:
```
Create - 1 million satoshi 0.01 orwl
Write - 10 satoshi 0.000000100 orwl
Settings - 100 satoshi 0.000001000 orwl
```

These amounts were chosen to deny flooding in datascript. If you make a minimum fee - will begin attacks to fill the blockade with useless information. And with such fee, this is expensive. The more you try to add information - the more it costs you.

In the future, it is planned to develop a technical solution for "smart fees". Those. to calculate the fee on the basis of the previous blocks and their sizes, in order to reduce the fee in case there are no attacks, and to prevent attacks - the rise in the cost of sending transactions.
