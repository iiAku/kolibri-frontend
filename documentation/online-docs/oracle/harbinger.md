# Harbinger Price Feed

Harbinger is a signed price feed for the [Tezos blockchain](https://tezos.com/) which provides a trusted price oracle for digital assets.

Harbinger's design was inspired by [Compound's Open Price Feed](https://medium.com/compound-finance/announcing-compound-open-oracle-development-cff36f06aad3). Separate entities provide signed price updates and post the signed price data on chain. This separation of responsibility leads to a decentralized solution where anyone can post signed prices on-chain, reducing dependencies on a single poster that might be offline.

Harbinger stores "candles" of prices of assets. Specifically, each data point for an asset in a Harbinger price oracle contains the following data: (1) start time, (2) end time, (3) open price, (4) high price, (5) low price, (6) close price, and (7) volume. Typically, the signed price data originates from a market order book on an exchange, where the most recent historical 1-minute candle can be retrieved and signed.

<a target="_blank" rel="noopener" href="https://github.com/tacoinfra/harbinger#harbinger" class="button is-primary"><strong>Read more about Harbinger on Github</strong></a>

## Contracts

Contracts for Harbinger are deployed at the following addresses:

* MainNet
    * Coinbase
        * Storage: [KT1Jr5t9UvGiqkvvsuUbPJHaYx24NzdUwNW9](https://tzkt.io/KT1Jr5t9UvGiqkvvsuUbPJHaYx24NzdUwNW9/storage)
        * Normalizer [KT1AdbYiPYb5hDuEuVrfxmFehtnBCXv4Np7r](https://tzkt.io/KT1AdbYiPYb5hDuEuVrfxmFehtnBCXv4Np7r/storage)
    * Binance
        * Storage: [KT1Mx5sFU4BZqnAaJRpMzqaPbd2qMCFmcqea](https://tzkt.io/KT1Mx5sFU4BZqnAaJRpMzqaPbd2qMCFmcqea/storage)
        * Normalizer: [KT1SpD9Xh3PcmBGwbZPhVmHUM8shTwYhQFBa](https://tzkt.io/KT1SpD9Xh3PcmBGwbZPhVmHUM8shTwYhQFBa/storage)
    * Gemini
        * Storage: [KT1Jud6STRGZs6hSfgZsaeztbkzfwC3JswJP](https://tzkt.io/KT1Jud6STRGZs6hSfgZsaeztbkzfwC3JswJP/storage)
        * Normalizer: [KT1JywdJbaVW5HtsYh4XNNuHcVL2vE6sYh7W](https://tzkt.io/KT1JywdJbaVW5HtsYh4XNNuHcVL2vE6sYh7W/storage)
    * OKEx
        * Storage: [KT1G3UMEkhxso5cdx2fvoJRJu5nUjBWKMrET](https://tzkt.io/KT1G3UMEkhxso5cdx2fvoJRJu5nUjBWKMrET/storage)
        * Normalizer: [KT1J623FNZ6an8NHkWFbtvm5bKXgFzhBc5Zf](https://tzkt.io/KT1J623FNZ6an8NHkWFbtvm5bKXgFzhBc5Zf/storage)
* DelphiNet
    * Coinbase
        * Storage: [KT1NNfziS5orym8pLvp2qsTjbq2ai9H8sDSr](https://delphi.tzkt.io/KT1NNfziS5orym8pLvp2qsTjbq2ai9H8sDSr/storage)
        * Normalizer: [KT1LWDzd6mFhjjnb65a1PjHDNZtFKBieTQKH](https://delphi.tzkt.io/KT1LWDzd6mFhjjnb65a1PjHDNZtFKBieTQKH/storage)
    * Binance
        * Storage: [KT1F5MSPLiiEmqnePPBUJajPV7zPkU4qWHkZ](https://delphi.tzkt.io/KT1F5MSPLiiEmqnePPBUJajPV7zPkU4qWHkZ/storage)
        * Normalizer: [KT1Age13nBE2VXxTPjwVJiE8Jbt73kumwxYx](https://delphi.tzkt.io/KT1Age13nBE2VXxTPjwVJiE8Jbt73kumwxYx/storage)
    * Gemini
        * Storage: [KT1WmbY7rSG8WufQArssoda99jNhFcHqELB2](https://delphi.tzkt.io/KT1WmbY7rSG8WufQArssoda99jNhFcHqELB2/storage)
        * Normalizer: [KT1VYnz5peWhfPcpBiViBZXa6Z8na3gqdkZS](https://delphi.tzkt.io/KT1VYnz5peWhfPcpBiViBZXa6Z8na3gqdkZS/storage)
    * OKEx
        * Storage: [KT1EVxgjWF74AzHpZcKYgfvRoewNATQkWQpE](https://delphi.tzkt.io/KT1EVxgjWF74AzHpZcKYgfvRoewNATQkWQpE/storage)
        * Normalizer: [KT1NF3n2nPNEa5bd88V4tk1vGWhFfugwuw7K](https://delphi.tzkt.io/KT1NF3n2nPNEa5bd88V4tk1vGWhFfugwuw7K/storage)

## Repositories

Harbinger is made up of several components in separate github repositories for discoverability. Developers, signers, posters and users may be interested in one or more of the following repositories:

- [harbinger](https://github.com/tacoinfra/harbinger): Documentation about Harbinger
- [harbinger-contracts](https://github.com/tacoinfra/harbinger-contracts): Contains reference implementations for Harbinger's smart contracts.
- [harbinger-cli](https://github.com/tacoinfra/harbinger-cli): Contains a CLI interface to deploy, update and interact with Harbinger's smart contracts.
- [harbinger-poster](https://github.com/tacoinfra/harbinger-poster): Contains a reference implementation of a posting service via AWS.
- [harbinger-signer](https://github.com/tacoinfra/harbinger-signer): Contains a reference implementation of a signing service that runs as a Serverless application on Amazon Web Services.
- [harbinger-lib](https://github.com/tacoinfra/harbinger-lib): Contains a core library shared among the above components.

## Credits

Harbinger is written and maintained by [Luke Youngblood](https://github.com/lyoungblood) and [Keefer Taylor](https://github.com/keefertaylor). 
