import Vue from 'vue'
import Vuex from 'vuex'
import SpotifyApiWrapper from './spotifyApiWrapper'

const WRAPPER = new SpotifyApiWrapper()
const CLIENT = WRAPPER.client

Vue.use(Vuex)
export default new Vuex.Store({
  state: {
    isLoggedIn: false,
    playlists: [],
    username: '',
  },
  mutations: {
    setLoggedIn: (state, logInStatus) => state.isLoggedIn = logInStatus,
    setPlaylists: (state, playlists) => state.playlists = playlists,
    setUsername: (state, username) => state.username = username,
  },
  getters: {
    isLoggedIn: (state) => state.isLoggedIn,
    redirectUri: () => WRAPPER.redirectUri,
  },
  actions: {
    authenticate({ dispatch }) {
      const authWindow = window.open(WRAPPER.authUri, 'Login with Spotify', 'width=480,height=480')
      authWindow!.addEventListener('beforeunload', () => {
        if (localStorage.getItem('spotify-auth') !== undefined) {
          const authData = localStorage.getItem('spotify-auth') as string
          const { access_token, refresh_token, expires_in } = JSON.parse(authData)

          // Store tokens and delete from localStorage
          WRAPPER.setTokens(access_token, refresh_token, expires_in)
          localStorage.removeItem('spotify-auth')

          // Update playlists
          dispatch('updateUserDetails').then(() => {
            dispatch('updatePlaylists')
          })
        }
      })
    },
    updatePlaylists({ state, commit }) {
      return CLIENT.getUserPlaylists().then((response) => {
        commit('setPlaylists', response.body.items.filter((playlist: any) => {
          return playlist.owner.id === state.username
        }))
      })
    },
    updateUserDetails({ commit }) {
      commit('setLoggedIn', true)
      return CLIENT.getMe().then((response) => {
        commit('setUsername', response.body.id)
      })
    },
  },
})
