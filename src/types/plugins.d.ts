import Vue from 'vue'

declare class SpotifyClient {
  constructor()
  public generateAuthUrl(): string
  public getRedirUri(): string
  public setTokens(access: string, refresh: string, expiry: string): void
}

declare module 'vue/types/vue' {
  interface Vue {
    $bus: Vue,
    $spCl: SpotifyClient,
  }
}
