<template>
  <!--  Landing and login screen -->
  <div class="login">
    <h1 :class="$vuetify.breakpoint.mdAndUp ? 'display-4' : 'display-2'">Manage your<br>
      Spotify playlists<br>in a jiffy.</h1>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {Component} from 'vue-property-decorator'

@Component
export default class Home extends Vue {
}
</script>

<style lang="scss" scoped>
  @import '../styles/views/Home';
</style>
