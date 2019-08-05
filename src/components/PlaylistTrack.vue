<template>
  <div :disabled="isChecked" @click="$bus.$emit('paste-tracks', track.index)"
       class="track target" v-if="isReordering">
    <div class="target-icon">
      <v-icon>subdirectory_arrow_right</v-icon>
    </div>
    <p class="target-text text-truncate">Play after <span class="font-weight-bold">{{ track.name }}</span></p>
  </div>
  <div :selected="isChecked" class="track item" v-else>
    <div class="track-control">
      <v-checkbox :color="isChecked ? '#E5A3A0' : '#F5F5F5'" :disabled="isDisabled"
                  @change="onToggle" hide-details
                  v-model="isChecked"></v-checkbox>
    </div>
    <p class="track-name">{{ track.name }}</p>
    <p class="track-info" v-show="$vuetify.breakpoint.mdAndDown">{{ track.artist }} &bullet; {{ track.album }}</p>
    <p class="track-info artist" v-show="!$vuetify.breakpoint.mdAndDown">{{ track.artist }}</p>
    <p class="track-info album" v-show="!$vuetify.breakpoint.mdAndDown">{{ track.album }}</p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
  import {mapState} from 'vuex'
  import {Component, Prop} from 'vue-property-decorator'

  @Component({
  computed: mapState(['isReordering']),
})
export default class PlaylistTrack extends Vue {
  @Prop({required: true}) public readonly track: any
  public isReordering!: boolean
  public isChecked: boolean = false
  public isDisabled: boolean = false

  public created() {
    // Restore checked status
    this.isChecked = this.track.checked

    // Disable while loading
    this.$bus.$on('loading', (isLoading: boolean) => this.isDisabled = isLoading)

    // Batch edit actions
    this.$bus.$on('cancel-batch-edit', () => {
      if (!this.isReordering) {
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
