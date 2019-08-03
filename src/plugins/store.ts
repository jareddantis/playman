import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersist from 'vuex-persist'
import Spotify from './spotify'

const api = new Spotify()
const persistence = new VuexPersist({
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

    // Connection status
    offline: false,
  }
}

Vue.use(Vuex)

const store = new Vuex.Store({
  plugins: [ persistence.plugin ],
  state: getInitialState(),
  mutations: {
    reset: (state: any) => {
      const initialState = getInitialState()
      Object.keys(initialState).forEach((key) => {
        Vue.set(state, key, initialState[key])
      })
    },
    setLoggedIn: (state: any, loginStatus) => state.isLoggedIn = loginStatus,
    setOffline: (state, offline) => state.offline = offline,
    setPlaylists: (state, playlists) => state.playlists = playlists,
    setTokens: (state, authData) => Object.assign(state, authData),
    setUserAvatar: (state, uri) => state.avatarUri = uri,
    setUsername: (state, username) => state.username = username,
  },
  getters: {
    isLoggedIn: (state: any) =>  state.isLoggedIn,
    authUri: () => api.authUri,
    redirectUri: () => api.redirectUri,
  },
  actions: {
    async authenticate({ state, commit, dispatch }) {
      return new Promise((resolve, reject) => {
        if (!api.authenticated) {
          const { accessToken, refreshToken, expiry } = state as any

          if (accessToken === '' || refreshToken === '' || expiry === 0) {
            reject(new Error('Not authenticated'))
          } else {
            api.setTokens(accessToken, refreshToken, expiry)
              .then((results: any) => {
                if (results.expired) {
                  // Store new token and expiry
                  commit('setTokens', {
                    accessToken: results.newToken,
                    expiry: results.newExpiry,
                  })
                }

                dispatch('updateUserMeta')
              })
              .then(() => resolve())
              .catch((error) => reject(new Error(error)))
          }
        } else {
          // Already authenticated
          resolve()
        }
      })
    },
    async clearAllData({ commit }) {
      return new Promise((resolve) => {
        commit('reset')
        resolve()
      })
    },
    async deletePlaylistTracks(context, { id, snapshot, tracks }) {
      return new Promise((resolve, reject) => {
        api.deletePlaylistTracks(id, tracks, snapshot, resolve, reject)
      })
    },
    async getPlaylist({ state }, id) {
      return new Promise((resolve, reject) => {
        api.getPlaylist(id)
          .then((response: any) => resolve(response.body))
          .catch((error) => reject(error))
      })
    },
    async getPlaylistTracks(context, id) {
      return new Promise((resolve, reject) => {
        api.getPlaylistTracks(id, [], 0, resolve, reject)
      })
    },
    async updatePlaylists({ state, commit }) {
      return new Promise((resolve, reject) => {
        api.getUserPlaylists(state.username)
          .then((playlists) => {
            commit('setPlaylists', playlists)
            resolve()
          })
          .catch((error) => reject(error))
      })
    },
    async updateUserMeta({ commit }) {
      return new Promise((resolve, reject) => {
        // Store user avatar and username
        api.getMe().then((response: any) => {
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
