<template>
  <div class="playlist" :selection="inSelectionMode"
       :selected="selected" @click="clickHandler">
    <div class="playlist-art">
      <v-img :lazy-src="require('../assets/gradient.jpeg')"
             :src="image" :alt="playlist.id">
        <template v-slot:placeholder>
          <v-layout fill-height align-center justify-center ma-0>
            <v-progress-circular indeterminate
                                 color="grey lighten-5"></v-progress-circular>
          </v-layout>
        </template>

        <v-overlay :value="selected" absolute>
          <v-icon large color="#E5A3A0">done</v-icon>
        </v-overlay>
      </v-img>
    </div>

    <div class="playlist-detail">
      <h2>{{ playlist.name }}</h2>
      <p>{{ playlist.tracks.total }} songs</p>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { Component, Prop } from 'vue-property-decorator'

  @Component
  export default class PlaylistCard extends Vue {
    @Prop({ required: true }) public readonly playlist: any
    public inSelectionMode: boolean = false
    public selected: boolean = false

    public created() {
      this.$bus.$on('select-all-playlists', () => this.selected = true)
      this.$bus.$on('playlists-select', () => {
        this.inSelectionMode = true
        this.selected = false
      })
      this.$bus.$on('cancel-batch-edit', () => {
        this.inSelectionMode = false
        this.selected = false
      })
    }

    public clickHandler() {
      if (this.inSelectionMode) {
        this.selected = !this.selected
      } else {
        this.$router.push('/playlists/' + this.playlist.id)
      }
    }

    get image(): string {
      return this.playlist.images.length ? this.playlist.images[0].url : require('../assets/gradient.jpeg')
    }
  }
</script>

<style lang="scss" scoped>
  @import '../styles/components/PlaylistCard';
</style>
