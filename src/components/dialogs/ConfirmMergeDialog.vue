<template>
  <v-dialog max-width="300" v-model="showDialog">
    <v-card>
      <v-card-title>
        <span class="headline">Merge playlists?</span>
      </v-card-title>
      <v-card-text>
        <p class="body-1">A new playlist entitled <span class="font-weight-bold">&quot;New Merged Playlist&quot;</span>
        will be created, containing all the tracks of the selected playlists.</p>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="showDialog = false" text>cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn @click="confirm" text>merge</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue'
import {Component} from 'vue-property-decorator'

@Component
export default class ConfirmMergeDialog extends Vue {
  public showDialog: boolean = false

  public created() {
    this.$bus.$on('merge-playlists', () => this.showDialog = true)
  }

  public confirm() {
    this.$emit('confirm')
    this.showDialog = false
  }
}
</script>
