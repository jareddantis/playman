<template>
  <v-dialog max-width="600" v-model="showDialog" persistent>
    <v-card>
      <v-card-title>
        <span class="headline">Export {{ items }}?</span>
      </v-card-title>
      <v-card-text>
        <p class="body-1">This will save your playlist tracks as CSV data, which you can open with a spreadsheet
        application.</p>
        <p class="body-1">You can also import an exported playlist in Playman as a new playlist or as new tracks to
        append to an existing playlist.</p>
      </v-card-text>
      <v-card-actions>
        <v-btn :disabled="loading" @click="showDialog = false" text>cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn :loading="loading" @click="confirm" text>export</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue'
import {Component} from 'vue-property-decorator'
import {saveAs} from 'file-saver'

@Component
export default class ExportDialog extends Vue {
  public items: string = ''
  public loading = false
  public showDialog: boolean = false
  private single = false

  public created() {
    this.$bus.$on('export-playlist', (payload: any) => {
      if (payload.count === 1) {
        this.items = 'playlist'
        this.single = true
      } else {
        this.items = `${payload.count} playlists`
        this.single = false
      }
      this.showDialog = true
    })
  }

  public confirm() {
    this.loading = true
    this.$store.dispatch(this.single ? 'exportPlaylist' : 'exportPlaylists')
      .then((exportData: any) => {
        const {blob, filename} = exportData
        saveAs(blob, filename)
        this.$bus.$emit('cancel-batch-edit')
        this.loading = false
        this.showDialog = false
      })
  }
}
</script>
