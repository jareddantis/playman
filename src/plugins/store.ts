import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersist from 'vuex-persist'
import Spotify from './spotify'

const api = new Spotify()
const persistence = new VuexPersist({
  key: 'playman',
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

    // Playlist currently viewing
    currentPlaylist: {},
    currentPlaylistTracks: [],
    checkedTracks: [],
    isReordering: false,

    // All playlists
    playlists: [],
    checkedPlaylists: [],
    isBatchEditing: false,

    // Connection status
    offline: false,
  }
}

Vue.use(Vuex)

const store = new Vuex.Store({
  plugins: [persistence.plugin],
  state: getInitialState(),
  mutations: {
    emptyCheckedPlaylists: (state) => state.checkedPlaylists = [],
    emptyCheckedTracks: (state) => state.checkedTracks = [],
    reset: (state: any) => {
      api.reset()
      const initialState = getInitialState()
      Object.keys(initialState).forEach((key) => {
        Vue.set(state, key, initialState[key])
      })
    },
    setIsBatchEditing: (state, isEditing) => state.isBatchEditing = isEditing,
    setIsReordering: (state, isReordering) => state.isReordering = isReordering,
    setLoggedIn: (state, loginStatus) => state.isLoggedIn = loginStatus,
    setOffline: (state, offline) => state.offline = offline,
    setPlaylist: (state, playlist) => state.currentPlaylist = Object.assign({}, state.currentPlaylist, playlist),
    setPlaylistChecked(state, {index, isChecked}) {
      const {id} = state.playlists[index]
      state.playlists[index].checked = isChecked

      if (isChecked) {
        if (!state.checkedPlaylists.includes(id)) {
          state.checkedPlaylists.push(id)
        }
      } else {
        state.checkedPlaylists = state.checkedPlaylists.filter((playlist: string) => playlist !== id)
      }
    },
    setPlaylists: (state, playlists) => state.playlists = playlists,
    setPlaylistTracks: (state, tracks) => state.currentPlaylistTracks = tracks,
    setTokens: (state, authData) => Object.assign(state, authData),
    setTrackChecked: (state, { index, isChecked }) => {
      state.currentPlaylistTracks[index].checked = isChecked
      if (isChecked) {
        state.checkedTracks.push(index)
      } else {
        state.checkedTracks.splice(state.checkedTracks.indexOf(index), 1)
      }
    },
    setUserAvatar: (state, uri) => state.avatarUri = uri,
    setUsername: (state, username) => state.username = username,
  },
  getters: {
    isLoggedIn: (state: any) => state.isLoggedIn,
    authUri: () => api.authUri,
    redirectUri: () => api.redirectUri,
  },
  actions: {
    async authenticate({state, commit, dispatch}) {
      return new Promise((resolve, reject) => {
        if (!api.authenticated) {
          const {accessToken, refreshToken, expiry} = state as any

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
                  commit('setLoggedIn', true)
                }
              })
              .then(() => dispatch('updateUserMeta'))
              .then(() => resolve())
              .catch((error) => reject(new Error(error)))
          }
        } else {
          // Already authenticated
          commit('setLoggedIn', true)
          resolve()
        }
      })
    },
    async createPlaylist(context, {details, tracks}) {
      return new Promise((resolve, reject) => {
        api.createPlaylist(details.name, tracks)
          .then((id: any) => api.changePlaylistDetails(id, details))
          .then(() => resolve())
          .catch((error: any) => reject(error))
      })
    },
    async changePlaylistDetails({state}, details) {
      return new Promise((resolve, reject) => {
        api.changePlaylistDetails(state.currentPlaylist.id, details)
          .then(() => resolve())
          .catch((error: any) => reject(error))
      })
    },
    async copyToPlaylist({state}, {id, tracks}) {
      return new Promise((resolve, reject) => api.addTracksToPlaylist(id, tracks, resolve, reject))
    },
    async deletePlaylists({state}, deleteMultiple: boolean) {
      return new Promise((resolve, reject) => {
        const ids = deleteMultiple ? state.checkedPlaylists : [state.currentPlaylist.id]
        api.deletePlaylists(ids, resolve, reject)
      })
    },
    async deletePlaylistTracks({state}) {
      return new Promise((resolve, reject) => {
        const { checkedTracks, currentPlaylistTracks } = state
        const { id, snapshot } = state.currentPlaylist

        if (checkedTracks.length === currentPlaylistTracks.length) {
          api.deleteAllPlaylistTracks(id)
            .then(() => resolve())
            .catch((error) => reject(error))
        } else {
          api.deletePlaylistTracks(id, snapshot, checkedTracks, resolve, reject)
        }
      })
    },
    async exportPlaylist({state}) {
      return api.exportPlaylist(state.currentPlaylist.name, state.currentPlaylistTracks)
    },
    async exportPlaylists({state}) {
      return new Promise((resolve, reject) => {
        api.exportPlaylists(state.checkedPlaylists, [], resolve, reject)
      })
    },
    async getPlaylist({commit}, id) {
      return api.getPlaylist(id).then((playlist: any) => {
        commit('emptyCheckedTracks')
        commit('setPlaylist', playlist.details)
        commit('setPlaylistTracks', playlist.tracks)
      })
    },
    async mergePlaylists({state}) {
      return api.mergePlaylists(state.checkedPlaylists)
    },
    async reorderPlaylistTracks({state}, placeTracksAfter) {
      const { checkedTracks, currentPlaylistTracks } = state
      const { id, snapshot } = state.currentPlaylist
      return api.reorderPlaylistTracks(id, snapshot, currentPlaylistTracks, checkedTracks, placeTracksAfter)
    },
    async shufflePlaylists({state}, shuffleMultiple: boolean) {
      if (shuffleMultiple) {
        return api.shufflePlaylists(state.checkedPlaylists)
      } else {
        const { id, snapshot } = state.currentPlaylist
        return api.shufflePlaylist(id, snapshot, state.currentPlaylistTracks)
      }
    },
    async toggleAllPlaylists({state, commit}, isChecked) {
      commit('emptyCheckedPlaylists')
      commit('setPlaylists', state.playlists.map((playlist: any) => {
        if (isChecked) {
          state.checkedPlaylists.push(playlist.id)
        }
        return Object.assign(playlist, {checked: isChecked})
      }))
    },
    async unsetPlaylist({commit}) {
      commit('emptyCheckedTracks')
      commit('setPlaylist', {})
      commit('setPlaylistTracks', [])
    },
    async updatePlaylists({commit}) {
      return new Promise((resolve, reject) => {
        api.getUserPlaylists([], resolve, reject)
      }).then((playlists: any) => commit('setPlaylists', playlists))
    },
    async updateUserMeta({commit}) {
      return new Promise((resolve, reject) => {
        // Store user avatar and username
        api.getMe().then((response: any) => {
          const result = response.body as any
          commit('setUserAvatar', result.images[0].url)
          commit('setUsername', result.id)
          api.userID = result.id
          resolve()
        }).catch((error) => reject(new Error(error)))
      })
    },
  },
})

export default store
