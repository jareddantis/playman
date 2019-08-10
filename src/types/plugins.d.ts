import Vue from 'vue'

interface WorkerRequestContent {
  type: string,
  data: any,
}

interface PlaymanWorkerPlugin {
  send: (content: WorkerRequestContent) => Promise<any>
}

declare module 'vue/types/vue' {
  interface Vue {
    $bus: Vue,
    $worker: PlaymanWorkerPlugin
  }
}
