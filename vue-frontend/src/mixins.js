export default {
    methods: {
        handleWalletError(err, title, message) {
            console.error("Error with wallet operation: ", err)
            let errString = message + "<br>"

            if (err.message === 'STALE_DATA') {
                errString += `<pre class="has-text-left">The Oracle data is too old to safely process your request!</pre>`
            } else {
                errString += `<pre class="has-text-left">${JSON.stringify(err, null, 2)}</pre>`
            }

            // debugger; // eslint-disable-line no-debugger

            if (err.stack) {
                errString += `<pre class="has-text-left">${err.stack}</pre>`
            }

            this.$swal(title, errString, 'error');
        },
        numberWithCommas(str) {
            let parts = str.toString().split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return parts.join(".");
        },
        borrowedTokens(ovenAddress) {
            if (!ovenAddress) { return 0 }
            if (!this.$store.ownedOvens[ovenAddress]) { return 0 }
            if (!this.$store.ownedOvens[ovenAddress].borrowedTokens) { return 0 }
            return this.$store.ownedOvens[ovenAddress].borrowedTokens
        },
        borrowedTokensFormatted(ovenAddress) {
            return this.borrowedTokens(ovenAddress).dividedBy(Math.pow(10, 18))
        },
        walletBalance() {
            return this.$store.walletBalance
        },
        walletBalanceFormatted() {
            return this.walletBalance().dividedBy(Math.pow(10, 18))
        },
        currentPrice() {
            return this.$store.priceData.price
        },
        currentPriceFormatted() {
            return this.currentPrice().dividedBy(Math.pow(10, 6))
        },
        ovenDollarValue(ovenAddress) {
            const currentHoldings = this.ovenBalanceFormatted(ovenAddress)
            const currentPrice = this.currentPriceFormatted()
            return currentPrice.multipliedBy(currentHoldings)
        },
        ovenDollarValuePlusDeposit(ovenAddress, depositAmount) {
            const currentHoldings = this.ovenBalanceFormatted(ovenAddress).plus(depositAmount)
            const currentPrice = this.currentPriceFormatted()
            return currentPrice.multipliedBy(currentHoldings)
        },
        ovenDollarValueMinusWithdraw(ovenAddress, withdrawAmount) {
            const currentHoldings = this.ovenBalanceFormatted(ovenAddress).minus(withdrawAmount)
            const currentPrice = this.currentPriceFormatted()
            return currentPrice.multipliedBy(currentHoldings)
        },
        maxBorrowAmtkUSD(ovenAddress) {
            const borrowedTokens = this.borrowedTokensFormatted(ovenAddress)
            const ovenValue = this.ovenDollarValue(ovenAddress)
            return ovenValue.dividedBy(2).minus(borrowedTokens).decimalPlaces(18)
        },
        collatoralizationWarningClasses(rate) {
            if (rate > 100) {
                return "is-danger"
            } else if (rate > 90) {
                return "is-warning"
            } else {
                return "is-primary"
            }
        },
        currentCollateralRate(ovenAddress) {
            const maxCollateral = this.ovenDollarValue(ovenAddress).dividedBy(2)

            const borrowedTokens = this.borrowedTokensFormatted(ovenAddress)

            return borrowedTokens.dividedBy(maxCollateral).times(100)
        },
        ovenBalance(ovenAddress) {
            if (!this.$store.ownedOvens[ovenAddress]) { return 0 }
            if (!this.$store.ownedOvens[ovenAddress].balance) { return 0 }
            return this.$store.ownedOvens[ovenAddress].balance
        },
        ovenBalanceFormatted(ovenAddress) {
            return this.ovenBalance(ovenAddress).dividedBy(Math.pow(10, 6))
        },
        ovenClient(ovenAddress) {
            return this.$store.getOvenClient(this.$store.wallet, ovenAddress)
        },
    },
    computed: {
    }
}
