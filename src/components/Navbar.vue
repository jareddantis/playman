<template>
  <nav>
    <!--    Loading bar -->
    <v-progress-linear :active="loading" absolute
                       color="white" indeterminate
                       top></v-progress-linear>

    <div class="view">
      <div class="actions left" v-show="actionBar.cancelButton || actionBar.backButton">
        <!--      Navigate to previous page -->
        <v-btn @click="$router.back()" color="white" :disabled="loading"
               icon small text v-show="actionBar.backButton">
          <v-icon>arrow_back</v-icon>
        </v-btn>
        <!--      Cancel batch edit -->
        <v-btn @click="$bus.$emit('cancel-batch-edit')" color="white" :disabled="loading"
               icon small text v-show="actionBar.cancelButton">
          <v-icon>clear</v-icon>
        </v-btn>
      </div>

      <img v-show="showLogo" :src="require('../assets/logo.svg')" alt="Playman">
    </div>

    <div class="actions right" v-show="isLoggedIn">
      <!--      View actions -->
      <component class="action-bar" :is="actionBar.name" v-show="!loading"></component>

      <!--      User menu -->
      <v-menu nudge-bottom="10" offset-y :disabled="loading">
        <template v-slot:activator="{ on }">
          <img :alt="username" :src="avatarUri" v-on="on" v-show="!actionBar.cancelButton"/>
        </template>
        <v-list>
          <v-list-item @click="logout">
            <v-list-item-avatar>
              <v-icon>exit_to_app</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>Sign out</v-list-item-title>
              <v-list-item-subtitle>Signed in as
                <span class="font-weight-bold">{{ username }}</span></v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item @click="openFeedbackForm">
            <v-list-item-avatar>
              <v-icon>message</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>Comments or suggestions?</v-list-item-title>
              <v-list-item-subtitle>I'd love to know what you think</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-list-item-avatar>
              <v-icon>info</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>{{ buildDate }}</v-list-item-title>
              <v-list-item-subtitle>&copy; 2019 Jared Dantis</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
    <div class="actions right" v-show="!isLoggedIn && $route.name !== 'Callback'">
      <v-btn :loading="isLoggingIn" @click="login"
             class="login-btn" rounded small>Sign in</v-btn>
    </div>
  </nav>
</template>

<script lang="ts">
import Vue from 'vue'
import {mapState} from 'vuex'
import {Component} from 'vue-property-decorator'
import components from '@/components/actionbar'

@Component({
  components,
  computed: mapState([
    'avatarUri',
    'checkedTracks',
    'isBatchEditing',
    'isLoggedIn',
    'isReordering',
    'username',
  ]),
})
export default class Navbar extends Vue {
  public avatarUri!: string
  public isLoggedIn!: boolean
  public isLoggingIn: boolean = false
  public username!: string
  private checkedTracks!: any
  private isBatchEditing!: boolean
  private isReordering!: boolean
  private loading: boolean = false

  get actionBar(): any {
    switch (this.$route.name) {
      case 'Playlists':
        if (this.isBatchEditing) {
          return {name: 'PlaylistsEditBar', backButton: false, cancelButton: true}
        } else {
          return {name: 'PlaylistsBar', backButton: false, cancelButton: false}
        }
      case 'Playlist':
        if (this.isReordering) {
          return {name: 'EmptyBar', backButton: false, cancelButton: true}
        } else if (this.checkedTracks.length) {
          return {name: 'TracksBar', backButton: false, cancelButton: true}
        } else {
          return {name: 'PlaylistBar', backButton: true, cancelButton: false}
        }
      default:
        return {name: 'EmptyBar', backButton: false, cancelButton: false}
    }
  }

  get buildDate(): string {
    return !!process.env.BUILD_DATE ? `Build ${process.env.BUILD_DATE}` : 'Debug build'
  }

  get showLogo(): boolean {
    return (this.$route.name === 'Playlists' && !this.isBatchEditing) || this.$route.name === 'Home'
  }

  public created() {
    this.$bus.$on('loading', (isLoading: boolean) => this.loading = isLoading)
  }

  public login() {
    this.isLoggingIn = true
    window.open(this.$store.getters.authUri, '_self')
  }

  public logout() {
    this.$store.commit('reset')
    this.$router.push({name: 'Home'})
  }

  public openFeedbackForm() {
    window.open('https://forms.gle/otV4et1hHAb1jFCPA', '_blank')
  }
}
</script>

<style lang="scss" scoped>
  @import '../styles/components/Navbar';
</style>
