import JSZip from 'jszip'
import registerPromiseWorker from 'promise-worker/register'

const ops = {
  currentDate(): string {
    const now = new Date()
    const year = now.getFullYear()
    let month = `${now.getMonth() + 1}`
    let day = `${now.getDay()}`

    if (now.getMonth() < 9) { month = '0' + month }
    if (now.getDay() < 10) { day = '0' + day }

    return year.toString() + month + day
  },

  decodePlaylistTracks(tracks: any[]): any[] {
    const decoded = []

    for (const [index, item] of tracks.entries()) {
      const {track} = item
      decoded.push({
        album: track.album.name,
        artist: track.artists.length === 1 ? track.artists[0].name : this.generateArtists(track.artists),
        id: track.id,
        key: `${track.id}-${index}`,
        index,
        checked: false,
        name: track.name,
      })
    }

    return decoded
  },

  async encodeMultipleToCSV(data: any) {
    const {username, playlists} = data
    const zipName = `${username}-playlists-backup-${this.currentDate()}.zip`
    const zip = new JSZip()

    playlists.forEach((playlist: any) => {
      const {name, id, tracks} = playlist
      const {blob, filename} = this.encodeToCSV(`${name}-${id}`, tracks, false)
      zip.file(filename, blob)
    })

    const zipBlob = await zip.generateAsync({type: 'blob'})
    return {blob: zipBlob, filename: zipName}
  },

  encodeToCSV(playlistName: string, tracks: any, single: boolean): any {
    let csvString = '\ufeff'

    for (const track of tracks) {
      const {id, name, artist, album} = track
      const csvRow = [
        `spotify:track:${id}`,
        name, artist, album,
      ]
      csvString += '\n' + csvRow.join(',')
    }

    return {
      blob: new Blob([csvString], {type: 'data:text/csv;charset=utf-8'}),
      filename: single ? `${playlistName}-backup-${this.currentDate()}.csv` : `${playlistName}.csv`,
    }
  },

  filterUserPlaylists(playlists: any[], username: string): any[] {
    const filteredPlaylists: any[] = []

    for (const playlist of playlists) {
      if (playlist.owner.id === username) {
        playlist.checked = false
        playlist.index = filteredPlaylists.length
        filteredPlaylists.push(playlist)
      }
    }

    return filteredPlaylists
  },

  generateArtists(artists: any[]): string {
    let str = ''

    artists.forEach((artist, index) => {
      str += artist.name

      if (index < artists.length - 1) {
        str += ', '
      }
    })

    return str
  },

  reorderPlaylistTracks(tracks: any[], indices: number[], placeAfterIndex: number) {
    const tracksToMove: any = []

    // Go through the tracks backwards, so we don't mess up the indices
    indices.sort((a, b) => b - a)
    for (const index of indices) {
      const track = tracks.splice(index, 1)[0]
      track.checked = false
      tracksToMove.push(track)

      if (index < placeAfterIndex) {
        placeAfterIndex--
      }
    }

    // Merge new array
    const before = tracks.slice(0, placeAfterIndex + 1)
    const after = tracks.slice(placeAfterIndex + 1)
    const result = before.concat(tracksToMove.reverse(), after)

    // Reduce tracks array into Spotify URIs
    return result.map((track) => `spotify:track:${track.id}`)
  },

  shufflePlaylistTracks(tracks: any[]) {
    // Modern Fisher-Yates shuffle algorithm
    // from https://stackoverflow.com/a/6274381/3350320
    let j
    let x
    let i
    for (i = tracks.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1))
      x = tracks[i]
      tracks[i] = tracks[j]
      tracks[j] = x
    }

    // Reduce tracks array into Spotify URIs
    return tracks.map((track) => `spotify:track:${track.id}`)
  },

  tracksToUris(tracks: any[]) {
    const uris: string[] = []
    tracks.forEach((track: any) => uris.push(`spotify:track:${track.id}`))
    return uris
  },
}

registerPromiseWorker((message) => {
  if (message.type === 'message') {
    const {type, data} = message.content

    switch (type) {
      case 'csv_encode_multiple':
        return ops.encodeMultipleToCSV(data)
      case 'csv_encode_tracks':
        return ops.encodeToCSV(data.name, data.tracks, true)
      case 'decode_playlist_tracks':
        return ops.decodePlaylistTracks(data)
      case 'filter_user_playlists':
        return ops.filterUserPlaylists(data.playlists, data.username)
      case 'reorder_playlist_tracks':
        return ops.reorderPlaylistTracks(data.tracks, data.tracksToReorder, data.placeTracksAfter)
      case 'shuffle_playlist_tracks':
        return ops.shufflePlaylistTracks(data.tracks)
      case 'get_track_uris':
        return ops.tracksToUris(data)
    }
  }
})
