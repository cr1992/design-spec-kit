// fixture 实现侧文件：带一个已申报的偏离标记
// @design-deviation(id: DEV-001, kind: extra-element, basis: docs/design-spec/DEVIATION-LEDGER.md)
export function renderSampleExtraShortcut() {
  return '<button data-design-id="sample-extra" data-deviation-id="DEV-001">quick</button>';
}
