import Vue from 'vue'
import App from './App.vue'
import eventBus from './plugins/event-bus'
import router from './plugins/router'
import store from './plugins/store'
import vuetify from './plugins/vuetify'
import './plugins/service-worker'
import './plugins/virtual-scroller'
import './components/dialogs'
import './styles/global.scss'

Vue.use(eventBus)
Vue.config.productionTip = false

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount('#app')
