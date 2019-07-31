<template>
  <div id="playlists">
    <router-link v-for="playlist in playlists"
                 :key="playlist.id" class="playlist-link"
                 :to="'/playlists/' + playlist.id">
      <PlaylistCard :playlist="playlist"></PlaylistCard>
    </router-link>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { Component } from 'vue-property-decorator'
  import { mapState } from 'vuex'
  import PlaylistCard from '@/components/PlaylistCard.vue'

  @Component({
    components: { PlaylistCard },
    computed: mapState(['playlists']),
  })
  export default class Playlists extends Vue {
    public playlists!: any[]

    public mounted() {
      // Update navbar title
      this.$bus.$emit('change-navbar', {
        actionBar: 'Home',
        backButton: false,
        name: 'Playlists',
      })

      // Load playlists
      this.$bus.$emit('loading', true)
      this.$store.dispatch('updatePlaylists')
        .then(() => this.$bus.$emit('loading', false))
    }
  }
</script>

<style lang="scss" scoped>
  @import '../styles/views/Playlists';
</style>
