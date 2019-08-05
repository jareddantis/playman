import Vue from 'vue'

declare class Spotify {
  public authUri: string
  public authenticated: boolean
  public redirectUri: string

  public changePlaylistDetails(id: string, details: any): Promise<any>
  public deleteAllPlaylistTracks(id: string): Promise<Promise<any>>
  public deletePlaylistTracks(id: string, initial: any[], snapshot: string,
                              resolve: (arg0: any) => void, reject: (arg0: any) => void): Promise<any>
  public getMe(): Promise<void>
  public getPlaylist(id: string): Promise<any>
  public getUserPlaylists(username: string, initial: any[],
                          resolve: (arg0: any) => void, reject: (arg0: any) => void): Promise<void>
  public reorderPlaylistTracks(id: string, snapshot: string, tracks: any[],
                               tracksToReorder: number[], placeTracksAfter: number): Promise<any>
  public setTokens(access: string, refresh: string, expiry: number): void
  public shufflePlaylist(id: string, snapshot: string, tracks: any[]): Promise<any>
}

declare module 'spotify' {
  export = Spotify
}

declare module 'vue/types/vue' {
  interface Vue {
    $bus: Vue,
  }
}
