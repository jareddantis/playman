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

  public setTokens(access: string, refresh: string, expiry: string) {
    this.client.setAccessToken(access)
    this.expiry = (parseInt(expiry, 10) * 1000) + new Date().getTime()

    if (refresh !== 'null') {
      this.refreshToken = refresh
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
    if (new Date().getTime() > this.expiry) {
      await fetch(`${this.API_BASE_URL}-refresh-token?refresh_token=${this.refreshToken}`)
        .then((response) => response.json())
        .then((result) => {
          const {access_token, expires_in} = result

          if (access_token !== undefined) {
            this.setTokens(access_token, 'null', expires_in)
          }
        })
    }
  }
}
