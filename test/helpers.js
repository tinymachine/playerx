import test from 'tape';
import { Playerx } from '../src/playerx/index.js';
import { createPlayPromise, getMetaId } from '../src/playerx/helpers.js';

test(`createPlayPromise`, async (t) => {
  t.plan(1);

  const player = new Playerx();

  createPlayPromise(player).then(() => {
    t.assert(true, 'started playing');
  });

  player.fire('playing');
});

test(`getMetaId`, (t) => {
  t.plan(1);

  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/;
  t.equal(getMetaId(vimeo, 'https://vimeo.com/357274789'), '357274789');
});
