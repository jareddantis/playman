import Vue from 'vue'
import SpotifyWebApi from 'spotify-web-api-node'

declare class SpotifyApiWrapper {
  public authUri: string
  public authenticated: boolean
  public redirectUri: string
  public client: SpotifyWebApi

  public deletePlaylistTracks(id: string, tracks: any[], snapshot: string,
                              resolve: (arg0: any) => void, reject: (arg0: any) => void): Promise<any>
  public getPlaylistTracks(id: string, initial: any[], offset: number,
                           resolve: (arg0: any) => void, reject: (arg0: any) => void): Promise<any>
  public setTokens(access: string, refresh: string, expiry: number): void
}

declare module 'vue/types/vue' {
  interface Vue {
    $bus: Vue,
  }
}
