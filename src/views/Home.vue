<template>
  <div id="playlists">
    <PlaylistCard v-for="playlist in playlists"
                  :playlist="playlist"
                  :key="playlist.id"></PlaylistCard>
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
  export default class Home extends Vue {
    public playlists!: any[]

    public mounted() {
      // Update navbar title
      this.$bus.$emit('change-navbar-title', 'Playlists')

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
