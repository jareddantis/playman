<template>
  <div class="action-bar">
    <v-btn text small icon color="white">
      <v-icon>select_all</v-icon>
    </v-btn>
    <v-btn text small icon color="white">
      <v-icon>more_vert</v-icon>
    </v-btn>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { Component } from 'vue-property-decorator'

  @Component
  export default class HomeBar extends Vue {

  }
</script>

<style lang="scss" scoped>
  @import '../styles/components/ActionBar';
</style>
