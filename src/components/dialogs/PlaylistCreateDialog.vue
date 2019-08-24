<template>
  <div>
    <v-dialog max-width="400" v-model="showDialog" scrollable>
      <v-card>
        <v-card-title>
          <span class="headline">{{ fromScratch ? 'Create' : 'Import' }} playlist</span>
        </v-card-title>
        <v-card-text class="editor">
          <div class="add-tracks" v-if="fromScratch">
            <v-btn rounded x-large @click="$bus.$emit('add-tracks')">
              <v-icon>add</v-icon> Add tracks
            </v-btn>
            <p class="caption" v-show="tracks.length" v-html="trackSummary"></p>
          </div>
          <div class="backup-picker" v-else>
            <v-file-input accept=".tsv,text/tab-separated-values"
                          @change="onFileChanged" :disabled="loading"
                          :error="!backupIsValid" :error-messages="backupError"
                          :messages="backupSummary" outlined placeholder="Choose backup file..."
                          prepend-icon="" prepend-inner-icon="insert_drive_file"
                          small-chips v-model="backupFile"></v-file-input>
          </div>
          <div class="details" v-show="fromScratch || (backupFile !== null && backupIsValid)">
            <v-text-field :disabled="loading" :rules="nameRules" hide-details
                          label="Name" outlined v-model="name"></v-text-field>
            <v-textarea :disabled="loading" hide-details label="Description"
                        outlined v-model="desc"></v-textarea>
            <v-file-input :disabled="loading" :rules="artRules"
                          @change="onArtChanged" accept=".jpg,.jpeg,image/jpeg"
                          outlined placeholder="Choose cover art..."
                          prepend-icon="" prepend-inner-icon="add_photo_alternate" ref="artinput"
                          small-chips v-model="artFile"></v-file-input>
            <div class="switches">
              <v-switch :disabled="isPublic || loading" hide-details inset label="Collaborative"
                        v-model="isCollab" color="white"></v-switch>
              <v-switch :disabled="loading" @change="toggleCollab" hide-details inset
                        label="Public" v-model="isPublic" color="white"></v-switch>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn :disabled="loading" @click="showDialog = false" text>cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn :loading="loading" :disabled="!name || !tracks.length"
                 @click="save" text>save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <AddTracksDialog v-on:add-tracks="addTracks"/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {Action} from 'vuex-class'
import {Component} from 'vue-property-decorator'
import {parse as parseCsv} from 'papaparse'

@Component
export default class PlaylistCreateDialog extends Vue {
  public backupError: string = ''
  private artFile: File | null = null
  private backupFile: File | null = null
  private backupIsValid: boolean = true
  private editDetails: any = {}
  private fromScratch: boolean = false
  private loading = false
  private showDialog = false
  private tracks: any[] = []
  @Action('spotify') private spotify!: (message: any) => Promise<any>

  get backupSummary(): string {
    return (this.backupFile !== null && this.backupIsValid && this.tracks.length)
      ? `Includes ${this.tracks[0].name} and ${this.tracks.length - 1} others` : ''
  }

  get trackSummary(): string {
    const s = this.tracks.length !== 1 ? 's' : ''
    return (this.fromScratch && this.tracks.length) ?
      `Added ${this.tracks.length} track${s} ` +
      `including <strong>${this.tracks[0].name}</strong> by <strong>${this.tracks[0].artist}` : ''
  }

  public mounted() {
    this.$bus.$on('new-playlist', () => this.resetAndShow(true))
    this.$bus.$on('import-playlist', () => this.resetAndShow(false))
  }

  public addTracks(tracks: string[]) {
    this.tracks = this.tracks.concat(tracks)
  }

  public async onArtChanged() {
    if (this.artFile !== null && (this.$refs.artinput as any).validate()) {
      try {
        this.art = await this.spotify({
          type: 'toBase64',
          data: {
            file: this.artFile as File,
          },
        })
      } catch (error) {
        this.art = require('../../assets/gradient.jpeg')
      }
    } else {
      this.art = require('../../assets/gradient.jpeg')
    }
  }

  public async onFileChanged() {
    if (this.backupFile !== null) {
      const uriFormat = /^spotify:track:[0-9A-Za-z]{22}$/
      this.tracks = []

      parseCsv(this.backupFile, {
        delimiter: '\t',
        worker: true,
        complete: () => {
          if (!this.tracks.length) {
            this.backupError = 'Backup is empty'
            this.backupIsValid = false
          } else {
            this.backupError = ''
            this.backupIsValid = true
          }
        },
        error: (error) => {
          this.tracks = []
          this.backupError = error.message
          this.backupIsValid = false
        },
        step: (results, parser) => {
          if (uriFormat.test(results.data[0])) {
            this.tracks.push({
              uri: results.data[0],
              name: results.data[1],
              artist: results.data[2],
            })
          } else {
            if (results.data[0] !== '') {
              parser.abort()
              this.tracks = []
              this.backupError = 'Backup contains invalid track URIs'
              this.backupIsValid = false
            }
          }
        },
      })
    } else {
      this.backupIsValid = true
    }
  }

  public save() {
    const details = this.editDetails

    if (details.hasOwnProperty('public') && details.public) {
      // We can only set collaborative = true on non-public playlists
      delete details.collab
    }

    this.loading = true
    this.spotify({
      type: 'createPlaylist',
      data: {
        details,
        tracks: this.tracks.map((track: any) => track.uri),
      },
    }).then(() => {
      this.$emit('import-complete')
      this.showDialog = false
    }).finally(() => this.loading = false)
  }

  public toggleCollab() {
    if (this.isPublic && this.isCollab) {
      this.isCollab = false
    }
  }

  /**
   * Cover art file validation
   */
  get artRules(): any[] {
    return this.artFile === null ? [] : [
      (file: File) => file.size <= 256 * 1000 || 'File must not exceed 256 KB',
      (file: File) => file.type === 'image/jpeg' || `File must be valid JPEG`,
    ]
  }

  get nameRules(): any[] {
    return [(name: string) => !!name || 'Required']
  }

  /**
   * Getters and setters
   */
  get art() {
    return this.editDetails.art
  }

  set art(art: string) {
    this.$set(this.editDetails, 'art', art)
  }

  get desc() {
    return this.editDetails.desc
  }

  set desc(desc: string) {
    this.$set(this.editDetails, 'desc', desc)
  }

  get isCollab() {
    return this.editDetails.isCollab
  }

  set isCollab(mode: boolean) {
    this.$set(this.editDetails, 'isCollab', mode)
  }

  get isPublic() {
    return this.editDetails.isPublic
  }

  set isPublic(mode: boolean) {
    this.$set(this.editDetails, 'isPublic', mode)
  }

  get name() {
    return this.editDetails.name
  }

  set name(name: string) {
    this.$set(this.editDetails, 'name', name)
  }

  private resetAndShow(fromScratch: boolean) {
    this.fromScratch = fromScratch
    this.artFile = null
    this.backupFile = null
    this.editDetails = {}
    this.showDialog = true
  }
}
</script>

<style lang="scss" scoped>
  @import '../../styles/components/PlaylistCreateDialog';
</style>
