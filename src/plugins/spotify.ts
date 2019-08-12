import PromiseThrottle from 'promise-throttle'
import SpotifyWebApi from 'spotify-web-api-node'
import Worker from './spotify-worker'

export default class Spotify {
  private readonly client!: SpotifyWebApi
  private readonly environment: string = process.env.NODE_ENV as string
  private readonly throttler!: PromiseThrottle
  private expiry: number = 0
  private refreshToken: string = ''
  private state: string = ''
  private userCountry: string = ''
  private userId: string = ''

  constructor() {
    // Init state

    // Init Promise Throttler
    this.throttler = new PromiseThrottle({
      requestsPerSecond: 5,
    })

    // Init API client
    this.client = new SpotifyWebApi({
      redirectUri: this.redirectUri,
    })
  }

  /**
   * Spotify OAuth authorization prompt URI
   */
  get authUri(): string {
    const params: {[key: string]: string | boolean} = {
      client_id: 'a2d37a37164c48e48d3693491c20e7ae',
      response_type: 'code',
      redirect_uri: this.redirectUri,
      state: this.stateToken,
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
  }

  /**
   * Whether we are currently authenticated or not
   */
  get authenticated(): boolean {
    return this.refreshToken !== '' && this.expiry !== 0
  }

  /**
   * Spotify OAuth redirection URI
   */
  get redirectUri(): string {
    return `http${this.environment === 'production' ? 's://playman.jared.gq' : '://localhost:8080'}/callback`
  }

  /**
   * Spotify OAuth state token
   */
  get stateToken(): string {
    return this.state
  }
  set stateToken(token: string) {
    this.state = token
  }

  /**
   * Store user ID and country (username).
   * Used to filter available playlists and albums, and to create new playlists.
   *
   * @param id - User ID
   * @param country - User country
   */
  public setUserDetails(id: string, country: string) {
    this.userId = id
    this.userCountry = country
  }

  /**
   * Adds a set of tracks to a playlist.
   * Recursive function (API endpoint is paginated).
   *
   * @param id - Playlist ID
   * @param tracks - List of track IDs to add to playlist
   * @param resolve - Promise resolve() to be called after all tracks have been added
   * @param reject - Promise reject() to be called in the event of a Spotify API error
   */
  public async addTracksToPlaylist(id: string, tracks: any[],
                                   resolve: (arg0: any) => void, reject: (arg0: any) => void) {
    this.reauth().then(() => {
      this.throttler.add(() => {
        return this.client.addTracksToPlaylist(id, tracks.splice(0, 100))
      }).then((response: any) => {
        const snapshotId = response.body.snapshot_id

        if (tracks.length) {
          this.addTracksToPlaylist(id, tracks, resolve, reject)
        } else {
          resolve(snapshotId)
        }
      }).catch((error: any) => reject(new Error(error)))
    })
  }

  /**
   * Changes playlist metadata and cover image.
   *
   * @param id - Playlist ID
   * @param details - New playlist metadata and cover image. All fields optional.
   */
  public async changePlaylistDetails(id: string, details: any) {
    return new Promise((resolve, reject) => {
      this.reauth().then(() => {
        // Check if there is any cover art to commit
        if (details.hasOwnProperty('art')) {
          const art = details.art.split(',')[1]
          delete details.art
          this.throttler.add(() => fetch(`https://api.spotify.com/v1/playlists/${id}/images`, {
            method: 'PUT',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
              'Content-Type': 'image/jpeg',
              'Authorization': `Bearer ${this.client.getAccessToken()}`,
            },
            body: art,
          })).then(() => resolve())
            .catch((error: any) => reject(new Error(error)))
        }

        // Check if there are any details to commit
        if (Object.keys(details).length) {
          this.throttler.add(() => this.client.changePlaylistDetails(id, details))
            .then(() => resolve())
            .catch((error: any) => reject(new Error(error)))
        }
      })
    })
  }

  /**
   * Creates a playlist from a set of tracks.
   *
   * @param name - Name of new playlist
   * @param tracks - Tracks to add to new playlist
   */
  public async createPlaylist(name: string, tracks: string[]) {
    let id: string

    return new Promise((resolve, reject) => {
      this.reauth().then(() => {
        this.throttler.add(() => this.client.createPlaylist(this.userId, name, {public: false}))
          .then((response: any) => {
            id = response.body.id
            return new Promise((resolve1) => this.addTracksToPlaylist(id, tracks, resolve1, reject))
          })
          .then(() => resolve(id))
          .catch((error: any) => reject(new Error(error)))
      })
    })
  }

