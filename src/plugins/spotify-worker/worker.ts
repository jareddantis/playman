import registerPromiseWorker from 'promise-worker/register'

const ops = {
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

  filterUserPlaylists(playlists: any[], username: string): any[] {
    return playlists.filter((playlist: any) => {
      return playlist.owner.id === username
    })
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
}

registerPromiseWorker((message) => {
  if (message.type === 'message') {
    const {type, data} = message.content

    switch (type) {
      case 'decode_playlist_tracks':
        return ops.decodePlaylistTracks(data)
      case 'filter_user_playlists':
        return ops.filterUserPlaylists(data.playlists, data.username)
      case 'reorder_playlist_tracks':
        return ops.reorderPlaylistTracks(data.tracks, data.tracksToReorder, data.placeTracksAfter)
    }
  }
})
