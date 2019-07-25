import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    isLoggedIn: false,
    playlists: [],
  },
  mutations: {
    setLoggedIn: (state, logInStatus) => state.isLoggedIn = logInStatus,
  },
  getters: {
    isLoggedIn: (state) => state.isLoggedIn,
    playlists: (state) => state.playlists,
  },
  actions: {

  },
})
