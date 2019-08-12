<template>
  <div class="home">
    <div class="main">
      <h1 :class="$vuetify.breakpoint.mdAndUp ? 'display-4' : 'display-2'">Manage your<br>
        Spotify playlists<br>in a jiffy</h1>
      <v-btn :loading="isLoggingIn" @click="login"
             class="login-btn" rounded x-large>Sign in with Spotify</v-btn>
    </div>

    <v-container class="body" grid-list-lg fluid>
      <v-layout wrap>
        <v-flex d-flex grow xs12 sm6 md4>
          <v-card>
            <v-card-text>
              <v-icon>merge_type</v-icon>
              <h3 class="headline">Merge playlists</h3>
              <p>Combine two or more playlists into a single new playlist</p>
            </v-card-text>
          </v-card>
        </v-flex>
        <v-flex d-flex grow xs12 sm6 md4>
          <v-card>
            <v-card-text>
              <v-icon>settings_backup_restore</v-icon>
              <h3 class="headline">Backup playlists</h3>
              <p>Create local backups of your playlists and restore them as desired</p>
            </v-card-text>
          </v-card>
        </v-flex>
        <v-flex d-flex grow xs12 sm6 md4>
          <v-card>
            <v-card-text>
              <v-icon>sort_by_alpha</v-icon>
              <h3 class="headline">Sort tracks</h3>
              <p>Remove duplicate tracks; sort tracks by title, artist, or album</p>
            </v-card-text>
          </v-card>
        </v-flex>
        <v-flex d-flex grow xs12 sm6 md4>
          <v-card>
            <v-card-text>
              <v-icon>file_copy</v-icon>
              <h3 class="headline">Manage tracks</h3>
              <p>Copy and move between playlists, and even <strong>create playlists from albums</strong></p>
            </v-card-text>
          </v-card>
        </v-flex>
        <v-flex d-flex grow xs12 sm6 md4>
          <v-card>
            <v-card-text>
              <v-icon>shuffle</v-icon>
              <h3 class="headline">Randomize playlists</h3>
              <p>Reorder playlist tracks in a random, unbiased fashion</p>
            </v-card-text>
          </v-card>
        </v-flex>
        <v-flex d-flex grow xs12 sm6 md4>
          <v-card>
            <v-card-text>
              <v-icon>edit</v-icon>
              <h3 class="headline">Edit playlist details</h3>
              <p>Rename, edit descriptions, upload custom cover images, and change privacy</p>
            </v-card-text>
          </v-card>
        </v-flex>
        <v-flex d-flex grow xs12>
          <v-card class="privacy">
            <v-card-text>
              <v-icon>lock</v-icon>
              <h3 class="headline">Keep it private</h3>
              <p>Playman only stores data in your browser and only transmits it to Spotify when necessary.</p>
              <p>View the code to see for yourself!</p>
              <v-btn @click="openGitHub" rounded x-large>View on GitHub</v-btn>
            </v-card-text>
          </v-card>
        </v-flex>
      </v-layout>
    </v-container>

    <div class="footer">
      <p>&copy; 2019 Jared Dantis. Licensed under AGPLv3.</p>
      <p>Spotify API used under the Spotify Developer Terms of Service.<br>
        &quot;Spotify&quot; is &copy; Spotify AB. All rights reserved.</p>
      <p>This application is not affiliated with or endorsed by Spotify AB.</p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {Component} from 'vue-property-decorator'

@Component
export default class Home extends Vue {
  public isLoggingIn: boolean = false
  private repoUri = 'https://github.com/jareddantis/playman'

  public created() {
    this.$bus.$emit('loading', false)
  }

  public login() {
    this.isLoggingIn = true
    this.$store.dispatch('setStateToken')
      .then(() => window.open(this.$store.getters.authUri, '_self'))
  }

  public openGitHub() {
    window.open(this.repoUri, '_blank')
  }
}
</script>

<style lang="scss" scoped>
  @import '../styles/views/Home';
</style>
