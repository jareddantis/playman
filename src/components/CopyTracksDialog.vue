<template>
  <v-dialog max-width="300" v-model="showDialog">
    <v-card>
      <v-card-title>
        <span class="headline">{{ mode }} selected tracks?</span>
      </v-card-title>
      <v-card-actions>
        <v-btn @click="showDialog = false" text>cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn @click="confirm" text>{{ mode }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue'
import {Component} from 'vue-property-decorator'

@Component
export default class CopyTracksDialog extends Vue {
  public showDialog: boolean = false
  public payload: any = {}

  get mode(): string {
    return this.payload.willMove ? 'Move' : 'Copy'
  }

  public created() {
    this.$bus.$on('confirm-copy-tracks', (payload: any) => {
      this.payload = payload
      this.showDialog = true
    })
  }

  public confirm() {
    this.$emit('confirm', this.payload)
    this.showDialog = false
  }
}
</script>
