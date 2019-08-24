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
      name: 'Home',
      component: () => import(/* webpackChunkName: "home" */ '../views/Home.vue'),
    },
    {
      path: '/callback',
      name: 'Callback',
      component: () => import(/* webpackChunkName: "callback" */ '../views/Callback.vue'),
    },
    {
      path: '/playlists',
      name: 'Playlists',
      component: () => import(/* webpackChunkName: "playlists" */ '../views/Playlists.vue'),
      meta: {requiresAuth: true},
    },
    {
      path: '/playlists/:id',
      name: 'Playlist',
      component: () => import(/* webpackChunkName: "playlist" */ '../views/Playlist.vue'),
      meta: {requiresAuth: true},
    },
  ],
})

// Redirect sensitive routes to landing if not authorized
router.beforeEach((to, from, next) => {
  if (to.path !== '/') {
    // Check for authentication
    if (to.meta.requiresAuth) {
      // Redirect to / (login) on failed auth,
      // otherwise continue as normal
      store.dispatch('authenticate')
        .then(() => next())
        .catch(() => next({path: '/', replace: true}))
    } else {
      // No need to authenticate, just continue as normal
      next()
    }
  } else {
    if (store.state.isLoggedIn) {
      // Redirect to /playlists on successful auth,
      // otherwise show / (login)
      store.dispatch('authenticate')
        .then(() => next('/playlists'))
        .catch(() => next())
    } else {
      // Not logged in, continue showing / (login)
      next()
    }
  }
})

export default router
