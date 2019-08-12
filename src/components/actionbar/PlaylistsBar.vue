<template>
  <div>
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="$bus.$emit('new-playlist')"
               color="white" icon small text v-on="on">
          <v-icon>add_box</v-icon>
        </v-btn>
      </template>
      <span>New playlist</span>
    </v-tooltip>
    <v-menu nudge-bottom="10" offset-y>
      <template v-slot:activator="{ on }">
        <v-btn color="white" icon small text v-on="on">
          <v-icon>more_vert</v-icon>
        </v-btn>
      </template>
      <v-list dark dense>
        <v-list-item @click="$bus.$emit('playlists-select')">
          <v-list-item-icon>
            <v-icon>edit</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Edit playlists</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="$bus.$emit('import-playlist')">
          <v-list-item-icon>
            <v-icon>cloud_upload</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Import playlist</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {Component} from 'vue-property-decorator'

@Component
export default class PlaylistsBar extends Vue {
}
</script>
