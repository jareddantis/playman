import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersist from 'vuex-persist'
import localforage from 'localforage'
import SpotifyApiWrapper from './spotifyApiWrapper'

const WRAPPER = new SpotifyApiWrapper()
const CLIENT = WRAPPER.client
const PERSISTENCE = new VuexPersist({
  key: 'setlist',
  storage: localforage,
})
function getInitialState(): { [key: string]: any } {
  return {
    accessToken: '',
    refreshToken: '',
    playlists: [],
    username: '',
  }
}

Vue.use(Vuex)
// @ts-ignore
export default new Vuex.Store({
  plugins: [ PERSISTENCE.plugin ],
  state: getInitialState(),
  mutations: {
    reset: (state: any) => {
      const initialState = getInitialState()
      Object.keys(initialState).forEach((key) => {
        Vue.set(state, key, initialState[key])
      })
    },
    setPlaylists: (state: any, playlists) => state.playlists = playlists,
    setTokens: (state, authData) => Object.assign(state, authData),
    setUsername: (state, username) => state.username = username,
  },
  getters: {
    isLoggedIn: (state: any) =>  state.refreshToken !== '',
    redirectUri: () => WRAPPER.redirectUri,
  },
  actions: {
    clearAllData: ({ commit }) => commit('reset'),
    openAuthWindow() {
      window.open(WRAPPER.authUri, 'Login with Spotify', 'width=480,height=480')
    },
    useTokens({ state }) {
      const { accessToken, refreshToken, expiry } = state as any
      return WRAPPER.setTokens(accessToken, refreshToken, expiry)
    },
    authenticate({ commit, dispatch }, payload) {
      // Store tokens from Spotify API
      commit('setTokens', {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token,
        expiry: payload.expires_in,
      })

      // Update playlists
      dispatch('useTokens').then(() => {
        dispatch('updateUserDetails')
        dispatch('updatePlaylists')
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
      return CLIENT.getMe().then((response) => {
        commit('setUsername', response.body.id)
      })
    },
  },
})
