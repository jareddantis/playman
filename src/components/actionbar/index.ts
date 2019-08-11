export default {
  EmptyBar: () => import(/* webpackChunkName: "actionbar" */ './EmptyBar.vue'),
  PlaylistBar: () => import(/* webpackChunkName: "actionbar" */ './PlaylistBar.vue'),
  PlaylistsBar: () => import(/* webpackChunkName: "actionbar" */ './PlaylistsBar.vue'),
  PlaylistsEditBar: () => import(/* webpackChunkName: "actionbar" */ './PlaylistsEditBar.vue'),
  TracksBar: () => import(/* webpackChunkName: "actionbar" */ './TracksBar.vue'),
}
