import Vue from 'vue'

declare class Spotify {
  public authUri: string
  public authenticated: boolean
  public redirectUri: string

  public deletePlaylistTracks(id: string, tracks: any[], snapshot: string,
                              resolve: (arg0: any) => void, reject: (arg0: any) => void): Promise<any>
  public getMe(): Promise<any>
  public getPlaylist(id: string): Promise<any>
  public getPlaylistTracks(id: string, initial: any[], offset: number,
                           resolve: (arg0: any) => void, reject: (arg0: any) => void): Promise<any>
  public getUserPlaylists(username: string): Promise<any>
  public setTokens(access: string, refresh: string, expiry: number): void
}

declare module 'vue/types/vue' {
  interface Vue {
    $bus: Vue,
  }
}
