import JSZip from 'jszip'
import registerPromiseWorker from 'promise-worker/register'

const ops = {
  currentDate(): string {
    const now = new Date()
    const year = now.getFullYear()
    let month = `${now.getMonth() + 1}`
    let day = `${now.getDate()}`

    if (now.getMonth() < 9) { month = '0' + month }
    if (now.getDate() < 10) { day = '0' + day }

    return year.toString() + month + day
  },

  decodePlaylistTracks(tracks: any[]): any[] {
    const decoded = []

    for (const [index, item] of tracks.entries()) {
      const {track} = item
      decoded.push({
        title: track.name,
        album: track.album.name,
        artist: track.artists.length === 1 ? track.artists[0].name : this.generateArtists(track.artists),
        discNo: track.disc_number,
        trackNo: track.track_number,
        id: track.id,
        key: `${track.id}-${index}`,
        index,
        checked: false,
      })
    }

    return decoded
  },

  async encodeMultipleToTSV(data: any) {
    const {username, playlists} = data
    const zipName = `${username}-playlists-backup-${this.currentDate()}.zip`
    const zip = new JSZip()

    playlists.forEach((playlist: any) => {
      const {name, id, tracks} = playlist
      const {blob, filename} = this.encodeToTSV(`${name}-${id}`, tracks, false)
      zip.file(filename, blob)
    })

    const zipBlob = await zip.generateAsync({type: 'blob'})
    return {blob: zipBlob, filename: zipName}
  },

  encodeToTSV(playlistName: string, tracks: any[], single: boolean): any {
    let tsvString = '\ufeff'

    for (const [index, item] of tracks.entries()) {
      const {id, title, artist} = item
      const tsvRow = [
        `spotify:track:${id}`,
        title.replace(/\t/g, ' '),
        artist.replace(/\t/g, ' '),
      ]
      tsvString += tsvRow.join('\t')

      if (index < tracks.length - 1) {
        tsvString += '\n'
      }
    }

    return {
      blob: new Blob([tsvString], {type: 'data:text/tab-separated-values;charset=utf-8'}),
      filename: single ? `${playlistName}-backup-${this.currentDate()}.tsv` : `${playlistName}.tsv`,
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
    return this.tracksToUris(result)
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

    return this.tracksToUris(tracks)
  },

  sortPlaylistTracks(tracks: any[], mode: string) {
    let priority: string[]
    switch (mode.toLowerCase()) {
      case 'title':
        priority = ['title', 'artist', 'album']
        break
      case 'artist':
        priority = ['artist', 'album', 'trackNo']
        break
      case 'album':
        priority = ['album', 'trackNo', 'artist']
        break
    }

    tracks.sort((a, b) => {
      let i = 0
      let result = 0
      while (i < priority.length && result === 0) {
        let first = a[priority[i]]
        let second = b[priority[i]]

        if (priority[i] !== 'trackNo') {
          first = first.toLowerCase()
          second = second.toLowerCase()
        }

        result = first < second ? -1 : (first > second ? 1 : 0)
        i++
      }
      return result
    })

    return this.tracksToUris(tracks)
  },

  tracksToUris(tracks: any[]) {
    // Reduce tracks array into Spotify URIs
    const uris: string[] = []
    tracks.forEach((track: any) => uris.push(`spotify:track:${track.id}`))
    return uris
  },
}

registerPromiseWorker((message) => {
  if (message.type === 'message') {
    const {type, data} = message.content

    switch (type) {
      case 'tsv_encode_multiple':
        return ops.encodeMultipleToTSV(data)
      case 'tsv_encode_tracks':
        return ops.encodeToTSV(data.name, data.tracks, true)
      case 'decode_playlist_tracks':
        return ops.decodePlaylistTracks(data)
      case 'filter_user_playlists':
        return ops.filterUserPlaylists(data.playlists, data.username)
      case 'reorder_playlist_tracks':
        return ops.reorderPlaylistTracks(data.tracks, data.tracksToReorder, data.placeTracksAfter)
      case 'shuffle_playlist_tracks':
        return ops.shufflePlaylistTracks(data.tracks)
      case 'sort_playlist_tracks':
        return ops.sortPlaylistTracks(data.tracks, data.mode)
      case 'get_track_uris':
        return ops.tracksToUris(data)
    }
  }
})
