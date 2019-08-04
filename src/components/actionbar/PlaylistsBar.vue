<template>
  <div class="action-bar">
    <v-btn @click="emitBatchEdit" color="white" icon small
           text>
      <v-icon>edit</v-icon>
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
export default class PlaylistsBar extends Vue {
  public emitBatchEdit() {
    this.$bus.$emit('playlists-select')
    this.$bus.$emit('change-navbar', {
      name: '',
      actionBar: 'PlaylistsEdit',
      cancelButton: true,
    })
  }
}
</script>

<style lang="scss" scoped>
  @import '../../styles/components/ActionBar';
</style>
