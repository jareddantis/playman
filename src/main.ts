import Vue from 'vue'
import App from './App.vue'
import eventBus from './plugins/eventBus'
import router from './plugins/router'
import store from './plugins/store'
import vuetify from './plugins/vuetify'
import './registerServiceWorker'
import './components'

Vue.use(eventBus)
Vue.config.productionTip = false

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount('#app')
