<template>
  <div id="playlist">
    <div class="meta">

    </div>
    <div class="tracks">
      <DynamicScroller
        class="scroller"
        :items="playlistTracks"
        :min-item-size="20"
        key-field="id">
        <template v-slot="{ item, index, active }">
          <DynamicScrollerItem :item="item" :active="active"
                               :data-index="index">
            <p class="body-1 white--text">{{ item.track.name }}</p>
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { Component } from 'vue-property-decorator'
  import { DynamicScroller } from 'vue-virtual-scroller'

  @Component({
    components: { DynamicScroller },
  })
  export default class Playlist extends Vue {
    public playlistTracks: any = []

    public mounted() {
      this.$bus.$emit('loading', true)

      this.getPlaylist()
        .then(() => this.$bus.$emit('loading', false))
    }

    private async getPlaylist() {
      return new Promise((resolve, reject) => {
        // Load playlist details
        this.$store.dispatch('getPlaylist', this.id)
          .then((playlist) => this.$bus.$emit('change-navbar', {
            actionBar: 'Playlist',
            backButton: true,
            name: playlist.name,
          }))
          .catch((error) => reject(error))

        // Load playlist tracks
        this.$store.dispatch('getPlaylistTracks', this.id)
          .then((tracks) => this.playlistTracks = tracks)
          .then(() => resolve())
          .catch((error) => reject(error))
      })
    }

    get id(): string {
      return this.$route.params.id
    }
  }
</script>

<style lang="scss" scoped>

</style>
