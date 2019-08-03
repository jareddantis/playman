import registerPromiseWorker from 'promise-worker/register'

const ops = {
  decodePlaylistTracks(tracks: any[]): any[] {
    const decoded = []

    for (const [ index, item ] of tracks.entries()) {
      const { track } = item
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
}

registerPromiseWorker((message) => {
  if (message.type === 'message') {
    const { type, data } = message.content

    switch (type) {
      case 'decode_playlist_tracks':
        return ops.decodePlaylistTracks(data)
      case 'filter_user_playlists':
        return ops.filterUserPlaylists(data.playlists, data.username)
    }
  }
})
