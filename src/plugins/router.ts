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
      name: 'landing',
      component: () => import(/* webpackChunkName: "landing" */ '../views/Landing.vue'),
    },
    {
      path: '/callback',
      name: 'callback',
      component: () => import(/* webpackChunkName: "callback" */ '../views/Callback.vue'),
    },
    {
      path: '/playlists',
      name: 'playlists',
      component: () => import(/* webpackChunkName: "playlists" */ '../views/Playlists.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/playlists/:id',
      name: 'playlist',
      component: () => import(/* webpackChunkName: "playlist" */ '../views/Playlist.vue'),
      meta: { requiresAuth: true },
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
  store.dispatch('authenticate')
    .then(() => {
      if (to.path === '/') {
        next({ path: '/playlists', replace: true })
      } else {
        next()
      }
    }).catch(() => next({ path: '/login', replace: true }))
})

export default router
