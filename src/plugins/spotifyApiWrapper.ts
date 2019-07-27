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

  get client(): SpotifyWebApi {
    return this.apiClient
  }

  get redirectUri(): string {
    return process.env.NODE_ENV === 'production' ? 'https://setlist.jared.gq/callback'
      : 'http://localhost:8080/callback'
  }

  public async setTokens(access: string, refresh: string, expiry: number) {
    this.refreshToken = refresh

    if (new Date().getTime() >= expiry) {
      await this.reauth()
    } else {
      this.apiClient.setAccessToken(access)
      this.expiry = expiry
    }
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
    return fetch(`/.netlify/functions/spotify-refresh-token?refresh_token=${this.refreshToken}`)
      .then((response) => response.json())
      .then((result) => {
        const {access_token, expires_in} = result

        if (access_token !== undefined) {
          this.apiClient.setAccessToken(access_token)
          this.expiry = (parseInt(expires_in, 10) * 1000) + new Date().getTime()
        }
      })
  }
}
