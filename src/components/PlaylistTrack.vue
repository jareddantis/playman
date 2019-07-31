<template>
  <div class="track">
    <div class="track-control">
      <v-checkbox dark hide-details
                  v-model="isChecked"></v-checkbox>
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

    @Watch('isChecked')
    private onToggle() {
      this.$emit('track-toggled', { id: this.track.id, state: this.isChecked })
    }
  }
</script>

<style lang="scss" scoped>
  @import '../styles/components/PlaylistTrack';
</style>