  /**
   * Removes duplicate tracks from a playlist.
   *
   * @param id - Playlist ID
   * @param tracks - Tracks to remove duplicates from
   */
  public async dedupPlaylist(id: string, tracks: any[]) {
    return new Promise((resolve, reject) => {
      this.deleteAllPlaylistTracks(id).then(() => {
        Worker.send({
          type: 'remove_duplicate_tracks',
          data: {tracks},
        }).then((result: any) => this.addTracksToPlaylist(id, result, resolve, reject))
      })
    })
  }

  /**
   * Removes all tracks from a playlist.
   *
   * @param id - Playlist ID
   */
  public async deleteAllPlaylistTracks(id: string) {
    return new Promise((resolve, reject) => {
      this.reauth().then(() => {
        this.throttler.add(() => {
          return this.client.replaceTracksInPlaylist(id, [])
        }).then((response: any) => resolve(response.body.snapshot_id))
          .catch((error: any) => reject(new Error(error)))
      })
    })
  }

  /**
   * Deletes a list of playlists (but really just unfollows them,
   * since that's what the official Spotify clients do, anyway...)
   *
   * @param ids - Playlist IDs to 'delete'
   * @param resolve - Promise resolve() to be called after playlists have been 'deleted'
   * @param reject - Promise reject() to be called in the event of a Spotify API error
   */
  public async deletePlaylists(ids: string[], resolve: () => void, reject: (arg0: any) => void) {
    if (ids.length) {
      const id = ids.splice(0, 1)[0]
      this.reauth().then(() => {
        this.throttler.add(() => this.client.unfollowPlaylist(id))
          .then(() => this.deletePlaylists(ids, resolve, reject))
          .catch((error: any) => reject(new Error(error)))
      })
    } else {
      resolve()
    }
  }

  /**
   * Removes a set of tracks from a playlist.
   * Recursive function (API endpoint accepts max 100 tracks per request).
   *
   * @param id - Playlist ID
   * @param snapshot - Playlist snapshot ID
   * @param tracks - Playlist tracks
   * @param resolve - Promise resolve() to be called after tracks have been removed
   * @param reject - Promise reject() to be called in the event of a Spotify API error
   */
  public async deletePlaylistTracks(id: string, snapshot: string, tracks: any[],
                                    resolve: (arg0: any) => void, reject: (arg0: any) => void) {
    this.reauth().then(() => {
      this.throttler.add(() => {
        return this.client.removeTracksFromPlaylistByPosition(id, tracks.splice(0, 100), snapshot)
      }).then((response: any) => {
        const snapshotId = response.body.snapshot_id

        if (tracks.length) {
          this.deletePlaylistTracks(id, snapshotId, tracks, resolve, reject)
        } else {
          resolve(snapshotId)
        }
      })
        .catch((error: any) => reject(new Error(error)))
    })
  }

  /**
   * Exports a playlist's tracks as TSV data to be downloaded by the user.
   *
   * @param name - Playlist name
   * @param tracks - Playlist tracks
   */
  public async exportPlaylist(name: string, tracks: any) {
    return new Promise((resolve, reject) => {
      Worker.send({type: 'tsv_encode_tracks', data: {name, tracks}})
      .then((exported: any) => resolve(exported))
      .catch((error: any) => reject(new Error(error)))
    })
  }

  /**
   * Exports multiple playlists as TSV files in a ZIP to be downloaded by the user.
   * Recursive function (API endpoint is paginated).
   *
   * @param ids - List of playlist IDs to back up
   * @param retrieved - Initial list to feed the recursive function with
   * @param resolve - Promise resolve() to be called after all playlists have been exported
   * @param reject - Promise reject() to be called in the event of a Spotify API error
   */
  public async exportPlaylists(ids: string[], retrieved: any[],
                               resolve: (arg0: any) => void, reject: (arg0: any) => void) {
    if (ids.length) {
      const id = ids.splice(0, 1)[0]
      this.getPlaylist(id).then((playlist: any) => {
        retrieved.push({
          name: playlist.details.name,
          id: playlist.details.id,
          tracks: playlist.tracks,
        })
        this.exportPlaylists(ids, retrieved, resolve, reject)
      }).catch((error: any) => reject(new Error(error)))
    } else {
      Worker.send({
        type: 'tsv_encode_multiple',
        data: {
          username: this.userId,
          playlists: retrieved,
        },
      }).then((exported: any) => resolve(exported))
        .catch((error: any) => reject(new Error(error)))
    }
  }

