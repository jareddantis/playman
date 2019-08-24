import PromiseWorker from 'promise-worker'
// @ts-ignore
import Worker from 'worker-loader!./spotify-worker'

const SpotifyWorker = new PromiseWorker(new Worker())

export function send(message: any): Promise<any> {
  return new Promise((resolve, reject) => {
    SpotifyWorker.postMessage(message)
      .then((reply) => resolve(reply))
      .catch((error) => reject(error))
  })
}
