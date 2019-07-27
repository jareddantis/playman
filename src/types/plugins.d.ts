import Vue from 'vue'
import SpotifyWebApi from 'spotify-web-api-node'

declare class SpotifyClient {
  public authUri: string
  public redirectUri: string
  public client: SpotifyWebApi

  constructor()
  public setTokens(access: string, refresh: string, expiry: number): void
}

declare module 'vue/types/vue' {
  interface Vue {
    $bus: Vue,
    $spCl: SpotifyClient,
  }
}
