<template>
  <div id="navbar">
<!--    Loading bar -->
    <v-progress-linear
      :active="loading"
      indeterminate absolute top
      color="white"></v-progress-linear>

<!--    Navbar content -->
    <div class="view">
      <v-btn text small icon color="white"
             v-show="backButton" @click="$router.back()">
        <v-icon>arrow_back</v-icon>
      </v-btn>
      <h1 v-html="viewName" class="text-truncate"></h1>
    </div>
    <div class="actions">
<!--      View actions -->
      <transition name="component-fade" mode="out-in">
        <component :is="currentActionBar"></component>
      </transition>

<!--      User menu -->
      <v-menu offset-y nudge-bottom="10">
        <template v-slot:activator="{ on }">
          <img v-on="on" :src="avatarUri" :alt="username" />
        </template>
        <v-list dense>
          <v-list-item-group>
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
import { mapState } from 'vuex'
import { Component } from 'vue-property-decorator'
import EmptyBar from '@/components/actionbar/EmptyBar.vue'
import HomeBar from '@/components/actionbar/HomeBar.vue'
import PlaylistBar from '@/components/actionbar/PlaylistBar.vue'
import TracksBar from '@/components/actionbar/TracksBar.vue'

@Component({
  components: { HomeBar, EmptyBar, PlaylistBar, TracksBar },
  computed: mapState(['avatarUri', 'username']),
})
export default class Navbar extends Vue {
  public avatarUri!: string
  public backButton: boolean = false
  public currentActionBar: string = 'HomeBar'
  public loading: boolean = true
  public username!: string
  public viewName: string = ''

  public created() {
    this.$bus.$on('change-navbar', (payload: any) => {
      const {
        actionBar = 'keep',
        backButton = this.backButton,
        name = this.viewName,
      } = payload

      if (actionBar !== 'keep') {
        this.currentActionBar = `${actionBar}Bar`
      }
      this.viewName = name
      this.backButton = backButton
    })
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
