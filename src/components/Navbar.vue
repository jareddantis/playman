<template>
  <div id="navbar">
<!--    Loading bar -->
    <v-progress-linear
      :active="loading"
      indeterminate absolute top
      color="white"></v-progress-linear>

<!--    Navbar content -->
    <h1>{{ viewName }}</h1>
    <div class="actions">
      <component :is="currentActionBar"></component>
      <v-menu offset-y nudge-bottom="10">
        <template v-slot:activator="{ on }">
          <img v-on="on" :src="avatarUri" :alt="username" />
        </template>
        <v-list dense>
          <v-list-item-group>
            <v-list-item @click="$store.dispatch('clearAllData')">
              <v-list-item-icon>
                <v-icon>exit_to_app</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Sign out</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-menu>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import { mapState } from 'vuex'
  import { Component } from 'vue-property-decorator'

  @Component({
    computed: mapState(['avatarUri', 'username']),
  })
  export default class Navbar extends Vue {
    public avatarUri!: string
    public currentActionBar: string = 'HomeBar'
    public loading: boolean = false
    public username!: string
    public viewName: string = ''

    public created() {
      this.$bus.$on('change-navbar-title', (title: string) => this.viewName = title)
      this.$bus.$on('loading', (isLoading: boolean) => this.loading = isLoading)
    }
  }
</script>

<style lang="scss" scoped>
  @import '../styles/components/Navbar';
</style>
