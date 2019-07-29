import Vue from 'vue'
import App from './App.vue'
import router from './views'
import eventBus from './plugins/eventBus'
import store from './plugins/store'
import './registerServiceWorker'
import './styles/global.styl'

Vue.use(eventBus)
Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app')
