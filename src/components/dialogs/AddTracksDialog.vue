<template>
  <v-dialog v-model="showDialog" fullscreen hide-overlay
            transition="dialog-bottom-transition">
    <v-card>
      <v-app-bar elevation="0" color="#121738">
        <v-progress-linear :active="querying" absolute
                           color="white" indeterminate
                           top></v-progress-linear>
        <v-btn icon @click="showDialog = false">
          <v-icon>close</v-icon>
        </v-btn>
        <v-toolbar-title>Add tracks from artist</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn @click="add" text :loading="querying" :disabled="querying"
               v-show="checkedAlbums.length">add</v-btn>
      </v-app-bar>

      <v-stepper vertical v-model="step">
        <template>
          <!-- Search for artist -->
          <v-stepper-step color="#684E7C" step="1">Artist</v-stepper-step>
          <v-stepper-content step="1">
            <v-card>
              <v-card-text>
                <v-text-field v-model="artistQuery" @keypress.enter="searchForArtist" autofocus
                              hide-details outlined clearable label="Search for artist..."></v-text-field>

                <v-list class="results" v-show="artistResults.length">
                  <v-list-item v-for="artist in artistResults" :key="artist.id"
                               @click="pickArtist(artist.id)">
                    <v-list-item-content>
                      <v-list-item-title>{{ artist.name }}</v-list-item-title>
                    </v-list-item-content>
                    <v-list-item-avatar>
                      <v-img :alt="artist.name" :src="getImage(artist.images)"
                             :lazy-src="require('../../assets/gradient.jpeg')"></v-img>
                    </v-list-item-avatar>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-stepper-content>

          <!-- Pick albums -->
          <v-stepper-step color="#684E7C" step="2">Albums</v-stepper-step>
          <v-stepper-content step="2">
            <v-card>
              <v-card-text>
                <h3 class="headline">Pick albums to add</h3>

                <v-list>
                  <RecycleScroller :item-size="60" :items="albumResults"
                                   :page-mode="true" key-field="id" v-slot="{ item, index }">
                    <v-list-item>
                      <v-list-item-action>
                        <v-checkbox v-model="item.checked" @change="toggle(index)"></v-checkbox>
                      </v-list-item-action>
                      <v-list-item-content>
                        <v-list-item-title>{{ item.name }}</v-list-item-title>
                        <v-list-item-subtitle>{{ item.tracks }}
                          track{{ item.tracks !== 1 ? 's' : ''}}</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                  </RecycleScroller>
                </v-list>
              </v-card-text>
            </v-card>
          </v-stepper-content>
        </template>
      </v-stepper>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue'
import {Action} from 'vuex-class'
import {Component} from 'vue-property-decorator'

@Component
export default class AddTracksDialog extends Vue {
  public querying = false
  public showDialog = false
  public step: number = 1
  public artistQuery: string = ''
  public artistResults: any[] = []
  public albumResults: any[] = []
  public checkedAlbums: string[] = []
  @Action('spotify') private spotify!: (message: any) => Promise<any>

  public created() {
    this.$bus.$on('add-tracks', () => this.resetAndShow())
  }

  public async add() {
    this.querying = true
    let tracks: any[] = []
    let success = true

    for (const id of this.checkedAlbums) {
      try {
        const results = await this.spotify({
          type: 'getAlbumTracks',
          data: {id},
        })
        tracks = tracks.concat(results)
      } catch (error) {
        success = false
        break
      }
    }

    if (success) {
      this.$emit('add-tracks', tracks)
      this.querying = false
      this.showDialog = false
    } else {
      this.showDialog = false
    }
  }

  public getImage(images: any[]): string {
    return images.length ? images[0].url : require('../../assets/gradient.jpeg')
  }

  public pickArtist(id: string) {
    this.querying = true
    this.albumResults = []
    this.spotify({
      type: 'getArtistAlbums',
      data: {id},
    }).then((results) => {
      this.albumResults = results
      this.step = 2
      this.artistResults = []
      this.artistQuery = ''
    }).finally(() => this.querying = false)
  }

  public searchForArtist() {
    this.querying = true
    this.artistResults = []
    this.spotify({
      type: 'searchArtists',
      data: {
        query: this.artistQuery,
      },
    }).then((results) => this.artistResults = results)
      .finally(() => this.querying = false)
  }

  public toggle(index: number) {
    const { id, checked } = this.albumResults[index]
    if (checked) {
      if (!this.checkedAlbums.includes(id)) {
        this.checkedAlbums.push(id)
      }
    } else if (this.checkedAlbums.includes(id)) {
      this.checkedAlbums.splice(this.checkedAlbums.indexOf(id))
    }
  }

  private resetAndShow() {
    this.albumResults = []
    this.artistResults = []
    this.artistQuery = ''
    this.step = 1
    this.showDialog = true
  }
}
</script>

<style lang="scss" scoped>
  @import '../../styles/components/AddTracksDialog';
</style>
