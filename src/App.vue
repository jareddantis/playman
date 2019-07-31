<template>
  <v-app>
    <v-content>
      <!-- Navbar -->
      <Navbar v-show="isLoggedIn"/>

      <!-- Router view -->
      <router-view :key="$route.fullPath" />
    </v-content>
  </v-app>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { Component } from 'vue-property-decorator'
  import { mapState } from 'vuex'
  import HomeBar from '@/components/HomeBar.vue'
  import Navbar from '@/components/Navbar.vue'

  @Component({
    components: { HomeBar, Navbar },
    computed: mapState(['avatarUri', 'isLoggedIn', 'username']),
  })
  export default class App extends Vue {
    public avatarUri!: string
    public isLoggedIn!: boolean
    public username!: string
  }
</script>

<style lang="scss" scoped>
  @import './styles/App';
</style>
