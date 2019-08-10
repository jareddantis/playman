<template>
  <div>
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="$bus.$emit('playlists-select')"
               color="white" icon small text v-on="on">
          <v-icon>edit</v-icon>
        </v-btn>
      </template>
      <span>Edit playlists</span>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {Component} from 'vue-property-decorator'

@Component
export default class PlaylistsBar extends Vue {
}
</script>
