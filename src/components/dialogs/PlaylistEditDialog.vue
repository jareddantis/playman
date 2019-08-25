<template>
  <v-dialog max-width="400" v-model="showDialog" scrollable>
    <v-card>
      <v-card-title>
        <span class="headline">Edit playlist details</span>
      </v-card-title>
      <v-card-text>
        <div class="editor">
          <div class="art">
            <img :alt="name" :src="art">
            <div class="switches">
              <v-switch :disabled="isPublic || loading"
                        hide-details inset label="Collaborative"
                        v-model="isCollab" color="white"></v-switch>
              <v-switch :disabled="loading" @change="toggleCollab" hide-details inset
                        label="Public" v-model="isPublic" color="white"></v-switch>
            </div>
          </div>
          <div class="details">
            <v-text-field :disabled="loading" hide-details label="Name"
                          outlined v-model="name"></v-text-field>
            <v-textarea :disabled="loading" hide-details label="Description"
                        outlined v-model="desc"></v-textarea>
            <v-file-input :disabled="loading" :rules="rules"
                          @change="onArtChanged" accept=".jpg,.jpeg,image/jpeg"
                          outlined placeholder="Choose cover art..." prepend-icon=""
                          prepend-inner-icon="add_photo_alternate" ref="artinput"
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
import {Action} from 'vuex-class'
import {mapState} from 'vuex'
import {Component} from 'vue-property-decorator'

@Component({
  computed: mapState(['currentPlaylist']),
})
export default class PlaylistEditDialog extends Vue {
  private currentPlaylist!: any
  private editDetails: any = {}
  private files: File | null = null
  private loading = false
  private showDialog = false
  @Action('spotify') private spotify!: (message: any) => Promise<any>

  public mounted() {
    this.$bus.$on('show-playlist-edit-dialog', () => {
      this.editDetails = Object.assign({}, this.currentPlaylist)
      this.showDialog = true
    })
  }

  public async onArtChanged() {
    if (this.files !== null && (this.$refs.artinput as any).validate()) {
      const imageFile = this.files as File
      this.art = await this.spotify({
        type: 'toBase64',
        data: {
          file: imageFile,
        },
      })
    } else {
      this.art = this.currentPlaylist.art[0].url
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
      this.spotify({
        type: 'changePlaylistDetails',
        data: {
          id: this.currentPlaylist.id,
          details,
        },
      }).then(() => {
        this.showDialog = false
        this.$emit('edit-complete')
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
    return this.hasChanged('art') ? this.editDetails.art
      : (!!this.currentPlaylist.art ? this.currentPlaylist.art[0].url : require('../../assets/gradient.jpeg'))
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
    return this.editDetails[key] !== this.currentPlaylist[key]
  }
}
</script>

<style lang="scss" scoped>
  @import '../../styles/components/PlaylistEditDialog';
</style>
