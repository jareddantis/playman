<template>
  <div>
    <v-btn @click="$bus.$emit('cut-tracks')" color="white" icon small
           text>
      <v-icon>cut</v-icon>
    </v-btn>
    <v-btn @click="$bus.$emit('delete-tracks')" color="white" icon small
           text>
      <v-icon>delete</v-icon>
    </v-btn>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {Component} from 'vue-property-decorator'

@Component
export default class TracksBar extends Vue {
}
</script>
