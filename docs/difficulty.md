[Back to intro](https://github.com/gettocat/orwell/blob/master/docs/intro.md)

# Difficulty

Difficulty in the orwell network is the same as in the bitcoin network, but with some additions. The maximum bits are `1d00ffff`, as in the bitcoin network, which corresponds to a complexity of `2^32` and a target value of `2^224`.
The complexity is averaged on the basis of the last 12 blocks, but unlike bitcoin, the decrease is more smooth by 25%, and the increase by 50% from the current complexity. Coupled with recalculation every 12 blocks, this gives smoother distributions and a smoother schedule of complexity, as well as an adequate response to a sharp increase in capacity or vice versa, to a sharp decline.
