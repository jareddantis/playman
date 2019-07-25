<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <router-view :key="$route.fullPath" />
  </div>
</template>

<style lang="stylus">
  @require './styles/global'

  #app
    width 100vw
</style>

<script lang="ts">
  import Vue from 'vue'

  export default class App extends Vue {}
</script>
