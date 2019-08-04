<template>
  <div id="navbar">
    <!--    Loading bar -->
    <v-progress-linear
      :active="loading"
      indeterminate absolute top
      color="white"></v-progress-linear>

    <div class="view">
      <div class="actions left" v-show="cancelButton || backButton">
        <!--      Navigate to previous page -->
        <v-btn text small icon color="white"
               v-show="backButton" @click="$router.back()">
          <v-icon>arrow_back</v-icon>
        </v-btn>
        <!--      Cancel batch edit -->
        <v-btn text small icon color="white"
               v-show="cancelButton" @click="cancelBatchEdit">
          <v-icon>clear</v-icon>
        </v-btn>
      </div>

      <!--      Current view name -->
      <div class="name" v-show="$vuetify.breakpoint.mdAndUp">
        <h1 class="text-truncate" v-show="showViewName">{{ viewName }}</h1>
      </div>
    </div>

    <div class="actions right">
      <!--      View actions -->
      <component :is="currentActionBar"></component>

      <!--      User menu -->
      <v-menu offset-y nudge-bottom="10">
        <template v-slot:activator="{ on }">
          <img v-on="on" v-show="!cancelButton" :src="avatarUri" :alt="username" />
        </template>
        <v-list dense dark>
          <v-list-item-group>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>Logged in as <span class="font-weight-bold">{{ username }}</span></v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item @click="logout">
              <v-list-item-icon>
                <v-icon>exit_to_app</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Sign out</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-menu>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {mapState} from 'vuex'
import {Component} from 'vue-property-decorator'
import EmptyBar from '@/components/actionbar/EmptyBar.vue'
import PlaylistBar from '@/components/actionbar/PlaylistBar.vue'
import PlaylistsBar from '@/components/actionbar/PlaylistsBar.vue'
import PlaylistsEditBar from '@/components/actionbar/PlaylistsEditBar.vue'
import TracksBar from '@/components/actionbar/TracksBar.vue'

@Component({
  components: {
    EmptyBar, PlaylistBar, PlaylistsBar,
    PlaylistsEditBar, TracksBar,
  },
  computed: mapState(['avatarUri', 'username']),
})
export default class Navbar extends Vue {
  public avatarUri!: string
  public username!: string
  private backButton: boolean = false
  private previousBackButton: boolean = false
  private cancelButton: boolean = false
  private currentActionBar: string = 'PlaylistsBar'
  private loading: boolean = true
  private viewName: string = ''
  private showViewName: boolean = false

  public created() {
    this.$bus.$on('change-navbar', (payload: any) => {
      const {
        actionBar = 'keep',
        backButton, cancelButton,
        name = this.viewName,
      } = payload

      // Retain current action bar if not specified
      if (actionBar !== 'keep') {
        this.currentActionBar = `${actionBar}Bar`
      }

      if (payload.hasOwnProperty('cancelButton')) {
        // Back up navbar state
        this.previousBackButton = this.backButton

        // Show cancel button, hide back button and view name
        this.cancelButton = cancelButton
        this.backButton = !cancelButton
        this.showViewName = !cancelButton
      } else {
        // Only one left action is displayed at a time.
        // Cancel button takes precedence (as above)
        if (payload.hasOwnProperty('backButton')) {
          this.backButton = backButton
          if (backButton) {
            this.cancelButton = false
          }
        }

        // Show current view name
        this.showViewName = true
        this.viewName = name
      }
    })
    this.$bus.$on('loading', (isLoading: boolean) => this.loading = isLoading)
  }

  public cancelBatchEdit() {
    this.$bus.$emit('cancel-batch-edit')

    // Restore previous navbar state
    this.backButton = this.previousBackButton
    this.showViewName = true
    this.cancelButton = false
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
