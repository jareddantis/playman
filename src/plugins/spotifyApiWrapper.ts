import qs from 'qs'
import SpotifyWebApi from 'spotify-web-api-node'

export default class SpotifyApiWrapper {
  public client!: SpotifyWebApi
  private refreshToken: string = ''
  private stateToken: string = ''
  private expiry: number = 0
  private readonly API_AUTH_ID = 'a2d37a37164c48e48d3693491c20e7ae'
  private readonly API_AUTH_URL = 'https://accounts.spotify.com/authorize'
  private readonly API_BASE_URL = '/.netlify/functions/spotify'

  constructor() {
    // Init state
    this.generateStateToken()

    // Init API client
    this.client = new SpotifyWebApi({
      redirectUri: this.redirectUri,
    })
  }

  get redirectUri(): string {
    return process.env.NODE_ENV === 'production' ? 'https://setlist.jared.gq/callback'
      : 'http://localhost:8080/callback'
  }

  get authUri(): string {
    const API_QUERY = qs.stringify({
      client_id: this.API_AUTH_ID,
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

    return `${this.API_AUTH_URL}/?${API_QUERY}`
  }

  public async setTokens(access: string, refresh: string, expiry: number) {
    this.refreshToken = refresh

    if (new Date().getTime() >= expiry) {
      await this.reauth()
    } else {
      this.client.setAccessToken(access)
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
    return fetch(`${this.API_BASE_URL}-refresh-token?refresh_token=${this.refreshToken}`)
      .then((response) => response.json())
      .then((result) => {
        const {access_token, expires_in} = result

        if (access_token !== undefined) {
          this.client.setAccessToken(access_token)
          this.expiry = (parseInt(expires_in, 10) * 1000) + new Date().getTime()
        }
      })
  }
}
