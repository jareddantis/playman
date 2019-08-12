<template>
  <v-dialog max-width="400" v-model="showDialog" scrollable>
    <v-card>
      <!--    Loading bar -->
      <v-progress-linear
        :active="loading"
        absolute color="white" indeterminate
        top></v-progress-linear>

      <v-card-title>
        <span class="headline">Select a target playlist</span>
      </v-card-title>
      <v-list>
        <v-list-item :key="playlist.id" v-for="playlist in targets"
                     @click="resolve(playlist.id, playlist.name)"
                     :disabled="loading">
          <v-list-item-content>
            <v-list-item-title v-text="playlist.name"></v-list-item-title>
          </v-list-item-content>
          <v-list-item-avatar>
            <v-img :alt="playlist.name" :src="getImage(playlist.images)"
                   :lazy-src="require('../../assets/gradient.jpeg')"></v-img>
          </v-list-item-avatar>
        </v-list-item>
      </v-list>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="showDialog = false" text>cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue'
import {mapState} from 'vuex'
import {Component} from 'vue-property-decorator'

@Component({
  computed: mapState(['playlists']),
})
export default class PlaylistPickerDialog extends Vue {
  public loading = true
  public playlists!: any[]
  public showDialog: boolean = false
  public target: any = {}
  private source: string = ''
  private willMove = false

  get targets(): any[] {
    return this.playlists.filter((playlist: any) => playlist.id !== this.source)
  }

  public created() {
    this.$bus.$on('show-playlist-picker-dialogs', (payload: any) => {
      this.source = payload.source
      this.willMove = payload.willMove
      this.showDialog = true
      this.refreshPlaylists()
    })
  }

  public resolve(id: string, name: string) {
    this.$emit('picked', {
      target: {
        id, name,
      },
      willMove: this.willMove,
    })
    this.showDialog = false
  }

  public getImage(images: any[]): string {
    return images.length ? images[0].url : require('../../assets/gradient.jpeg')
  }

  private refreshPlaylists() {
    this.loading = true
    this.$store.dispatch('updatePlaylists')
      .then(() => this.loading = false)
      .catch(() => this.$store.commit('setOffline', true))
  }
}
</script>
