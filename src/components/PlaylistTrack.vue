<template>
  <div :class="isChecked ? 'track selected' : 'track'">
    <div class="track-control">
      <v-checkbox dark hide-details :disabled="isDisabled"
                  v-model="isChecked" @change="onToggle"
                  :color="isChecked ? '#E5A3A0' : '#F5F5F5'"></v-checkbox>
    </div>
    <p class="track-name">{{ track.name }}</p>
    <p class="track-info">{{ track.artist }} &bullet; {{ track.album }}</p>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { Component, Prop, Watch } from 'vue-property-decorator'

  @Component
  export default class PlaylistTrack extends Vue {
    @Prop({ required: true }) public readonly track: any
    public isChecked: boolean = false
    public isDisabled: boolean = false

    public created() {
      // Restore checked status
      this.isChecked = this.track.checked

      // Disable while loading
      this.$bus.$on('loading', (isLoading: boolean) => this.isDisabled = isLoading)
    }

    public onToggle() {
      this.$emit('track-toggled', {
        id: this.track.id,
        index: this.track.index,
        state: this.isChecked,
      })
    }
  }
</script>

<style lang="scss" scoped>
  @import '../styles/components/PlaylistTrack';
</style>
