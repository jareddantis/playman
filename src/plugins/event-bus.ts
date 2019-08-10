import Vue from 'vue'

Vue.use({
  install: (localVue: typeof Vue) => {
    localVue.prototype.$bus = new Vue()
  },
})
