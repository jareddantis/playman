<template>
  <div class="action-bar">
    <v-btn @click="$bus.$emit('select-all-playlists')" color="white" icon small
           text>
      <v-icon>select_all</v-icon>
    </v-btn>
    <v-btn color="white" icon small text>
      <v-icon>more_vert</v-icon>
    </v-btn>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {Component} from 'vue-property-decorator'

@Component
export default class PlaylistsEditBar extends Vue {
}
</script>

<style lang="scss" scoped>
  @import '../../styles/components/ActionBar';
</style>
