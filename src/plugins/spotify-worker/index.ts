import PromiseWorker from 'promise-worker'
// @ts-ignore
import Worker from 'worker-loader!./worker'

const SpotifyWorker = new PromiseWorker(new Worker())

export default {
  send(content: any) {
    return new Promise((resolve, reject) => {
      SpotifyWorker.postMessage({
        type: 'message',
        content,
      }).then((reply) => resolve(reply))
        .catch((error) => reject(new Error(error)))
    })
  },
}
