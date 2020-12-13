# Fund Contract

## Overview

A `Fund` contract collects funds in `KUSD` and `XTZ` for later use. 

`FundContracts` are used to implement two components of Kolibri:
(1) Stability Fund: Acts as the liquidator of last resort
(2) Developer Fund: Acts as an on-chain treasury to incentivize development.

`Fund`s can liquidate an oven (and acquire `XTZ` from the liquidation), and they can also disperse that liquidated `XTZ`. 

`Fund` contracts have two permissions on them:
(1) `Administrator`: Can manage the `Fund`'s baker and instruct the fund to liquidate an `Oven`
(2) `Governor`: Can swap `Governor`s, `Administrator`s and transfer `XTZ`

Long term, `Administrator` should be a multi-sig or governance function controlled without a time delay, while `Governor` should be a higher privileged multi-sig or DAO with a time lock.

### ACL Checking

Anyone may deposit `XTZ` into a `Fund`.

The `Administrator` can perform oven liquidations and choose the baker for the fund.

The `Governor` can change the administrator and other contract references. The `Governor` can also disburse `XTZ` funds.

### Core Upgrade Path

Any contract which needs to interact with a `Fund` should have a governable reference to the `Fund`.

If a new `Fund` contract is needed then:
(1) A new `Fund` contract would be deployed
(2) The `Governor` would update every contract that interacts with the `Fund` to point to the new `Fund`.
(3) The `Governor` would transfer existing `KUSD` and `XTZ` to the new `Fund`

### State Machine

The `Fund` contract does not have a state machine.

## Storage

The `Fund` contract stores the following:
- `governorContractAddress` (`address`): The `Governor`. Used for ACL checking.
- `administratorContractAddress` (`address`): The `Administrator`. Used for ACL checking.
- `ovenRegistryContractAddress` (`address`): The address of the `OvenRegistry`. Ensures that `liquidate` is only called on registered `Oven`s.

All storage parameters are governable and can be changed by `governorContractAddress`.

## Entrypoints

The `Fund` contract has the following entrypoints:
- `default`: No-op. Implemented so the contract can receive XTZ.
- `setDelegate`: Set the baker for the contract. Can only be called by the `administratorContractAddress`.
- `liquidate`: Liquidate an oven. Can only be called by the `administratorContractAddress`.
- `send`: Send `XTZ` to a recipient. Can only be called by the `governorContractAddress`.
- `setGovernorContract`: Update the `governorContractAddress`. Can only be called by the `governorContractAddress`.
- `setAdministratorContract`: Update the `administratorContractAddress`. Can only be called by the `governorContractAddress`.
- `setOvenRegistryContract`: Update the `ovenRegistryContractAddress`. Can only be called by the `governorContractAddress`.
