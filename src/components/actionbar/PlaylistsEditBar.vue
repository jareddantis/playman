<template>
  <div>
    <v-btn @click="toggleSelection"
           color="white" icon small text>
      <v-icon>select_all</v-icon>
    </v-btn>
    <v-menu nudge-bottom="10" offset-y>
      <template v-slot:activator="{ on }">
        <v-btn color="white" icon small text v-on="on"
               v-show="!!checkedPlaylists && checkedPlaylists.length">
          <v-icon>more_vert</v-icon>
        </v-btn>
      </template>
      <v-list dark dense>
        <v-list-item-group>
          <v-list-item @click="$bus.$emit('randomize-playlists')">
            <v-list-item-icon>
              <v-icon>shuffle</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Randomize</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
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

  public toggleSelection() {
    this.$bus.$emit(this.checkedPlaylists.length === this.playlists.length ? 'deselect-all-playlists'
                                                                           : 'select-all-playlists')
  }
}
</script>
