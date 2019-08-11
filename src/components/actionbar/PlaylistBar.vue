<template>
  <div>
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="$bus.$emit('edit-playlist-details')"
               color="white" icon small text v-on="on">
          <v-icon>edit</v-icon>
        </v-btn>
      </template>
      <span>Edit playlist details</span>
    </v-tooltip>
    <v-menu nudge-bottom="10" offset-y>
      <template v-slot:activator="{ on }">
        <v-btn color="white" icon small text v-on="on">
          <v-icon>more_vert</v-icon>
        </v-btn>
      </template>
      <v-list dark dense>
        <v-list-item @click="$bus.$emit('sort-playlist')">
          <v-list-item-icon>
            <v-icon>sort</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Sort playlist</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="exportSelected">
          <v-list-item-icon>
            <v-icon>cloud_download</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Export playlist</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="$bus.$emit('delete-playlist')">
          <v-list-item-icon>
            <v-icon>delete</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Delete playlist</v-list-item-title>
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
export default class PlaylistBar extends Vue {
  public exportSelected() {
    this.$bus.$emit('export-playlist', {count: 1})
  }
}
</script>
