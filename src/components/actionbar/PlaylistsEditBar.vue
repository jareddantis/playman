<template>
  <div>
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="toggleSelection" v-on="on"
               color="white" icon small text>
          <v-icon>select_all</v-icon>
        </v-btn>
      </template>
      <span>Select all</span>
    </v-tooltip>
    <v-menu nudge-bottom="10" offset-y>
      <template v-slot:activator="{ on }">
        <v-btn color="white" icon small text v-on="on"
               v-show="!!checkedPlaylists && checkedPlaylists.length">
          <v-icon>more_vert</v-icon>
        </v-btn>
      </template>
      <v-list dark dense>
        <v-list-item @click="$bus.$emit('randomize-playlists')">
          <v-list-item-icon>
            <v-icon>shuffle</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Randomize selected</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="$bus.$emit('merge-playlists')">
          <v-list-item-icon>
            <v-icon>merge_type</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Merge selected</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="exportSelected">
          <v-list-item-icon>
            <v-icon>cloud_download</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Export selected</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="$bus.$emit('delete-playlists')">
          <v-list-item-icon>
            <v-icon>delete</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Delete selected</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {mapState} from 'vuex'
import {Component} from 'vue-property-decorator'

@Component({
  computed: mapState(['checkedPlaylists', 'playlists']),
})
export default class PlaylistsEditBar extends Vue {
  public checkedPlaylists!: string[]
  public playlists!: any

  public exportSelected() {
    this.$bus.$emit('export-playlist', {count: this.checkedPlaylists.length})
  }

  public toggleSelection() {
    this.$bus.$emit(this.checkedPlaylists.length === this.playlists.length ? 'deselect-all-playlists'
                                                                           : 'select-all-playlists')
  }
}
</script>
