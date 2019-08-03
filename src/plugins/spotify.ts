import qs from 'qs'
import PromiseThrottle from 'promise-throttle'
import SpotifyWebApi from 'spotify-web-api-node'
import Worker from './spotify-worker'

export default class Spotify {
  private readonly client!: SpotifyWebApi
  private readonly throttler!: PromiseThrottle
  private expiry: number = 0
  private refreshToken: string = ''
  private stateToken: string = ''

  constructor() {
    // Init state
    this.generateStateToken()

    // Init Promise Throttler
    this.throttler = new PromiseThrottle({
      requestsPerSecond: 5,
    })

    // Init API client
    this.client = new SpotifyWebApi({
      redirectUri: this.redirectUri,
    })
  }

  get authUri(): string {
    const API_QUERY = qs.stringify({
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
      ].join(' '),
      show_dialog: false,
    })

    return `https://accounts.spotify.com/authorize?${API_QUERY}`
  }

  get authenticated(): boolean {
    return this.refreshToken !== '' && this.expiry !== 0
  }

  get redirectUri(): string {
    return process.env.NODE_ENV === 'production' ? 'https://setlist.jared.gq/callback'
      : 'http://localhost:8080/callback'
  }

  public async changePlaylistDetails(id: string, details: any) {
    this.reauth().then(() => {
      return new Promise((resolve, reject) => {
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

  public async deleteAllPlaylistTracks(id: string, snapshot: string,
                                       resolve: (arg0: any) => void, reject: (arg0: any) => void) {
    this.reauth().then(() => {
      this.throttler.add(() => {
        return this.client.replaceTracksInPlaylist(id, [])
      }).then((response: any) => resolve(response.body.snapshot_id))
        .catch((error: any) => reject(new Error(error)))
    })
  }

  public async deletePlaylistTracks(id: string, tracks: any[], snapshot: string,
                                    resolve: (arg0: any) => void, reject: (arg0: any) => void) {
    this.reauth().then(() => {
      this.throttler.add(() => {
        return this.client.removeTracksFromPlaylistByPosition(id, tracks.splice(0, 100), snapshot)
      }).then((response: any) => {
        const snapshotId = response.body.snapshot_id

        if (tracks.length) {
          this.deletePlaylistTracks(id, tracks, snapshotId, resolve, reject)
        } else {
          resolve(snapshotId)
        }
      })
        .catch((error: any) => reject(new Error(error)))
    })
  }

  public async getMe() {
    return new Promise((resolve, reject) => {
      this.reauth().then(() => {
        this.throttler.add(() => this.client.getMe())
          .then((me: any) => resolve(me))
          .catch((error: any) => reject(new Error(error)))
      })
    })
  }

  public async getPlaylist(id: string) {
    return new Promise((resolve, reject) => {
      this.reauth().then(() => {
        this.throttler.add(() => this.client.getPlaylist(id))
          .then((playlist: any) => resolve(playlist))
          .catch((error: any) => reject(new Error(error)))
      })
    })
  }

  public async getPlaylistTracks(id: string, initial: any[], offset: number,
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

  public async getUserPlaylists(username: string) {
    return new Promise((resolve, reject) => {
      this.reauth().then(() => {
        this.throttler.add(() => this.client.getUserPlaylists())
          .then((response: any) => {
            Worker.send({ type: 'filter_user_playlists', data: {
                playlists: response.body.items,
                username,
              }})
              .then((playlists) => resolve(playlists))
          }).catch((error: any) => reject(new Error(error)))
      })
    })
  }

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

  private generateStateToken() {
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''

    for (let i = 0; i < 12; i++) {
      result += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
    }

    this.stateToken = result
  }

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
        resolve({ expired: false })
      }
    })
  }
}