  /**
   * Gets all tracks in an album.
   * Recursive function (API endpoint is paginated).
   *
   * @param id - Album ID
   * @param initial - Initial list to feed the recursive function with
   * @param offset - Index of track from which to query the next 50 tracks
   * @param resolve - Promise resolve() to be called after all tracks have been retrieved
   * @param reject - Promise reject() to be called in the event of a Spotify API error
   */
  public async getAlbumTracks(id: string, initial: any[], offset: number,
                              resolve: (arg0: any) => void, reject: (arg0: any) => void) {
    const limit = 50

    this.reauth().then(() => {
      this.throttler.add(() => this.client.getAlbumTracks(id, {offset, limit}))
        .then((response: any) => {
          const results = initial.concat(response.body.items)

          // Check if we have everything
          if (response.body.next === null) {
            // We have everything! Now let's simplify the received data
            // into something we can easily consume
            Worker.send({type: 'decode_album_tracks', data: results})
              .then((reply) => resolve(reply))
          } else {
            // Retrieve next page
            this.getAlbumTracks(id, results, offset + limit, resolve, reject)
          }
        }).catch((error: any) => reject(new Error(error)))
    })
  }

  /**
   * Gets a list of all albums by an artist.
   * Recursive function (API endpoint is paginated).
   *
   * @param id - Artist ID
   * @param initial - Initial list to feed the recursive function with
   * @param offset - Index of album from which to query the next 50 albums
   * @param resolve - Promise resolve() to be called after all albums have been retrieved
   * @param reject - Promise reject() to be called in the event of a Spotify API error
   */
  public async getArtistAlbums(id: string, initial: any[], offset: number,
                               resolve: (arg0: any) => void, reject: (arg0: any) => void) {
    const limit = 50

    this.reauth().then(() => {
      this.throttler.add(() => this.client.getArtistAlbums(id, {
        include_groups: 'album,compilation,single',
        offset,
        limit,
      }))
        .then((response: any) => {
          const results = initial.concat(response.body.items)

          // Check if we have everything
          if (response.body.next === null) {
            // We have everything! Now let's simplify the received data
            // into something we can easily consume
            Worker.send({type: 'decode_albums', data: {results, country: this.userCountry}})
              .then((reply) => resolve(reply))
          } else {
            // Retrieve next page
            this.getArtistAlbums(id, results, offset + limit, resolve, reject)
          }
        }).catch((error: any) => reject(new Error(error)))
    })
  }

  /**
   * Retrieves details about the user currently logged in.
   */
  public async getMe() {
    return new Promise((resolve, reject) => {
      this.reauth().then(() => {
        this.throttler.add(() => this.client.getMe())
          .then((me: any) => resolve(me))
          .catch((error: any) => reject(new Error(error)))
      })
    })
  }

  /**
   * Retrieves details about a playlist.
   * Returns details along with the playlist's tracks, retrieved by this.getPlaylistTracks().
   *
   * @param id - Playlist ID
   */
  public async getPlaylist(id: string) {
    return new Promise((resolve, reject) => {
      this.reauth().then(() => {
        this.throttler.add(() => this.client.getPlaylist(id))
          .then((response: any) => {
            new Promise((resolve1, reject1) => {
              return this.getPlaylistTracks(id, [], 0, resolve1, reject1)
            }).then((tracks: any) => {
              const { body } = response
              resolve({
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
              })
            }).catch((error: any) => reject(new Error(error)))
          }).catch((error: any) => reject(new Error(error)))
      })
    })
  }

