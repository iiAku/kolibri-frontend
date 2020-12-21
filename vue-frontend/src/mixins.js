export default {
    methods: {
        handleWalletError(err, title, message){
            console.error("Error with wallet operation: ", err)
            let errString = message + "<br>"

            if (err.message === 'STALE_DATA') {
                errString += `<pre class="has-text-left">The Oracle data is too old to safely process your request!</pre>`
            } else {
                errString += `<pre class="has-text-left">${JSON.stringify(err, null, 2)}</pre>`
            }

            // debugger; // eslint-disable-line no-debugger

            if (err.stack){
                errString += `<pre class="has-text-left">${err.stack}</pre>`
            }

            this.$swal(title, errString, 'error');
        }
    }
}
