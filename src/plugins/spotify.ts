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

  public async setTokens(access: string, refresh: string, expiry: number) {
    return new Promise((resolve, reject) => {
      this.refreshToken = refresh

      if (new Date().getTime() >= expiry) {
        if (expiry === 0) {
          reject(new Error('Invalid expiry'))
        }

        this.reauth()
          .then((result: any) => resolve({
            expired: true,
            newExpiry: result.expiry,
            newToken: result.access_token,
          }))
          .catch((error) => reject(error))
      } else {
        this.client.setAccessToken(access)
        this.expiry = expiry
        resolve({ expired: false })
      }
    })
  }

  public async deleteAllPlaylistTracks(id: string, snapshot: string,
                                       resolve: (arg0: any) => void, reject: (arg0: any) => void) {
    this.throttler.add(() => {
      return this.client.replaceTracksInPlaylist(id, [])
    }).then((response: any) => resolve(response.body.snapshot_id))
      .catch((error: any) => reject(new Error(error)))
  }

  public async deletePlaylistTracks(id: string, tracks: any[], snapshot: string,
                                    resolve: (arg0: any) => void, reject: (arg0: any) => void) {
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
  }

  public async getMe() {
    return new Promise((resolve, reject) => {
      this.throttler.add(() => this.client.getMe())
        .then((me: any) => resolve(me))
        .catch((error: any) => reject(new Error(error)))
    })
  }

  public async getPlaylist(id: string) {
    return new Promise((resolve, reject) => {
      this.throttler.add(() => this.client.getPlaylist(id))
        .then((playlist: any) => resolve(playlist))
        .catch((error: any) => reject(new Error(error)))
    })
  }

  public async getPlaylistTracks(id: string, initial: any[], offset: number,
                                 resolve: (arg0: any) => void, reject: (arg0: any) => void) {
    const limit = 100

    this.throttler.add(() => this.client.getPlaylistTracks(id, { offset, limit }))
      .then((response: any) => {
        const results = initial.concat(response.body.items)

        // Check if we have everything
        if (response.body.next === null) {
          // We have everything! Now let's simplify the received data
          // into something we can easily consume
          Worker.send({ type: 'decode_playlist_tracks', data: results })
            .then((reply) => resolve(reply))
        } else {
          // Retrieve next page
          this.getPlaylistTracks(id, results, offset + limit, resolve, reject)
        }
      }).catch((error: any) => reject(new Error(error)))
  }

  public async getUserPlaylists(username: string) {
    return new Promise((resolve, reject) => {
      this.throttler.add(() => this.client.getUserPlaylists())
        .then((response: any) => {
          Worker.send({ type: 'filter_user_playlists', data: {
            playlists: response.body.items,
            username,
          }})
          .then((playlists) => resolve(playlists))
      }).catch((error: any) => reject(new Error(error)))
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
      fetch(`/.netlify/functions/spotify-refresh-token`, {
        method: 'POST',
        cache: 'no-cache',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `refresh_token=${this.refreshToken}`,
      }).then((response) => response.json())
        .then((result) => {
          const {access_token, expires_in} = result

          if (access_token !== undefined) {
            const expiry = (parseInt(expires_in, 10) * 1000) + new Date().getTime()
            this.client.setAccessToken(access_token)
            this.expiry = expiry
            resolve({ expiry, access_token })
          } else {
            reject(new Error('Failed to authenticate'))
          }
        })
        .catch((error) => reject(new Error(error)))
    })
  }
}
