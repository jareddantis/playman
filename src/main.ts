import Vue from 'vue'
import App from './App.vue'
import eventBus from './plugins/event-bus'
import {router, store, vuetify} from './plugins'
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
