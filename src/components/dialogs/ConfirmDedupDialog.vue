<template>
  <v-dialog max-width="300" v-model="showDialog">
    <v-card>
      <v-card-title>
        <span class="headline">Remove duplicates?</span>
      </v-card-title>
      <v-card-text>
        <p class="body-1">This process is irreversible unless you make a backup first.</p>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="showDialog = false" text>cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn @click="confirm" text>remove</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue'
  import {Component} from 'vue-property-decorator'

  @Component
export default class ConfirmDedupDialog extends Vue {
  public showDialog: boolean = false

  public created() {
    this.$bus.$on('dedup-playlist', () => this.showDialog = true)
  }

  public confirm() {
    this.$emit('confirm')
    this.showDialog = false
  }
}
</script>
