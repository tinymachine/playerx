// https://knowledge.vidyard.com/hc/en-us/articles/360019034753

import { vidyard as MATCH_SRC } from '../constants/src-regex.js';
import { getMetaId, createPlayPromise } from '../helpers.js';
import {
  createElement,
  addCssRule,
  loadScript,
  publicPromise,
  promisify,
  clamp,
} from '../utils.js';

const API_URL = 'https://play.vidyard.com/embed/v4.js';
const API_GLOBAL = 'VidyardV4';
const API_GLOBAL_READY = 'onVidyardAPI';

addCssRule('.vidyard-player-container #backlink', {
  display: 'none',
});

addCssRule(`.vidyard-player-container,.vidyard-player-container>div`, {
  position: 'absolute !important',
  height: '100% !important',
  width: '100% !important',
  padding: '0 !important',
});

export function createPlayer(element) {
  let api;
  let img;
  let ready;
  let VidyardV4;
  let apiVolume;

  function getOptions() {
    return {
      autoplay: element.playing || element.autoplay,
      ...element.config.vidyard,
    };
  }

  async function init() {
    ready = publicPromise();

    const opts = getOptions();
    const metaId = getMetaId(MATCH_SRC, element.src);

    img = createElement('img', {
      class: 'vidyard-player-embed',
      src: `https://play.vidyard.com/${metaId}.jpg`,
      'data-uuid': metaId,
      'data-v': '4',
      'data-type': 'inline',
      style: 'display:none',
    });

    VidyardV4 = await loadScript(
      opts.apiUrl || API_URL,
      API_GLOBAL,
      API_GLOBAL_READY
    );
    const renderPromise = VidyardV4.api.renderPlayer(img);

    api = await renderPromise;
    await promisify(api.on, api)('ready');

    api.on('volumeChange', (vol) => (apiVolume = vol));

    ready.resolve();

    opts.autoplay && api.play();
  }

  const eventAliases = {
    volumechange: 'volumeChange',
    ended: 'playerComplete',
    loadedmetadata: 'metadata'
  };

  const unsupportedEvents = {
    playing: undefined,
    progress: undefined,
    durationchange: undefined,
    loadstart: undefined,
    seeking: undefined,
    seeked: undefined,
    cuechange: undefined,
    ratechange: undefined,
    error: undefined,
    bufferstart: undefined,
    bufferend: undefined,
    resize: undefined,
  };

  const unsupported = {
    controls: undefined,
  };

  const meta = {
    get identifier() { return getMetaId(MATCH_SRC, element.src); },
    get name() { return api.metadata.chapters_attributes[0].video_attributes.name; },
  };

  const methods = {
    name: 'Vidyard',
    version: '1.x.x',
    unsupported,
    meta,

    get element() {
      return img;
    },

    get api() {
      return api;
    },

    ready() {
      return ready;
    },

    remove() {
      return VidyardV4.api.destroyPlayer(api);
    },

    play() {
      // play doesn't return a play promise.
      api.play();
      return createPlayPromise(element);
    },

    on(eventName, callback) {
      if (eventName in unsupportedEvents) return;
      api.on(eventAliases[eventName] || eventName, callback);
    },

    off(eventName, callback) {
      api.off(eventAliases[eventName] || eventName, callback);
    },

    setSrc() {
      // Must return promise here to await ready state.
      return element.load();
    },

    get duration() {
      return api && api.metadata.chapters_attributes[0].video_attributes.length_in_seconds;
    },

    set currentTime(seconds) {
      api.seek(seconds);
    },

    set muted(muted) {
      muted ? api.setVolume(0) : api.setVolume(+element.cache('volume'));
    },

    get muted() {
      return apiVolume === 0;
    },

    set volume(volume) {
      if (!element.muted) {
        api.setVolume(clamp(0.001, 1, volume));
      }
    },

    async getVolume() {
      return +element.cache('volume');
    },

    set playbackRate(value) {
      api.setPlaybackSpeed(value);
    },
  };

  init();

  return methods;
}
