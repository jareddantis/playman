import registerPromiseWorker from 'promise-worker/register'
import Spotify from './spotify'

function authenticate(tokens: any): Promise<any> {
  const {refreshToken, expiry} = tokens

  return new Promise(async (resolve, reject) => {
    // Renew tokens if expiring within 15 min
    if (new Date().getTime() >= expiry - (15 * 60 * 1000)) {
      try {
        const result = await fetch(`/.netlify/functions/spotify-refresh-token`, {
          method: 'POST',
          cache: 'no-cache',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          body: `refresh_token=${refreshToken}`,
        }).then((response: any) => response.json())
        const {access_token, expires_in} = result

        if (access_token !== undefined) {
          resolve({
            accessToken: access_token,
            expired: true,
            expiry: (parseInt(expires_in, 10) * 1000) + new Date().getTime(),
          })
        } else {
          reject(new Error('Failed to authenticate'))
        }
      } catch (error) {
        reject(error)
      }
    } else {
      resolve({expired: false})
    }
  })
}

registerPromiseWorker(async (message) => {
  const {type, data, tokens, user} = message
  const {country, username} = user

  try {
    const authResult = await authenticate(tokens)

    if (type !== 'authenticate') {
      const accessToken = authResult.expired ? authResult.accessToken : tokens.accessToken
      const response = await fulfillRequest(accessToken, username, country, type, data)
      return {
        response,
        auth: authResult,
      }
    } else {
      return authResult
    }
  } catch (error) {
    throw error
  }
})

async function fulfillRequest(accessToken: string, id: string, country: string, type: string, data: any) {
  const api = new Spotify(accessToken, id, country)

  switch (type) {
    case 'addTracksToPlaylist':
      return await api.addTracksToPlaylist(data.id, data.tracks)
    case 'changePlaylistDetails':
      return await api.changePlaylistDetails(data.id, data.details)
    case 'createPlaylist':
      return await api.createPlaylist(data.details, data.tracks)
    case 'dedupPlaylist':
      return await api.dedupPlaylist(data.id, data.tracks)
    case 'deletePlaylists':
      return await api.deletePlaylists(data.ids)
    case 'deletePlaylistTracks':
      return await api.deletePlaylistTracks(data.id, data.snapshot, data.tracks)
    case 'emptyPlaylist':
      return await api.emptyPlaylist(data.id)
    case 'exportPlaylist':
      return await api.exportPlaylist(data.name, data.tracks)
    case 'exportPlaylists':
      return await api.exportPlaylists(data.ids)
    case 'getAlbumTracks':
      return await api.getAlbumTracks(data.id)
    case 'getArtistAlbums':
      return await api.getArtistAlbums(data.id)
    case 'getMe':
      return await api.getMe()
    case 'getPlaylist':
      return await api.getPlaylist(data.id)
    case 'getUserPlaylists':
      return await api.getUserPlaylists()
    case 'mergePlaylists':
      return await api.mergePlaylists(data.ids)
    case 'reorderPlaylistTracks':
      return await api.reorderPlaylistTracks(data.id, data.tracks, data.indices, data.placeAfterIndex)
    case 'searchArtists':
      return await api.searchArtists(data.query)
    case 'shufflePlaylist':
      return await api.shufflePlaylist(data.id, data.tracks)
    case 'shufflePlaylists':
      return await api.shufflePlaylists(data.ids)
    case 'sortPlaylist':
      return await api.sortPlaylist(data.id, data.tracks, data.mode)
    case 'toBase64':
      return await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(data.file)
        reader.onload = () => resolve((reader.result as string).trim())
        reader.onerror = (error) => reject(error)
      })
  }
}
