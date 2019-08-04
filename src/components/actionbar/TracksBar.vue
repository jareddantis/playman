<template>
  <div class="action-bar">
    <v-btn text small icon color="white">
      <v-icon>cut</v-icon>
    </v-btn>
    <v-btn text small icon color="white"
           @click="$bus.$emit('delete-tracks')">
      <v-icon>delete</v-icon>
    </v-btn>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { Component } from 'vue-property-decorator'

  @Component
  export default class TracksBar extends Vue {}
</script>

<style lang="scss" scoped>
  @import '../../styles/components/ActionBar';
</style>
