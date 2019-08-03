<template>
  <div class="playlist">
    <div class="playlist-art">
      <v-img :lazy-src="require('../assets/gradient.jpeg')"
             :src="getPlaylistImage(playlist.images)"
             :alt="playlist.id">
        <template v-slot:placeholder>
          <v-layout fill-height align-center justify-center ma-0>
            <v-progress-circular indeterminate
                                 color="grey lighten-5"></v-progress-circular>
          </v-layout>
        </template>
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

    public getPlaylistImage(images: any[]): string {
      return images.length ? images[0].url : require('../assets/gradient.jpeg')
    }
  }
</script>

<style lang="scss" scoped>
  @import '../styles/components/PlaylistCard';
</style>
