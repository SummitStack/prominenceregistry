import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildPeakImageAlt, ULTRA_PROMINENCE_FT } from '../utils/imageHelpers.ts';

describe('buildPeakImageAlt', () => {
  it('uses ultra-prominent language at or above the ultra threshold', () => {
    const alt = buildPeakImageAlt('mount-rainier');

    assert.match(alt, /ultra-prominent peak with [\d,]+ ft of prominence/);
    assert.doesNotMatch(alt, /major prominence peak/);
  });

  it('uses major prominence language below the ultra threshold', () => {
    const stHelensAlt = buildPeakImageAlt('mount-saint-helens');
    const graniteAlt = buildPeakImageAlt('granite-peak-montana');

    assert.match(stHelensAlt, /major prominence peak with 4,595 ft of prominence/);
    assert.doesNotMatch(stHelensAlt, /ultra-prominent/i);

    assert.match(graniteAlt, /major prominence peak with 4,764 ft of prominence/);
    assert.doesNotMatch(graniteAlt, /ultra-prominent/i);
  });

  it('treats exactly 4,921 ft as ultra-prominent', () => {
    assert.equal(ULTRA_PROMINENCE_FT, 4921);
  });
});
