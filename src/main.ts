import Vue from 'vue'
import App from './App.vue'
import router from './views'
import store from './store'
import './registerServiceWorker'
import './plugins'

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app')
