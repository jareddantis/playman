<template>
  <div>
    <v-btn @click="$bus.$emit('playlists-select')"
           color="white" icon small text>
      <v-icon>edit</v-icon>
    </v-btn>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {Component} from 'vue-property-decorator'

@Component
export default class PlaylistsBar extends Vue {
}
</script>
