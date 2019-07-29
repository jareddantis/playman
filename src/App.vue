<template>
  <v-app>
    <div id="app">
      <!-- Navbar -->
      <div id="navbar" v-show="isLoggedIn">
        <h1>Playlists</h1>
        <div class="actions">
          <component :is="currentActionBar"></component>
          <img :src="avatarUri" :alt="username" />
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
    public userMenuIsVisible: boolean = false
  }
</script>

<style lang="scss" scoped>
  @import './styles/App';
</style>
