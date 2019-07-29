<template>
  <v-app>
    <div id="app">
      <!-- Navbar -->
      <div id="navbar" v-show="isLoggedIn">
        <h1>Playlists</h1>
        <div class="actions">
          <component :is="currentActionBar"></component>
          <v-menu offset-y nudge-bottom="10">
            <template v-slot:activator="{ on }">
              <img v-on="on" :src="avatarUri" :alt="username" />
            </template>
            <v-list dense>
              <v-list-item-group>
                <v-list-item @click="$store.dispatch('clearAllData')">
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

      <!-- Router view -->
      <router-view :key="$route.fullPath" />
    </div>
  </v-app>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { Component } from 'vue-property-decorator'
  import { mapState } from 'vuex'
  import HomeBar from '@/components/HomeBar.vue'

  @Component({
    components: { HomeBar },
    computed: mapState(['avatarUri', 'isLoggedIn', 'username']),
  })
  export default class App extends Vue {
    public avatarUri!: string
    public currentActionBar: string = 'HomeBar'
    public isLoggedIn!: boolean
    public username!: string
  }
</script>

<style lang="scss" scoped>
  @import './styles/App';
</style>
