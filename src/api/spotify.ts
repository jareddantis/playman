import utils from './utils'
import SpotifyWebApi from 'spotify-web-api-node'

export default class Spotify {
  private readonly client!: SpotifyWebApi
  private readonly userCountry!: string
  private readonly userId!: string

  constructor(accessToken: string, userId: string, userCountry: string) {
    // Init API client
    this.client = new SpotifyWebApi({
      redirectUri: process.env.CALLBACK_URI,
    })

    // Store tokens and user info
    this.client.setAccessToken(accessToken)
    this.userId = userId
    this.userCountry = userCountry
  }

  /**
   * Adds a set of tracks to a playlist.
   *
   * @param id - Playlist ID
   * @param tracks - List of track IDs to add to playlist
   */
  public async addTracksToPlaylist(id: string, tracks: any[]): Promise<string> {
    let newSnapshotId: string = ''

    while (tracks.length) {
      try {
        const response = await this.client.addTracksToPlaylist(id, tracks.splice(0, 100))
        newSnapshotId = response.body.snapshot_id
      } catch (error) {
        throw new Error(error.statusCode)
      }
    }

    return newSnapshotId
  }

  /**
   * Changes playlist metadata and cover image.
   *
   * @param id - Playlist ID
   * @param details - New playlist metadata and cover image. All fields optional.
   */
  public async changePlaylistDetails(id: string, details: any) {
    try {
      // Check if there is any cover art to commit
      if (details.hasOwnProperty('art')) {
        const art = details.art.split(',')[1]
        delete details.art
        await fetch(`https://api.spotify.com/v1/playlists/${id}/images`, {
          method: 'PUT',
          mode: 'cors',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'image/jpeg',
            'Authorization': `Bearer ${this.client.getAccessToken()}`,
          },
          body: art,
        })
      }

      // Check if there are any details to commit
      if (Object.keys(details).length) {
        await this.client.changePlaylistDetails(id, details)
      }
    } catch (error) {
      throw new Error(error.statusCode)
    }
  }

  /**
   * Creates a playlist from a set of tracks.
   *
   * @param details - Details of new playlist
   * @param tracks - Tracks to add to new playlist
   */
  public async createPlaylist(details: any, tracks: string[]) {
    try {
      const {name} = details
      const id = await this.client.createPlaylist(this.userId, name, {public: false})
        .then((response: any) => response.body.id)
      await this.addTracksToPlaylist(id, tracks)
      await this.changePlaylistDetails(id, details)
    } catch (error) {
      throw new Error(error.statusCode)
    }
  }

  /**
   * Removes duplicate tracks from a playlist.
   *
   * @param id - Playlist ID
   * @param tracks - Tracks to remove duplicates from
   */
  public async dedupPlaylist(id: string, tracks: any[]) {
    try {
      await this.emptyPlaylist(id).then(() => {
        return this.addTracksToPlaylist(id, utils.removeDuplicateTracks(tracks))
      })
    } catch (error) {
      throw new Error(error.statusCode)
    }
  }

  /**
   * Deletes a list of playlists (but really just unfollows them,
   * since that's what the official Spotify clients do, anyway...)
   *
   * @param ids - Playlist IDs to 'delete'
   */
  public async deletePlaylists(ids: string[]) {
    while (ids.length) {
      const id = ids.splice(0, 1)[0]

      try {
        await this.client.unfollowPlaylist(id)
      } catch (error) {
        throw new Error(error.statusCode)
      }
    }
  }

  /**
   * Removes a set of tracks from a playlist.
   *
   * @param id - Playlist ID
   * @param snapshot - Playlist snapshot ID
   * @param tracks - Playlist tracks
   */
  public async deletePlaylistTracks(id: string, snapshot: string, tracks: any[]) {
    let newSnapshotId: string = ''

    while (tracks.length) {
      try {
        const tracksToRemove = tracks.splice(0, 100)
        const response = await this.client.removeTracksFromPlaylistByPosition(id, tracksToRemove, snapshot)
        newSnapshotId = response.body.snapshot_id
      } catch (error) {
        throw new Error(error.statusCode)
      }
    }

    return newSnapshotId
  }

  /**
   * Removes all tracks from a playlist.
   *
   * @param id - Playlist ID
   */
  public async emptyPlaylist(id: string) {
    try {
      await this.client.replaceTracksInPlaylist(id, [])
    } catch (error) {
      throw new Error(error.statusCode)
    }
  }

  /**
   * Exports a playlist's tracks as TSV data to be downloaded by the user.
   *
   * @param name - Playlist name
   * @param tracks - Playlist tracks
   */
  public async exportPlaylist(name: string, tracks: any) {
    return utils.encodeToTSV(name, tracks, true)
  }

  /**
   * Exports multiple playlists as TSV files in a ZIP to be downloaded by the user.
   *
   * @param ids - List of playlist IDs to back up
   */
  public async exportPlaylists(ids: string[]) {
    const retrieved: any[] = []

    while (ids.length) {
      const id = ids.splice(0, 1)[0]

      try {
        await this.getPlaylist(id).then((playlist: any) => {
          retrieved.push({
            name: playlist.details.name,
            id: playlist.details.id,
            tracks: playlist.tracks,
          })
        })
      } catch (error) {
        throw new Error(error.statusCode)
      }
    }

    return utils.encodeMultipleToTSV(this.userId, retrieved)
  }

  /**
   * Gets all tracks in an album.
   *
   * @param id - Album ID
   */
  public async getAlbumTracks(id: string) {
    const limit = 50
    let offset = 0
    let tracks: any[] = []
    let hasNext = true

    while (hasNext) {
      try {
        const body = await this.client.getAlbumTracks(id, {offset, limit})
          .then((response: any) => response.body)

        tracks = tracks.concat(body.items)
        hasNext = body.next !== null
        offset += limit
      } catch (error) {
        throw new Error(error.statusCode)
      }
    }

    return utils.decodeAlbumTracks(tracks)
  }

  /**
   * Gets a list of all albums by an artist.
   *
   * @param id - Artist ID
   */
  public async getArtistAlbums(id: string) {
    const limit = 50
    let offset = 0
    let albums: any[] = []
    let hasNext = true

    while (hasNext) {
      try {
        const body = await this.client.getArtistAlbums(id, {
          include_groups: 'album,compilation,single',
          offset, limit,
        }).then((response: any) => response.body)

        albums = albums.concat(body.items)
        hasNext = body.next !== null
        offset += limit
      } catch (error) {
        throw new Error(error.statusCode)
      }
    }

    return utils.decodeAlbums(albums, this.userCountry)
  }

  /**
   * Retrieves details about the user currently logged in.
   */
  public async getMe() {
    return await this.client.getMe().then((response: any) => response.body)
  }

  /**
   * Retrieves details about a playlist.
   * Returns details along with the playlist's tracks, retrieved by this.getPlaylistTracks().
   *
   * @param id - Playlist ID
   */
  public async getPlaylist(id: string) {
    try {
      const body = await this.client.getPlaylist(id).then((response: any) => response.body)

      if (body.owner.id === this.userId) {
        const tracks = await this.getPlaylistTracks(id)

        return {
          details: {
            art: body.images,
            name: body.name,
            desc: body.description,
            id,
            isCollab: body.collaborative,
            isPublic: body.public === true,
            snapshot: body.snapshot_id,
          },
          tracks,
        }
      } else {
        await Promise.reject(new Error('403'))
      }
    } catch (error) {
      throw new Error(error.statusCode)
    }
  }

  /**
   * Gets a list of playlists that the current user owns.
   */
  public async getUserPlaylists() {
    const limit = 20
    let offset = 0
    let playlists: any[] = []
    let hasNext = true

    while (hasNext) {
      try {
        const body = await this.client.getUserPlaylists({offset, limit}).then((response: any) => response.body)

        playlists = playlists.concat(body.items)
        hasNext = body.next !== null
        offset += limit
      } catch (error) {
        throw new Error(error.statusCode)
      }
    }

    return utils.filterUserPlaylists(playlists, this.userId)
  }

  /**
   * Merges two or more playlists into a new playlist.
   *
   * @param ids - Playlist IDs to merge
   */
  public async mergePlaylists(ids: string[]) {
    try {
      // Merge playlist tracks...
      let tracks: string[] = []
      for (const id of ids) {
        tracks = tracks.concat(await this.getPlaylistTracks(id))
      }

      // ...then get the Spotify URI for each track...
      const uris: string[] = utils.tracksToUris(tracks)

      // ...then create a playlist
      await this.createPlaylist('New Merged Playlist', uris)
    } catch (error) {
      throw new Error(error.statusCode)
    }
  }

  /**
   * Removes a set of tracks from a playlist, consolidates them,
   * and reinserts them as one continuous set at a specified point in the playlist.
   *
   * @param id - Playlist ID
   * @param tracks - Playlist tracks
   * @param indices - Playlist track indices to reorder
   * @param placeAfterIndex - Playlist track index after which indices[] will be inserted
   */
  public async reorderPlaylistTracks(id: string, tracks: any[], indices: number[], placeAfterIndex: number) {
    const reorderedTracks = utils.reorderPlaylistTracks(tracks, indices, placeAfterIndex)
    try {
      await this.replaceTracksInPlaylist(id, reorderedTracks)
    } catch (error) {
      throw new Error(error.statusCode)
    }
  }

  /**
   * Searches the Spotify catalog for artists matching a query.
   *
   * @param query - Artist search query
   */
  public async searchArtists(query: string) {
    try {
      return await this.client.searchArtists(query, {limit: 10})
        .then((response: any) => response.body.artists.items)
    } catch (error) {
      throw new Error(error.statusCode)
    }
  }

  /**
   * Randomizes playlist tracks.
   *
   * @param id - Playlist ID
   * @param tracks - Playlist tracks
   */
  public async shufflePlaylist(id: string, tracks: any[]) {
    const shuffledTracks = utils.shufflePlaylistTracks(tracks)

    try {
      await this.replaceTracksInPlaylist(id, shuffledTracks)
    } catch (error) {
      throw new Error(error.statusCode)
    }
  }

  /**
   * Randomizes multiple playlists.
   *
   * @param ids - Playlist IDs
   */
  public async shufflePlaylists(ids: string[]) {
    for (const id of ids) {
      try {
        await this.getPlaylist(id).then((playlist: any) => {
          this.shufflePlaylist(id, playlist.tracks)
        })
      } catch (error) {
        throw new Error(error.statusCode)
      }
    }
  }

  /**
   * Sorts a playlist's tracks by a given field.
   *
   * @param id - Playlist ID
   * @param tracks - Tracks to sort
   * @param mode - Track field to sort by. One of 'title', 'artist', and 'album'
   */
  public async sortPlaylist(id: string, tracks: any[], mode: string) {
    const sortedTracks = utils.sortPlaylistTracks(tracks, mode)

    try {
      await this.replaceTracksInPlaylist(id, sortedTracks)
    } catch (error) {
      throw new Error(error.statusCode)
    }
  }

  /**
   * Gets a list of tracks present in a playlist.
   *
   * @param id - Playlist ID
   */
  private async getPlaylistTracks(id: string) {
    const limit = 100
    let offset = 0
    let tracks: any[] = []
    let hasNext = true

    while (hasNext) {
      try {
        const body = await this.client.getPlaylistTracks(id, {offset, limit})
          .then((response: any) => response.body)

        tracks = tracks.concat(body.items)
        hasNext = body.next !== null
        offset += limit
      } catch (error) {
        throw new Error(error.statusCode)
      }
    }

    return utils.decodePlaylistTracks(tracks)
  }

  /**
   * Replaces all tracks in a playlist.
   * We use our own implementation instead of the Spotify Node API implementation
   * because that cannot handle more than 100 tracks at once (limitation of the Spotify API).
   *
   * @param id - Playlist ID
   * @param tracks - Tracks to replace playlist contents with
   */
  private async replaceTracksInPlaylist(id: string, tracks: string[]) {
    // We can only add 100 tracks to the replace endpoint per request,
    // which means that it would be better to just delete everything first
    // and add the new reordered tracks in batches of 100.
    return await this.emptyPlaylist(id).then(() => {
      return this.addTracksToPlaylist(id, tracks)
    })
  }
}
