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
    // User auth
    accessToken: '',
    refreshToken: '',
    isLoggedIn: false,

    // User details
    username: '',
    avatarUri: '',

    // User data
    playlists: [],
  }
}

Vue.use(Vuex)

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
    setLoggedIn: (state: any, loginStatus) => state.isLoggedIn = loginStatus,
    setPlaylists: (state, playlists) => state.playlists = playlists,
    setTokens: (state, authData) => Object.assign(state, authData),
    setUserAvatar: (state, uri) => state.avatarUri = uri,
    setUsername: (state, username) => state.username = username,
  },
  getters: {
    isLoggedIn: (state: any) =>  state.isLoggedIn,
    redirectUri: () => WRAPPER.redirectUri,
  },
  actions: {
    clearAllData: ({ commit }) => commit('reset'),
    openAuthWindow({ commit, dispatch }) {
      const authWindow = window.open(WRAPPER.authUri, 'Login with Spotify', 'width=480,height=480')
      authWindow!.addEventListener('beforeunload', () => {
        if (localStorage.getItem('spotify-login-data') !== null) {
          dispatch('authenticate', JSON.parse(localStorage.getItem('spotify-login-data') as string))
            .then(() => {
              commit('setLoggedIn', true)
              localStorage.removeItem('spotify-login-data')
            })
        }
      })
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
        const result = response.body as any
        commit('setUsername', result.id)
        commit('setUserAvatar', result.images[0].url)
      })
    },
  },
})
