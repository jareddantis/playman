<template>
  <div id="app">
    <router-view :key="$route.fullPath" />
  </div>
</template>

<style lang="stylus">
  @require './styles/global'

  #app
    width 100%
</style>

<script lang="ts">
  import Vue from 'vue'

  export default class App extends Vue {}
</script>
