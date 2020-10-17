# Token Contract

## Overview

The `Token` contract is an FA1.2 Token Contract.

The FA1.2 token standard is available in the [Tezos Improvement Proposal Repository](https://gitlab.com/tzip/tzip/blob/master/A/FA1.2.md).

The token contract was copied verbatim from [SmartPy's implementation](http://smartpy.io/dev/?template=fa12.py) on 09/06/2020 with some minor changes noted below.

## Overview

Details of the `token` contract are omitted since the FA1.2 standard is well understood and described extensively elsewhere. Instead, we opt to discuss specifics in the Kollibri system. 

The `token` contract controls the `KUSD` tokens. Tokens are specified in 10^18 precision, as are all values in Kollibri. The administrator of the token contract is the `minter` contract, who controls minting and burning of `KUSD` tokens based on it's own internal logic. 

### Changes

Kollibri tries to use this contract without modification to preserve security. Kollibri makes the following modifications:
- Add a `default` entrypoint and disallow transfers if they contain value. This behavior is explicitly defined to make the restriction obvious to future engineers.
