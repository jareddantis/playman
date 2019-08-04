<template>
  <div class="track target" v-if="cutting" :disabled="isChecked"
       @click="$bus.$emit('paste-tracks', track.index)">
    <div class="target-icon">
      <v-icon>subdirectory_arrow_right</v-icon>
    </div>
    <p class="target-text">Play after <span class="font-weight-bold">{{ track.name }}</span></p>
  </div>
  <div class="track item" :selected="isChecked" v-else>
    <div class="track-control">
      <v-checkbox hide-details :disabled="isDisabled"
                  v-model="isChecked" @change="onToggle"
                  :color="isChecked ? '#E5A3A0' : '#F5F5F5'"></v-checkbox>
    </div>
    <p class="track-name">{{ track.name }}</p>
    <p v-show="$vuetify.breakpoint.mdAndDown" class="track-info">{{ track.artist }} &bullet; {{ track.album }}</p>
    <p class="track-info artist" v-show="!$vuetify.breakpoint.mdAndDown">{{ track.artist }}</p>
    <p class="track-info album" v-show="!$vuetify.breakpoint.mdAndDown">{{ track.album }}</p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
  import {Component, Prop} from 'vue-property-decorator'

  @Component
export default class PlaylistTrack extends Vue {
  @Prop({ required: true }) public readonly track: any
    @Prop({required: true}) public readonly cutting: boolean | undefined
  public isChecked: boolean = false
  public isDisabled: boolean = false

  public created() {
    // Restore checked status
    this.isChecked = this.track.checked

    // Disable while loading
    this.$bus.$on('loading', (isLoading: boolean) => this.isDisabled = isLoading)

    // Batch edit actions
    this.$bus.$on('cancel-batch-edit', () => {
      if (!this.cutting) {
        this.isChecked = false
        this.onToggle()
      }
    })
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
