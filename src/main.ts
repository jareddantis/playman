import Vue from 'vue'
import App from './App.vue'
import eventBus from './plugins/eventBus'
import router from './plugins/router'
import store from './plugins/store'
import vuetify from './plugins/vuetify'
import './registerServiceWorker'
import './styles/global.scss'
import './components/dialogs'
import VirtualScroller from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

Vue.use(eventBus)
Vue.use(VirtualScroller)
Vue.config.productionTip = false

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount('#app')