  /**
   * Gets a list of playlists that the current user owns.
   * Recursive function (API endpoint is paginated).
   *
   * @param initial - Initial list to feed the recursive function with
   * @param offset - Index of playlist from which to query the next 20 playlists
   * @param resolve - Promise resolve() to be called after all playlists have been retrieved
   * @param reject - Promise reject() to be called in the event of a Spotify API error
   */
  public async getUserPlaylists(initial: any[], offset: number,
                                resolve: (arg0: any) => void, reject: (arg0: any) => void) {
    const limit = 20

    this.reauth().then(() => {
      this.throttler.add(() => this.client.getUserPlaylists({offset, limit}))
        .then((response: any) => {
          const playlists = initial.concat(response.body.items)

          // Check if we have everything
          if (response.body.next === null) {
            // We have everything! Now let's filter the results to playlists that the user owns
            Worker.send({
              type: 'filter_user_playlists',
              data: {
                playlists,
                username: this.userId,
              },
            }).then((results) => resolve(results))
          } else {
            // Retrieve next page
            this.getUserPlaylists(playlists, offset + limit, resolve, reject)
          }
        }).catch((error: any) => reject(new Error(error)))
    })
  }

  /**
   * Merges two or more playlists into a new playlist.
   *
   * @param ids - Playlist IDs to merge
   */
  public async mergePlaylists(ids: string[]) {
    return new Promise(async (resolve, reject) => {
      // Merge playlist tracks...
      let tracks: string[] = []
      for (const id of ids) {
        const newTracks: string[] = await new Promise((resolve1, reject1) => {
          this.getPlaylistTracks(id, [], 0, resolve1, reject1)
        })
        tracks = tracks.concat(newTracks)
      }

      // ...then get the Spotify URI for each track...
      Worker.send({
        type: 'get_track_uris',
        data: tracks,
      }).then((uris) => {
        // ...then create a playlist
        this.createPlaylist('New Merged Playlist', uris as string[])
          .then(() => resolve())
          .catch((error: any) => reject(error))
      }).catch((error: any) => reject(error))
    })
  }

  /**
   * Removes a set of tracks from a playlist, consolidates them,
   * and reinserts them as one continuous set at a specified point in the playlist.
   *
   * @param id - Playlist ID
   * @param snapshot - Playlist snapshot ID (necessary for emptying current playlist; see comments in function)
   * @param tracks - Playlist tracks
   * @param tracksToReorder - Playlist track *indices* to reorder
   * @param placeTracksAfter - Playlist track *index* after which tracksToReorder will be inserted
   */
  public async reorderPlaylistTracks(id: string, snapshot: string, tracks: any[],
                                     tracksToReorder: number[], placeTracksAfter: number) {
    return new Promise((resolve, reject) => {
      // We can only add 100 tracks to the replace endpoint per request,
      // which means that it would be better to just delete everything first
      // and add the new reordered tracks in batches of 100.
      Worker.send({
        type: 'reorder_playlist_tracks',
        data: {tracks, tracksToReorder, placeTracksAfter},
      }).then((result: any) => this.replaceTracksInPlaylist(id, result))
        .then(() => resolve())
        .catch((error) => reject(error))
    })
  }

  /**
   * Removes refresh token and expiry timestamp,
   * which will cause this.authenticated = false,
   * which will then cause store.ts:authenticate to perform authentication.
   */
  public reset() {
    this.refreshToken = ''
    this.expiry = 0
  }

  /**
   * Searches the Spotify catalog for artists matching a query.
   *
   * @param query - Artist search query
   */
  public async searchArtists(query: string) {
    return new Promise((resolve, reject) => {
      this.reauth().then(() => {
        this.throttler.add(() => this.client.searchArtists(query, {limit: 10}))
          .then((response: any) => resolve(response.body.artists.items))
          .catch((error: any) => reject(new Error(error)))
      })
    })
  }

  /**
   * Stores the authorization tokens necessary for communicating with the Spotify API.
   *
   * @param access - OAuth access token
   * @param refresh - OAuth refresh token
   * @param expiry - OAuth access token expiration (in ms since epoch)
   */
  public async setTokens(access: string, refresh: string, expiry: number) {
    return new Promise((resolve, reject) => {
      this.refreshToken = refresh
      this.expiry = expiry

      this.reauth()
        .then((result: any) => {
          if (!result.expired) {
            this.client.setAccessToken(access)
          }
          resolve(result)
        })
        .catch((error) => reject(error))
    })
  }

