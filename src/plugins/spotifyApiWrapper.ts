import qs from 'qs'
import SpotifyWebApi from 'spotify-web-api-node'

export default class SpotifyApiWrapper {
  private readonly apiClient!: SpotifyWebApi
  private refreshToken: string = ''
  private stateToken: string = ''
  private expiry: number = 0

  constructor() {
    // Init state
    this.generateStateToken()

    // Init API client
    this.apiClient = new SpotifyWebApi({
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

  get client(): SpotifyWebApi {
    return this.apiClient
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
        this.apiClient.setAccessToken(access)
        this.expiry = expiry
        resolve({ expired: false })
      }
    })
  }

  public getPlaylistTracks(id: string, initial: any[], offset: number,
                           resolve: (arg0: any) => void, reject: (arg0: any) => void) {
    const limit = 100

    this.client.getPlaylistTracks(id, { offset, limit })
      .then((response) => {
        const results = initial.concat(response.body.items)

        // Check if we have everything
        if (response.body.next === null) {
          // We have everything!
          resolve(results)
        } else {
          // Retrieve next page
          this.getPlaylistTracks(id, results, offset + limit, resolve, reject)
        }
      })
      .catch((error) => reject(new Error(error)))
  }

  public deletePlaylistTracks(id: string, tracks: any[], snapshot: string,
                              resolve: (arg0: any) => void, reject: (arg0: any) => void) {
    this.client.removeTracksFromPlaylistByPosition(id, tracks.splice(0, 100), snapshot)
      .then((response) => {
        const snapshotId = response.body.snapshot_id

        if (tracks.length) {
          this.deletePlaylistTracks(id, tracks, snapshotId, resolve, reject)
        } else {
          resolve(snapshotId)
        }
      })
      .catch((error) => reject(new Error(error)))
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
            this.apiClient.setAccessToken(access_token)
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
