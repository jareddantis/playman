<template>
  <div>
    <v-dialog max-width="300" v-model="showDialog">
      <v-card>
        <v-card-title>
          <span class="headline">Sort playlist by</span>
        </v-card-title>
        <v-list>
          <v-list-item :key="mode" v-for="(mode, index) in modes"
                       @click="selectMode(index)">
            <v-list-item-content>
              <v-list-item-title>{{ mode }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showDialog = false" text>cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog max-width="250" v-model="showConfirmDialog">
      <v-card>
        <v-card-title>
          <span class="headline">Sort playlist?</span>
        </v-card-title>
        <v-card-text>
          <p class="body-1">This process is irreversible unless you make a backup first.</p>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="showConfirmDialog = false" text>cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="confirm" text>sort</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {Component} from 'vue-property-decorator'

@Component
export default class SortDialog extends Vue {
  public loading = false
  public modes: string[] = ['Title', 'Artist', 'Album']
  public selectedMode: number = -1
  public showDialog: boolean = false
  public showConfirmDialog: boolean = false

  public created() {
    this.$bus.$on('sort-playlist', () => {
      this.showDialog = true
      this.showConfirmDialog = false
    })
  }

  public confirm() {
    this.$emit('confirm', this.modes[this.selectedMode])
    this.showConfirmDialog = false
    this.showDialog = false
  }

  public selectMode(mode: number) {
    this.selectedMode = mode
    this.showConfirmDialog = true
  }
}
</script>
