import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import(/* webpackChunkName: "home" */ './Home.vue'),
    },
    {
      path: '/callback',
      name: 'callback',
      component: () => import(/* webpackChunkName: "callback" */ './Callback.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import(/* webpackChunkName: "about" */ './About.vue'),
    },
  ],
})
