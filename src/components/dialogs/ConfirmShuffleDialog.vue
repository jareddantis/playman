<template>
  <v-dialog max-width="300" v-model="showDialog">
    <v-card>
      <v-card-title>
        <span class="headline">Randomize {{ items }}?</span>
      </v-card-title>
      <v-card-text>
        <p class="body-1">This process is irreversible unless you make a backup first.</p>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="showDialog = false" text>cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn @click="confirm" text>randomize</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue'
import {Component} from 'vue-property-decorator'

@Component
export default class ConfirmShuffleDialog extends Vue {
  public multiple: boolean = false
  public showDialog: boolean = false

  get items(): string {
    return this.multiple ? 'these playlists' : 'this playlist'
  }

  public created() {
    this.$bus.$on('randomize-playlists', (isMultiple: boolean) => {
      this.multiple = isMultiple
      this.showDialog = true
    })
  }

  public confirm() {
    this.$emit('confirm')
    this.showDialog = false
  }
}
</script>

<style scoped>

</style>
