const { detectGCategory } = require('../services/iotCategoryDetect');

describe('detectGCategory vpp_ingest_kind', () => {
  it('prefers topic hint over ambiguous payload', () => {
    const body = { payload: { stage: 'installing' } };
    expect(detectGCategory(body, { vpp_ingest_kind: 'report' })).toBe('G2');
  });

  it('routes metering hint to G9', () => {
    expect(detectGCategory({}, { vpp_ingest_kind: 'metering' })).toBe('G9');
  });
});
