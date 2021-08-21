import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersist from 'vuex-persist'
import PromiseThrottle from 'promise-throttle'
import { send as api } from '../api'

const persistence = new VuexPersist({
  key: 'playman',
  storage: window.localStorage,
  reducer: (state: any) => ({
    accessToken: state.accessToken,
    country: state.country,
    expiry: state.expiry,
    refreshToken: state.refreshToken,
    stateToken: state.stateToken,
    isLoggedIn: state.isLoggedIn,
    username: state.username,
    avatarUri: state.avatarUri,
  }),
})
const throttler = new PromiseThrottle({requestsPerSecond: 5})

function getInitialState(): { [key: string]: any } {
  return {
    // User auth
    accessToken: '',
    expiry: 0,
    refreshToken: '',
    stateToken: '',
    isLoggedIn: false,

    // User details
    country: '',
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
    mutate: (state: any, payload: any[]) => Vue.set(state, payload[0], payload[1]),
    reset(state) {
      const initialState = getInitialState()
      Object.keys(initialState).forEach((key) => {
        Vue.set(state, key, initialState[key])
      })
    },
  },
  getters: {
    authUri(state) {
      const params: any = {
        client_id: process.env.SPID as string,
        response_type: 'code',
        redirect_uri: process.env.CALLBACK_URI as string,
        state: state.stateToken,
        scope: [
          'playlist-modify-private',
          'playlist-modify-public',
          'playlist-read-collaborative',
          'playlist-read-private',
          'ugc-image-upload',
          'user-read-private',
        ].join(' '),
        show_dialog: false,
      }
      const query: string = Object.keys(params)
        .map((key: string) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&')

      return `https://accounts.spotify.com/authorize?${query}`
    },
  },
  actions: {
    async authenticate({state, commit, dispatch}) {
      const {accessToken, refreshToken, expiry} = state as any
      try {
        if (!!accessToken && !!refreshToken && !!expiry) {
          const auth = await dispatch('spotify', {type: 'authenticate', data: null})
          if (auth.expired) {
            // Store new token and expiry
            commit('mutate', ['accessToken', auth.accessToken])
            commit('mutate', ['expiry', auth.expiry])
          }
          return
        } else {
          commit('reset')
          await Promise.reject(new Error('Incomplete or missing auth data in storage'))
        }
      } catch (error) {
        commit('reset')
        throw error
      }
    },
    async spotify({state, commit}, message) {
      const {accessToken, refreshToken, expiry, username, country} = state as any
      const {type, data} = message

      try {
        const result = await throttler.add(() => api({
          type, data,
          tokens: {accessToken, refreshToken, expiry},
          user: {country, username},
        }))

        if (type === 'authenticate') {
          return result
        } else {
          if (type === 'getMe' || (!!username && !!country)) {
            const {response, auth} = result

            if (auth.expired) {
              // Store new token and expiry
              commit('mutate', ['accessToken', auth.accessToken])
              commit('mutate', ['expiry', auth.expiry])
            }

            return response
          } else {
            await Promise.reject(new Error('Missing user information'))
          }
        }
      } catch (error) {
        if (error.message !== '404') {
          commit('mutate', ['offline', true])
        }
        throw error
      }
    },

    async exportPlaylists({state, dispatch}, single) {
      try {
        return await dispatch('spotify', {
          type: single ? 'exportPlaylist' : 'exportPlaylists',
          data: single ? {
            name: state.currentPlaylist.name,
            tracks: state.currentPlaylistTracks,
          } : {ids: state.checkedPlaylists},
        })
      } catch (error) {
        throw error
      }
    },
    async setPlaylistChecked({state}, {index, isChecked}) {
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
    async setStateToken({commit}) {
      const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      let result = ''
      for (let i = 0; i < 12; i++) {
        result += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
      }
      commit('mutate', ['stateToken', result])
    },
    async setTrackChecked({state}, {index, isChecked}) {
      state.currentPlaylistTracks[index].checked = isChecked
      if (isChecked) {
        if (!state.checkedTracks.includes(index)) {
          state.checkedTracks.push(index)
        }
      } else if (state.checkedTracks.includes(index)) {
        state.checkedTracks.splice(state.checkedTracks.indexOf(index), 1)
      }
    },
    async toggleAllPlaylists({state, commit}, isChecked) {
      commit('mutate', ['checkedPlaylists', []])
      commit('mutate', ['playlists', state.playlists.map((playlist: any) => {
        if (isChecked) {
          state.checkedPlaylists.push(playlist.id)
        }
        return Object.assign(playlist, {checked: isChecked})
      })])
    },
    async uncheckAllTracks({state}) {
      while (state.checkedTracks.length) {
        const index = state.checkedTracks.splice(0, 1)
        state.currentPlaylistTracks[index].checked = false
      }
    },
    async unsetPlaylist({commit}) {
      commit('mutate', ['checkedPlaylists', []])
      commit('mutate', ['checkedTracks', []])
      commit('mutate', ['currentPlaylist', {}])
      commit('mutate', ['currentPlaylistTracks', []])
    },
    async updatePlaylists({commit, dispatch}) {
      const playlists = await dispatch('spotify', {type: 'getUserPlaylists', data: null})
      commit('mutate', ['playlists', playlists])
    },
    async updateUserMeta({commit, dispatch}) {
      const meta = await dispatch('spotify', {type: 'getMe', data: null})
      commit('mutate', ['avatarUri', meta.images[0].url])
      commit('mutate', ['country', meta.country])
      commit('mutate', ['isLoggedIn', true])
      commit('mutate', ['username', meta.id])
    },
  },
})

export default store
