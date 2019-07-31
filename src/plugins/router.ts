import Vue from 'vue'
import Router from 'vue-router'
import store from './store'

Vue.use(Router)

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import(/* webpackChunkName: "home" */ '../views/Home.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import(/* webpackChunkName: "login" */ '../views/Login.vue'),
    },
    {
      path: '/callback',
      name: 'callback',
      component: () => import(/* webpackChunkName: "callback" */ '../views/Callback.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
    },
  ],
})

// Redirect sensitive routes to landing if not authorized
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    store.dispatch('authenticate').then(() => {
      if (store.state.isLoggedIn) {
        next()
      } else {
        next({ path: '/login', replace: true })
      }
    }).catch(() => next({ path: '/login', replace: true }))
  } else {
    next()
  }
})

export default router
