# Kolibri

Kolibri is an XTZ-based stablecoin built on Collateralized Debt Positions (CDPs) known as `Oven`s. 

## Background

All units in the Kolibri system are expressed in units of 10^-18. For instance, `123` is `0.000000000000000123`.

The `token` contract is an [FA 1.2](https://gitlab.com/tzip/tzip/blob/master/proposals/tzip-7/tzip-7.md) specified with `10^-18` decimals (similar to a Wei unit within Ethereum). The symbol for the token is `KUSD`. `KUSD` is soft pegged to the USD, and maintains its peg by using CDPs to attempt to balance the price to $1. 

## Overview

Kolibri uses CDPs (referred to as an `Oven`) to collateralize a soft pegged USD-stable value asset, `KUSD`. 

Each `Oven` has four functions:
- `Deposit`: Place `XTZ` into the `Oven`
- `Withdraw`: Remove `XTZ` from the `Oven`
- `Borrow`: Borrow `KUSD` against the `Oven` using XTZ as collateral
- `Repay`: Repay `KUSD` that was borrowed against the `Oven`. 

### Stability Fee

A stability fee is applied to borrowed `KUSD`. It is accrued in terms of `KUSD`. It is percentage based fee applied to all outstanding `KUSD` (borrowed `KUSD` + stability fee). Interest is assessed every minute (about every block on the Tezos chain). The stability fee is adjusted via governance to increase or decrease the incentives to borrow or repay `KUSD` if the asset loses a peg.

Negative stability fees are not supported in Kolibri but may be added in the future via a contract upgrade.

### Collateralization Ratio

In order to remain solvent, an `Oven` must maintain a minimum **collateralization ratio**. The collateralization ratio is computed as:
```
Collateralization Ratio = ((XTZ in Oven` * Price of XTZ/USD) / (Borrowed KUSD + Stability Fees)) * 100 
```

If a `Oven` drops below the **collateralization ratio**, then it is said to be **under collateralized**. `Oven` owners should take care to keep their position above the collateralization ratio, by either locking more `XTZ` or repaying `KUSD` when the collateralization ratio drops. 

The Kolibri system will prevent users from borrowing `KUSD` such that an `Oven` becomes under collateralized, or withdrawing `XTZ` to cause the `Oven` to become undercollateralized. However, the price of `XTZ` still fluctuates, which means an `Oven` can become undercollateralized without user action. At that point, a liquidation process kicks in to restore stability to the system.

### Liquidation

If an `Oven` becomes under collateralized, then anyone can liquidate it. This user is referred to as the **liquidator**. 

During liquidation, the following happens:
1) The **liquidator** receives all `XTZ` in the `Oven`.
2) The **liquidator** repays all outstanding `KUSD` tokens, plus an additional percentage based **liquidation fee** assessed on the assets.
3) The `Oven` is marked as **liquidated** and no longer accepts deposits, withdrawals, borrows or repayments. 

This is economically beneficial to the **liquidator**, since they are able to acquire XTZ at below market prices. Meanwhile, the `Oven` owner is penalized heavily for letting their `Oven` become undercollateralized, with the penalty funds being split between the stability fund and the development fund (the `devStabilityFundSplit` value in the `Minter` contract). 

#### An example liquidation flow
<table>
    <thead>
        <th colspan="2">Assumptions</th>
    </thead>
    <tbody>
        <tr>
            <td><b>XTZ/USD Pair Price</b></td>
            <td><b>$2.00</b></td>
        </tr>
        <tr>
            <td><b>Oven Collateralization Ratio</b></td>
            <td><b>200%</b></td>
        </tr>
        <tr>
            <td><b>Liquidation Fee</b></td>
            <td><b>10%</b></td>
        </tr>
    </tbody>
</table>

1. Alice creates an `Oven` and deposits 10 `XTZ` (worth $20). She borrows 10 `KUSD` (worth $10) against the collateral she has in the `Oven`. Since the oven has a collateralization ratio of 200%, it's the maximum she's able to borrow, and puts her at significant liquidation risk if the price of `XTZ` were to drop.
2. Some time later, the price of `XTZ/USD` drops to $1.50. The 10 `XTZ` in her `Oven` is now worth only $15, the 10 `KUSD `is still worth $10, and the `Oven` is now collateralized at 150%.
3. Bob notices the `Oven` is under collateralized and liquidates it. 
4. Bob pays all outstanding `KUSD`, along with a 10% penalty (the liquidation fee), ($10 + $1 = $11) and receives $15 worth of `XTZ`
5. The `Oven` transitions to a liquidated state, the $10 in KUSD is burned/destroyed, and the $1 in fees is split between the `stability fund`, and the `development fund`

### Developer and Stability Funds

Accrued stability and liquidation fees are deposited in two funds. The split is determined by the **developer fund split**. 

The role of the **stability fund** is to be a liquidator of last resort. If the price of the outstanding `KUSD` is greater than the `XTZ` value locked in the `Oven`s then a rational economic actor would not liquidate, and the `Oven` is then considered **underwater**. This event should not occur since it is unlikely that `Oven` values would go from undercollateralized to underwater fast enough that rational actors would not liquidate. However, in some sort of systemic black swan event, the **stability fund** acts as a powerful counter-balance and can liquidate **underwater** `Oven`s to restore collateralization (and thus stability) to the system. 

The **developer fund** is a discretionary fund used to fund future developments to Kolibri. Distributions are determined via a planned governance mechanism. 

### Debt Ceiling

Kolibri maintains a debt ceiling that can be used as a lever to control supply and demand. The debt ceiling must be changed through governance.

### Precision

Internally, all values in Kolibri are represented as integers with precision of `10^-18` (similar to a Wei within Ethereum). That is to say, the number `1.23` would be represented as
`1_230_000_000_000_000_000` in Kolibri. 

Kolibri ignores precision greater than `10^-18` as the amount is believed to be negligible.

### Compound Interest Calculations

Kolibri maintains a constant, called `stabilityFee` which calculates interest. The stability fee is a fixed interest amount, calculated on a 60 second basis. GUIs should choose to display this interest amount as an APY. 

Rather than calculate compound interest, Kolibri uses a linear approximation to calculate interest. That is to say that if two time periods have elapsed
then the interest calculation will be: 
```
newInterest = oldInterest * (1 + (numPeriods * stabilityFee))
```

Kolibri compounds interest within every call to the system. Given high enough usage, the system will be called at least every 60 seconds, which means interest will compound as expected. In periods of low usage, the interest will be linearly approximated, which is believed to be negligible in a system which represents numbers as small as `10^18`.

### Interest Calculations on `Oven`s

Calculating interest on a potentially unbound number of `Oven`s is not feasible in a system like Tezos where you pay per unit of computation. To solve this, Kolibri introduces the idea of an `Interest Index`. 

The `Minter` contains a `Global Interest Index`. This value is initially set to `1`.
Each `Oven` contains its own `Interest Index`. This value is set to the value of the `Global Interest Index` at origination time for the `Oven`.

Whenever the `Minter` is invoked, it compounds the `Global Interest Index`, using the elapsed time, stability fee, and linear approximation technique described above. 

When an `Oven` is originated, the `Minter` calculates the current `Global Interest Index` and gives it to the `Oven`. Whenever an `Oven` interacts with the `Minter`, the following process occurs:
- `Minter` recalculates `Global Interest Index`
- A ratio is calculated between the `Global Interest Index` and the `Oven`'s `Interest Index` to determine the interest the `Oven` has accrued
- The `Oven`'s `Interest Index` is updated to be the same as the `Global Interest Index`


#### Bakers

The only contract in Kolibri which holds XTZ is the `Oven` contract. `Oven`s are controlled by a user and can set their own baker of their choosing. This prevents centralization and enables `Oven` owners to make individual and rational economic decisions for the protocol. 

### Components

#### Ovens

An `Oven` represents a CDP. The related contracts are:

- `Oven`: Hold users funds, track the number of borrowed tokens, and the outstanding interest on the borrowed tokens.
- `OvenFactory`: A contract which can create `Oven`s and register them in the system.
- `OvenRegistry`: A registry of all `Oven`s in the system.
- `OvenProxy`: The entry point into the system which all `Oven`s are hardcoded to point to. 

#### Core Logic

![Oven Flow](oven-factory-flow.png)
![Core Flow](core-flow.png)

The following five contracts compose core logic for Kolibri:

- `OvenProxy`: Is the first contract called by an `Oven`. Validates that the `Oven` is trusted, verifies the system is not paused, retrieves data from the `Oracle`, and forwards all information to the `Minter`.
- `Minter`: Core logic for Kolibri. Takes inputs (balances, commands, oracle data), performs validation, mints / burns tokens, moves tokens to the stability funds, and calls back with new state.
- `Token`: Provides token functionality, including minting and burning
- `Fund`: Provides implementations for the `Developer Fund` and `Stability Fund`.
- `Oracle`: Provides XTZ/USD into the system from external sources. 

#### `Oven` Immutability

`Oven`s are simple key value stores and are the only part of the system which cannot be upgraded (Upgrading an `Oven` leads to the chance of a malicious governance proposal stealing collateral). As such, `Oven`s have some unique properties:

`Oven`s track the following information:
- `owner`: the owner of the `Oven`
- `borrowedTokens`: The number of `KUSD` borrowed against the `Oven`
- `stabilityFeeTokens`: The number of tokens accrued in stability fees

1) They reject all calls for `deposit`, `withdraw`, `borrow` and `repay` which are not from their `owner`.
2) All `Oven`s are hardcoded to the `OvenProxy`. The `OvenProxy` can be redirected to point to a new minter, or another intermediary `oven proxy` in case the core application logic is changed via governance. 
3) All `Oven`s send along all collateral and information when they make calls into the core contracts. `Oven`s expect to receive a call back from the core with any returned collateral and new values for their state.

## Upgradeability

Kolibri is made of a set of contracts. Each contract is documented below:
- [Oven](oven.md)
- [OvenFactory](oven-factory.md)
- [OvenProxy](oven-proxy.md)
- [Oracle](oracle.md)
- [Minter](minter.md)
- [Fund](fund.md)
- [Oven Registry](oven-registry.md)
- [Token](token.md)

These contracts communicate with each other by keeping pointers to each other. For instance, the `OvenProxy` Contract must communicate with the `Oracle` and `Minter` contracts. Both of these contracts are stored as `address`es in the `OvenProxy`'s storage. Thus, to change the implementation of the `Oracle` contract, one simply needs to change an `address` in `Oven` proxies storage.

This modular system encourages flexibility, separation of concerns and upgradeability. 

## Data Flow

Tezos uses queue based message passing which makes it hard to return data between contracts. Tezos also commits transactions atomically, which means any contract can fail the transaction. 

### Principles

In general, Kolibri's data flow adheres to the following rules:
1) There should only be one end to end path through the system. 
2) Calls which branch off this flow should terminate without modifying state in any calling contracts.
2) Sometimes callbacks will be unavoidable; each flow should only have one callback outstanding at once to simplify logic.
4) Each contract maintains a whitelist of contracts that can call into it.

### Data Flows

There are two main flows through the system:
1) `OvenFactory` -> `Minter` -> `OvenFactory`
2) `Oven` -> `OvenProxy` -> `Oracle`<sup>*</sup> -> `OvenProxy`<sup>\*</sup> -> `Minter` -> `OvenProxy` -> `Oven`

\* Optional calls

There are also two "auxiliary" calls which are made. These "auxiliary" calls do not call back:
1) `OvenProxy` always calls `OvenRegistry` to validate the caller is a known oven. `OvenRegistry` fails the call if the given oven was not trusted.
2) `Minter` sometimes calls `Token` to mint or burn tokens. 

## Oracle

Kolibri needs accurate data to function. Data is provided via the [Harbinger Price Feed](https://github.com/tacoinfra/harbinger) via the `Oracle` contract. The `Oracle` contract is replaceable and can be replaced to pull from another data source if needed.

## Governance

### Pause Guardian

Kolibri is able to pause borrowing, repaying, depositing and withdrawing of tokens via a **Pause Guardian**. The guardian can pause the system immediately. The guardian cannot restart the system without a governance proposal.

In the long term, this will be a multi-sig contract.

### Fund Administrator

**Fund administrators** are able to administer the Developer and Stability funds with immediate effect. Specifically, they can set the delegate for these contracts, and they can direct the funds to call `liquidate` on valid `Oven` contracts. Fund Administrators cannot move funds from the dev fund. 

In the long term, this will be a multi-sig contract.

### Governor

The **Governor** contract has four responsibilities in the Kolibri System:

In the medium term, this will be a time-locked multi-sig contract. In the long term, this will be a DAO.

#### Contract Upgrades

The Governor may set `address` references in contract storage. For instance, to upgrade the `Oracle` contract in the Kolibri system an individual would deploy a new contract in the correct shape. Then the Governor would call `OvenProxy`'s `setOracleContractAddress` method with the address of the new `Oracle`.

All contract pointers are governable, *EXCEPT* for the pointer from an `Oven` to the `OvenProxy`. This is because `Oven` code holds user's funds and is immutable so that governance may never confiscate funds.

Finally, the `minter` contract acts as the `administrator` of the `token` contract. `Minter` exposes an entrypoint to set the `admin` on the `token` contract in case the minter is upgraded.

#### System Parameters

The Governor may set new system parameters including the stability fee, the developer fund split, the collateralization ratio and the liquidation fee. 

#### Pause Guardian

If the **Pause Guardian** pauses the system, the Governor contract is the only one who can restart the system. The rational is that the system can be paused quickly in case of emergency, but cannot be quickly restarted without broad consensus. 

#### Developer / Stability Fund Steward

The Governor can elect to transfer funds from the developer or stability fund. This is a general purpose mechanism which allows funds to be distributed via governance proposal, if so desired. If the `Developer Fund` or `Stability Fund` contracts were ever upgraded, the `Governor` would need to migrate funds to the new contracts as well.

## Long Term Features

Kolibri is a minimum viable product, and it is expected that the contract will upgrade over time. Kolibri is built to be fully upgradeable, but `oven` code is immutable to protect funds of users. We present two future upgrades which could potentially require changes to ovens. 

### Value Limited Ovens

When the system starts, we may hard-code `Oven`s to limit the amount of collateral they will accept (in order to launch with a globally enforced risk tolerance until we have completed a security audit and remediated any findings). A future upgrade to `Oven` could remove this limitation. 

### Negative Interest Rates

The `minter` contract models the stability rate as a natural number. However, `oven` contracts model it as an `int`. This is so that an optional future upgrade of the `minter` contract can apply negative interest rates if so desired.

### Delegated Oven Control

Some users may with to delegate control of their `oven`. `Oven`'s maintain an `owner` `address` and invocations will fail if `deposit`, `withdraw`, `borrow` or `repay` are called by someone besides the owner. A newer version of `oven`s could be deployed to contain a list of addresses which may administer it. 
