<template>
  <div :selected="playlist.checked" :selection="isBatchEditing"
       :disabled="disabled" @click="clickHandler" class="playlist">
    <div class="playlist-art">
      <v-img :alt="playlist.id"
             :lazy-src="require('../assets/gradient.jpeg')" :src="image">
        <template v-slot:placeholder>
          <v-layout align-center fill-height justify-center ma-0>
            <v-progress-circular color="grey lighten-5"
                                 indeterminate></v-progress-circular>
          </v-layout>
        </template>

        <v-overlay :opacity="0.75" :value="playlist.checked" absolute>
          <v-icon color="#E5A3A0" large>done</v-icon>
        </v-overlay>
      </v-img>
    </div>

    <div class="playlist-detail">
      <h2>{{ playlist.name }}</h2>
      <p>{{ playlist.tracks.total }} songs</p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {mapState} from 'vuex'
import {Component, Prop} from 'vue-property-decorator'

@Component({
  computed: mapState(['isBatchEditing']),
})
export default class PlaylistCard extends Vue {
  @Prop({required: true}) public readonly playlist: any
  @Prop({default: false}) public readonly disabled: boolean | undefined
  public isBatchEditing!: boolean

  get image(): string {
    return this.playlist.images.length ? this.playlist.images[0].url : require('../assets/gradient.jpeg')
  }

  public clickHandler() {
    if (this.isBatchEditing) {
      this.$emit('toggled', {
        index: this.playlist.index,
        isChecked: this.playlist.checked,
      })
    } else {
      this.$router.push('/playlists/' + this.playlist.id)
    }
  }
}
</script>

<style lang="scss" scoped>
  @import '../styles/components/PlaylistCard';
</style>
