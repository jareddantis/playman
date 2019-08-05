<template>
  <div>
    <v-btn @click="$bus.$emit('edit-playlist-details')" color="white" icon small
           text>
      <v-icon>edit</v-icon>
    </v-btn>
    <v-menu nudge-bottom="10" offset-y>
      <template v-slot:activator="{ on }">
        <v-btn color="white" icon small text v-on="on">
          <v-icon>more_vert</v-icon>
        </v-btn>
      </template>
      <v-list dark dense>
        <v-list-item-group>
          <v-list-item @click="$bus.$emit('randomize-playlist')">
            <v-list-item-icon>
              <v-icon>shuffle</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Randomize</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-menu>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
  import {Component} from 'vue-property-decorator'

  @Component
export default class PlaylistBar extends Vue {
}
</script>
