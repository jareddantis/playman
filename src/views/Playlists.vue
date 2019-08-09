<template>
  <div id="playlists">
    <PlaylistCard :key="playlist.id" :playlist="playlist"
                  v-for="playlist in playlists"
                  v-on:playlist-toggled="onToggle"></PlaylistCard>

    <!-- Playlists export dialog -->
    <ConfirmExportDialog/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {mapState} from 'vuex'
import {Mutation} from 'vuex-class'
import {Component} from 'vue-property-decorator'
import PlaylistCard from '@/components/PlaylistCard.vue'

@Component({
  components: {PlaylistCard},
  computed: mapState(['checkedPlaylists', 'playlists']),
})
export default class Playlists extends Vue {
  public checkedPlaylists!: string[]
  public playlists!: any[]
  @Mutation('setIsBatchEditing') private setIsBatchEditing!: (isEditing: boolean) => void

  public created() {
    // Load playlists
    this.refreshPlaylists()

    // Batch playlist editing
    this.$bus.$on('cancel-batch-edit', () => {
      this.setIsBatchEditing(false)
      this.$store.dispatch('toggleAllPlaylists', false)
    })
    this.$bus.$on('deselect-all-playlists', () => this.$store.dispatch('toggleAllPlaylists', false))
    this.$bus.$on('playlists-select', () => this.setIsBatchEditing(true))
    this.$bus.$on('select-all-playlists', () => this.$store.dispatch('toggleAllPlaylists', true))
  }

  public exportSelected() {
    this.$bus.$emit('export-playlists', {count: this.checkedPlaylists.length})
  }

  public onToggle(payload: any) {
    this.$store.commit('setPlaylistChecked', {
      index: payload.index,
      isChecked: !payload.isChecked,
    })
  }

  private refreshPlaylists() {
    document.title = 'Playlists | Playman'
    this.$bus.$emit('loading', true)
    this.$store.dispatch('updatePlaylists')
      .catch(() => this.$store.commit('setOffline', true))
      .finally(() => this.$bus.$emit('loading', false))
  }
}
</script>

<style lang="scss" scoped>
  @import '../styles/views/Playlists';
</style>
