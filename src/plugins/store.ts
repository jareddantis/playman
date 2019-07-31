import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersist from 'vuex-persist'
import SpotifyApiWrapper from './spotifyApiWrapper'

const WRAPPER = new SpotifyApiWrapper()
const CLIENT = WRAPPER.client
const PERSISTENCE = new VuexPersist({
  key: 'setlist',
  storage: window.localStorage,
  reducer: (state: any) => ({
    accessToken: state.accessToken,
    expiry: state.expiry,
    refreshToken: state.refreshToken,
    isLoggedIn: state.isLoggedIn,
    username: state.username,
    avatarUri: state.avatarUri,
  }),
})
function getInitialState(): { [key: string]: any } {
  return {
    // User auth
    accessToken: '',
    expiry: 0,
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

const store = new Vuex.Store({
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
    authUri: () => WRAPPER.authUri,
    redirectUri: () => WRAPPER.redirectUri,
  },
  actions: {
    authenticate({ state, dispatch }) {
      return new Promise((resolve, reject) => {
        if (!WRAPPER.authenticated) {
          const { accessToken, refreshToken, expiry } = state as any

          if (accessToken === '' || refreshToken === '' || expiry === 0) {
            reject(new Error('Not authenticated'))
          } else {
            WRAPPER.setTokens(accessToken, refreshToken, expiry)
              .then(() => dispatch('updateUserMeta'))
              .then(() => resolve())
              .catch((error) => reject(new Error(error)))
          }
        } else {
          // Already authenticated
          resolve()
        }
      })
    },
    clearAllData: ({ commit }) => commit('reset'),
    getPlaylist({ state }, id) {
      return new Promise((resolve, reject) => {
        CLIENT.getPlaylist(id)
          .then((response) => resolve(response.body))
          .catch((error) => reject(new Error(error)))
      })
    },
    getPlaylistTracks(context, id) {
      return new Promise((resolve, reject) => {
        CLIENT.getPlaylistTracks(id, { fields: 'items' })
          .then((response) => resolve(response.body.items))
          .catch((error) => reject(new Error(error)))
      })
    },
    updatePlaylists({ state, commit }) {
      return new Promise((resolve, reject) => {
        CLIENT.getUserPlaylists().then((response) => {
          commit('setPlaylists', response.body.items.filter((playlist: any) => {
            return playlist.owner.id === state.username
          }))
          resolve()
        }).catch((error) => reject(new Error(error)))
      })
    },
    updateUserMeta({ commit }) {
      return new Promise((resolve, reject) => {
        // Store user avatar and username
        CLIENT.getMe().then((response) => {
          const result = response.body as any
          commit('setLoggedIn', true)
          commit('setUserAvatar', result.images[0].url)
          commit('setUsername', result.id)
          resolve()
        }).catch((error) => reject(new Error(error)))
      })
    },
  },
})

export default store
