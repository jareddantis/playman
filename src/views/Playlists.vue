<template>
  <div id="playlists">
    <PlaylistCard :key="playlist.id" :playlist="playlist" v-for="playlist in playlists"></PlaylistCard>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {Component} from 'vue-property-decorator'
import {mapState} from 'vuex'
import PlaylistCard from '@/components/PlaylistCard.vue'

@Component({
  components: {PlaylistCard},
  computed: mapState(['playlists']),
})
export default class Playlists extends Vue {
  public playlists!: any[]

  public mounted() {
    // Load playlists
    this.$bus.$emit('loading', true)
    this.$store.dispatch('updatePlaylists')
      .then((playlists) => this.$store.commit('setPlaylists', playlists))
      .catch(() => this.$store.commit('setOffline', true))
      .finally(() => this.$bus.$emit('loading', false))
  }
}
</script>

<style lang="scss" scoped>
  @import '../styles/views/Playlists';
</style>
