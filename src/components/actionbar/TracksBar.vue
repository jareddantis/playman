<template>
  <div>
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="$bus.$emit('cut-tracks')"
               color="white" icon small text v-on="on">
          <v-icon>cut</v-icon>
        </v-btn>
      </template>
      <span>Cut tracks</span>
    </v-tooltip>
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn @click="$bus.$emit('delete-tracks')"
               color="white" icon small text v-on="on">
          <v-icon>delete</v-icon>
        </v-btn>
      </template>
      <span>Delete tracks</span>
    </v-tooltip>
    <v-menu nudge-bottom="10" offset-y>
      <template v-slot:activator="{ on }">
        <v-btn color="white" icon small text v-on="on">
          <v-icon>more_vert</v-icon>
        </v-btn>
      </template>
      <v-list dark dense>
        <v-list-item-group>
          <v-list-item @click="$bus.$emit('copy-tracks', false)">
            <v-list-item-icon>
              <v-icon>file_copy</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Copy to playlist</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
        <v-list-item-group>
          <v-list-item @click="$bus.$emit('copy-tracks', true)">
            <v-list-item-icon>
              <v-icon>move_to_inbox</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Move to playlist</v-list-item-title>
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
export default class TracksBar extends Vue {
}
</script>
