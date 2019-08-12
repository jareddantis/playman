<template>
  <v-dialog max-width="300" v-model="showDialog">
    <v-card>
      <v-card-title>
        <span class="headline">Delete {{ items }}?</span>
      </v-card-title>
      <v-card-text>
        <p v-if="items === 'songs'"
           class="body-1">This process is irreversible unless you make a backup first.</p>
        <p v-else
           class="body-1">You can always restore deleted playlists from your Spotify account settings.</p>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="showDialog = false" text>cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn @click="confirm" text>delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue'
import {Component} from 'vue-property-decorator'

@Component
export default class ConfirmDeleteDialog extends Vue {
  public items: string = ''
  public showDialog: boolean = false

  public created() {
    this.$bus.$on('delete-tracks', () => {
      this.items = 'tracks'
      this.showDialog = true
    })
    this.$bus.$on('delete-playlists', () => {
      this.items = 'playlists'
      this.showDialog = true
    })
    this.$bus.$on('delete-playlist', () => {
      this.items = 'playlist'
      this.showDialog = true
    })
  }

  public confirm() {
    this.$emit('confirm', this.items)
    this.showDialog = false
  }
}
</script>
