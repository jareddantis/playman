<template>
  <div id="app">
<!--    Navbar -->
    <div id="navbar" v-show="isLoggedIn">
      <h1>Playlists</h1>
      <img :src="avatarUri" :alt="username" />
    </div>

<!--    Router view -->
    <router-view :key="$route.fullPath" />
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { Component } from 'vue-property-decorator'
  import { mapState } from 'vuex'

  @Component({
    computed: mapState(['avatarUri', 'isLoggedIn', 'username']),
  })
  export default class App extends Vue {
    public avatarUri!: string
    public isLoggedIn!: boolean
    public username!: string
    public userMenuIsVisible: boolean = false
  }
</script>

<style lang="stylus" scoped>
  @require './styles/App'
</style>
