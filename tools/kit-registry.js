// design-spec-kit registry shared by run-checks and kit-doctor.
// Keep extension names here, not by scanning directories: copied installs may omit extensions.

export const LAYER_GUARDS = {
  base: ['check-tokens.js', 'check-icons.js', 'check-changelog.js', 'check-orphan-css.js'],
  i18n: ['check-i18n.js'],
  handoff: ['check-manifest.js', 'check-deviation.js'],
};

export const KNOWN_EXTENSIONS = {
  // 通用实现栈视觉契约执行器（MULTI-MODULE-PROPOSAL 方案 3）：
  // config-only 校验 + evidence runner + matcher 集（substring/regex/flutter-expanded/playwright-list）。
  'impl-visual': {
    dir: 'extensions/impl-visual',
    guards: ['check-impl-visual.js'],
  },
  // impl-visual 的注册别名（弃用窗口 ≥2 个 minor）：kit.layers 'flutter-visual' 与
  // extensions.flutter-visual 配置路径原样可用；guard 文件是薄转发壳（--as flutter-visual）。
  'flutter-visual': {
    dir: 'extensions/flutter-visual',
    guards: ['check-flutter-visual.js'],
  },
};

export const DEFAULT_INSTALLED_LAYERS = ['base'];

export function isKnownLayer(name) {
  return Object.prototype.hasOwnProperty.call(LAYER_GUARDS, name);
}

export function isKnownExtension(name) {
  return Object.prototype.hasOwnProperty.call(KNOWN_EXTENSIONS, name);
}
