<template>
  <div id="navbar">
    <!--    Loading bar -->
    <v-progress-linear
      :active="loading"
      absolute color="white" indeterminate
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

    <div class="actions right">
      <!--      View actions -->
      <component class="action-bar" :is="actionBar.name" v-show="!loading"></component>

      <!--      User menu -->
      <v-menu nudge-bottom="10" offset-y :disabled="loading">
        <template v-slot:activator="{ on }">
          <img :alt="username" :src="avatarUri" v-on="on" v-show="!actionBar.cancelButton"/>
        </template>
        <v-list two-line dark>
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
        </v-list>
      </v-menu>
    </div>
  </div>
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
    'isReordering',
    'username',
  ]),
})
export default class Navbar extends Vue {
  public avatarUri!: string
  public username!: string
  private checkedTracks!: any
  private isBatchEditing!: boolean
  private isReordering!: boolean
  private loading: boolean = true

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

  get showLogo(): boolean {
    return (this.$route.name === 'Playlists' && !this.isBatchEditing) || this.$route.name === 'Home'
  }

  public created() {
    this.$bus.$on('loading', (isLoading: boolean) => this.loading = isLoading)
  }

  public logout() {
    this.$store.commit('reset')
    window.location.reload()
  }
}
</script>

<style lang="scss" scoped>
  @import '../styles/components/Navbar';
</style>
