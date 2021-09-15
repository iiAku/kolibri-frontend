import Vue from 'vue'
import App from './App.vue'
import store from './store'
import router from './router'

require('clickout-event')

Vue.config.productionTip = false

Vue.prototype.$store = store
Vue.prototype.$eventBus = new Vue();

// Enable/disable logging
// Vue.prototype.$log = message => console.log(message)
Vue.prototype.$log = () => {}

Vue.directive('focus', {
  inserted: function (el) {
      el.focus()
  }
})

window.ctx = store

import VueSweetalert2 from 'vue-sweetalert2';
Vue.use(VueSweetalert2);

import PortalVue from 'portal-vue'
Vue.use(PortalVue)

new Vue({
  render: h => h(App),
  router
}).$mount('#app')
