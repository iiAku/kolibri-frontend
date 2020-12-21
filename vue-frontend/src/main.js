import Vue from 'vue'
import App from './App.vue'
import store from './store'
import router from './router'

require('clickout-event')

Vue.config.productionTip = false

Vue.prototype.$store = store
Vue.prototype.$eventBus = new Vue();

window.ctx = store

import VueSweetalert2 from 'vue-sweetalert2';
Vue.use(VueSweetalert2);

new Vue({
  render: h => h(App),
  router
}).$mount('#app')