  /**
   * Randomizes playlist tracks using the modern Fisher-Yates shuffle algorithm.
   *
   * @param id - Playlist ID
   * @param snapshot - Playlist snapshot ID (necessary for emptying current playlist; see this.reorderPlaylistTracks())
   * @param tracks - Playlist tracks
   */
  public async shufflePlaylist(id: string, snapshot: string, tracks: any[]) {
    return new Promise((resolve, reject) => {
      // Same concept as this.reorderPlaylistTracks,
      // but instead of taking a list of tracks to move to a specified start point,
      // we completely randomize the track order.
      Worker.send({
        type: 'shuffle_playlist_tracks',
        data: {tracks},
      }).then((result: any) => this.replaceTracksInPlaylist(id, result))
        .then(() => resolve())
        .catch((error) => reject(new Error(error)))
    })
  }

  /**
   * Randomizes multiple playlists.
   *
   * @param ids - Playlist IDs
   */
  public async shufflePlaylists(ids: string[]) {
    return new Promise(async (resolve, reject) => {
      for (const id of ids) {
        await this.getPlaylist(id).then((playlist: any) => {
          this.shufflePlaylist(id, playlist.details.snapshot, playlist.tracks)
        }).catch((error) => reject(error))
      }
      resolve()
    })
  }

  /**
   * Sorts a playlist's tracks by a given field.
   *
   * @param id - Playlist ID
   * @param tracks - Tracks to sort
   * @param mode - Track field to sort by. One of 'title', 'artist', and 'album'
   */
  public async sortPlaylist(id: string, tracks: any[], mode: string) {
    return new Promise((resolve, reject) => {
      Worker.send({
        type: 'sort_playlist_tracks',
        data: {tracks, mode},
      }).then((result: any) => this.replaceTracksInPlaylist(id, result))
        .then(() => resolve())
        .catch((error) => reject(error))
    })
  }

  /**
   * Gets a list of tracks present in a playlist.
   * Recursive function (API endpoint is paginated).
   *
   * @param id - Playlist ID
   * @param initial - Initial list to feed the recursive function with
   * @param offset - Index of track from which to query the next 100 tracks
   * @param resolve - Promise resolve() to be called after all tracks have been retrieved
   * @param reject - Promise reject() to be called in the event of a Spotify API error
   */
  private async getPlaylistTracks(id: string, initial: any[], offset: number,
                                  resolve: (arg0: any) => void, reject: (arg0: any) => void) {
    const limit = 100

    this.reauth().then(() => {
      this.throttler.add(() => this.client.getPlaylistTracks(id, {offset, limit}))
        .then((response: any) => {
          const results = initial.concat(response.body.items)

          // Check if we have everything
          if (response.body.next === null) {
            // We have everything! Now let's simplify the received data
            // into something we can easily consume
            Worker.send({type: 'decode_playlist_tracks', data: results})
              .then((reply) => resolve(reply))
          } else {
            // Retrieve next page
            this.getPlaylistTracks(id, results, offset + limit, resolve, reject)
          }
        }).catch((error: any) => reject(new Error(error)))
    })
  }

  /**
   * Requests a new Spotify OAuth access token.
   */
  private async reauth() {
    return new Promise((resolve, reject) => {
      if (new Date().getTime() >= this.expiry) {
        this.throttler.add(() => fetch(`/.netlify/functions/spotify-refresh-token`, {
          method: 'POST',
          cache: 'no-cache',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          body: `refresh_token=${this.refreshToken}`,
        })).then((response: any) => response.json())
          .then((result: any) => {
            const {access_token, expires_in} = result

            if (access_token !== undefined) {
              const expiry = (parseInt(expires_in, 10) * 1000) + new Date().getTime()
              this.client.setAccessToken(access_token)
              this.expiry = expiry
              resolve({
                expired: true,
                newExpiry: expiry,
                newToken: access_token,
              })
            } else {
              reject(new Error('Failed to authenticate'))
            }
          })
          .catch((error: any) => reject(new Error(error)))
      } else {
        // Token is still valid
        resolve({expired: false})
      }
    })
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
    return new Promise((resolve, reject) => {
      this.deleteAllPlaylistTracks(id)
        .then(() => this.addTracksToPlaylist(id, tracks, resolve, reject))
    })
  }
}
