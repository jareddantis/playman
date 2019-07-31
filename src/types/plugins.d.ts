import Vue from 'vue'
import SpotifyWebApi from 'spotify-web-api-node'

declare class SpotifyApiWrapper {
  public authUri: string
  public authenticated: boolean
  public redirectUri: string
  public client: SpotifyWebApi

  constructor()
  public setTokens(access: string, refresh: string, expiry: number): void
}

declare module 'vue/types/vue' {
  interface Vue {
    $bus: Vue,
  }
}
