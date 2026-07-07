// design-spec-kit registry shared by run-checks and kit-doctor.
// Keep extension names here, not by scanning directories: copied installs may omit extensions.

export const LAYER_GUARDS = {
  base: ['check-tokens.js', 'check-icons.js', 'check-changelog.js', 'check-orphan-css.js'],
  i18n: ['check-i18n.js'],
  handoff: ['check-manifest.js', 'check-deviation.js'],
};

export const KNOWN_EXTENSIONS = {
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
