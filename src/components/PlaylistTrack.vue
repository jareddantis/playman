<template>
  <div :disabled="isChecked" @click="$bus.$emit('paste-tracks', track.index)"
       class="track target" v-if="isReordering">
    <div class="target-icon">
      <v-icon>subdirectory_arrow_right</v-icon>
    </div>
    <p class="target-text text-truncate">Paste after <span class="font-weight-bold">{{ track.title }}</span></p>
  </div>
  <div :selected="isChecked" class="track item" v-else>
    <div class="track-control">
      <v-checkbox :color="isChecked ? '#E5A3A0' : '#F5F5F5'" :disabled="isDisabled"
                  hide-details @click.native="multipleSelect" v-model="isChecked"></v-checkbox>
    </div>
    <p class="track-name">{{ track.title }}</p>
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
  public isDisabled: boolean = false

  get isChecked(): boolean {
    return this.track.checked
  }

  set isChecked(state: boolean) {
    this.$emit('track-toggled', {
      id: this.track.id,
      index: this.track.index,
      state,
    })
  }

  public created() {
    // Disable while loading
    this.$bus.$on('loading', (isLoading: boolean) => this.isDisabled = isLoading)
  }

  public multipleSelect(event: MouseEvent) {
    if (this.isChecked && event.shiftKey) {
      this.$emit('multiple-select', this.track.index)
    }
  }
}
</script>

<style lang="scss" scoped>
  @import '../styles/components/PlaylistTrack';
</style>
