// https://dev.twitch.tv/docs/embed/video-and-clips

import { twitch as MATCH_SRC } from '../constants/src-regex.js';
import {
  getMetaId,
  createPlayPromise,
} from '../helpers.js';
import {
  createElement,
  removeNode,
  loadScript,
  publicPromise,
  promisify,
  uniqueId,
  createTimeRanges,
} from '../utils.js';

const API_URL = 'https://player.twitch.tv/js/embed/v1.js';
const API_GLOBAL = 'Twitch';

export function createPlayer(element) {
  let api;
  let div;
  let ready;

  function getOptions() {
    return {
      video: getMetaId(MATCH_SRC, element.src),
      height: '100%',
      width: '100%',
      autoplay: element.playing || element.autoplay,
      loop: element.loop,
      playsinline: element.playsinline,
      controls: element.controls,
      muted: element.muted,
      ...element.config.twitch,
    };
  }

  async function init() {
    ready = publicPromise();

    const opts = getOptions();
    const id = uniqueId('tc');

    div = createElement('div', { id });

    const Twitch = await loadScript(opts.apiUrl || API_URL, API_GLOBAL);
    api = new Twitch.Player(id, opts);

    await promisify(api.addEventListener, api)('ready');
    ready.resolve();
  }

  const unsupported = {
    playbackRate: undefined,
  };

  const meta = {
    get identifier() { return getMetaId(MATCH_SRC, element.src); },
  };

  const methods = {
    name: 'Twitch',
    version: '1.x.x',
    unsupported,
    meta,

    get element() {
      return div;
    },

    get api() {
      return api;
    },

    ready() {
      return ready;
    },

    remove() {
      api.destroy();
      removeNode(div);
    },

    play() {
      // play doesn't return a play promise.
      api.play();
      return createPlayPromise(element);
    },

    set src(value) {
      api.setVideo('v' + getMetaId(MATCH_SRC, element.src));
    },

    set controls(value) {
      api.showPlayerControls(value);
    },

    set currentTime(seconds) {
      api.seek(seconds);
    },

    async getBuffered() {
      const loaded = api.getPlaybackStats().bufferSize + api.getCurrentTime();
      return createTimeRanges(0, loaded);
    },
  };

  init();

  return methods;
}
