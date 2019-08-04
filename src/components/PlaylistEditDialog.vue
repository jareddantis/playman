<template>
  <v-dialog max-width="600" v-model="showDialog">
    <v-card>
      <v-card-title>
        <span class="headline">Edit playlist details</span>
      </v-card-title>
      <v-card-text>
        <div class="editor">
          <div class="art">
            <img :alt="name" :src="art">
            <div class="switches">
              <v-switch :disabled="isPublic || loading" hide-details inset label="Collaborative"
                        v-model="isCollab"></v-switch>
              <v-switch :disabled="loading" @change="toggleCollab" hide-details inset
                        label="Public" v-model="isPublic"></v-switch>
            </div>
          </div>
          <div class="details">
            <v-text-field :disabled="loading" hide-details label="Name"
                          outlined v-model="name"></v-text-field>
            <v-textarea :disabled="loading" hide-details label="Description"
                        outlined v-model="desc"></v-textarea>
            <v-file-input :disabled="loading" :rules="rules" @change="onArtChanged" accept=".jpg,.jpeg,image/jpeg"
                          outlined placeholder="Choose cover art..." prepend-icon=""
                          prepend-inner-icon="image" ref="artinput"
                          small-chips v-model="files"></v-file-input>
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn :disabled="loading" @click="showDialog = false" text>cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn :loading="loading" @click="save" text>save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue'
import {Component} from 'vue-property-decorator'

@Component
export default class PlaylistEditDialog extends Vue {
  private loading = false
  private files: File | null = null
  private id = ''
  private showDialog = false
  private editDetails: any = {}
  private origDetails: any = {}

  public mounted() {
    this.$bus.$on('show-playlist-details-dialog', (payload: any) => {
      this.id = payload.id
      this.editDetails = Object.assign({}, payload)
      this.origDetails = Object.assign({}, payload)
      this.showDialog = true
    })
  }

  public async onArtChanged() {
    if (this.files !== null && (this.$refs.artinput as any).validate()) {
      const imageFile = this.files as File
      this.art = await this.toBase64(imageFile) as string
    } else {
      this.art = this.origDetails.art
    }
  }

  public save() {
    // Only send what's changed
    let details: any = {}
    if (this.hasChanged('art')) {
      details = {...details, art: this.art}
    }
    if (this.hasChanged('desc')) {
      details = {...details, description: this.desc}
    }
    if (this.hasChanged('isCollab')) {
      details = {...details, collaborative: this.isCollab}
    }
    if (this.hasChanged('isPublic')) {
      details = {...details, public: this.isPublic}
    }
    if (this.hasChanged('name')) {
      details = {...details, name: this.name}
    }

    // We can only set collaborative = true on non-public playlists
    if (details.hasOwnProperty('public') && details.public) {
      delete details.collab
    }

    if (Object.keys(details).length) {
      this.loading = true
      this.$store.dispatch('changePlaylistDetails', {id: this.id, details})
        .then(() => {
          this.showDialog = false
          this.$bus.$emit('change-navbar', {name: this.name})
        })
        .finally(() => this.loading = false)
    } else {
      this.showDialog = false
    }
  }

  public toggleCollab() {
    if (this.isPublic && this.isCollab) {
      this.isCollab = false
    }
  }

  /**
   * Cover art file validation
   */
  get rules(): any[] {
    const rules = [
      (file: File) => file.size <= 256 * 1000 || 'File must not exceed 256 KB',
      (file: File) => file.type === 'image/jpeg' || `File must be valid JPEG`,
    ]
    return this.files === null ? [] : rules
  }

  /**
   * Getters and setters
   */
  get art() {
    return this.hasChanged('art') ? this.editDetails.art : this.origDetails.art
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

  private hasChanged(key: string): boolean {
    return this.editDetails[key] !== this.origDetails[key]
  }

  private toBase64(file: File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve((reader.result as string).trim())
      reader.onerror = (error) => reject(error)
    })
  }
}
</script>

<style lang="scss" scoped>
  @import '../styles/components/PlaylistEditDialog';
</style>
