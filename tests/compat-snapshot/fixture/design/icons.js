(function () {
  const ICONS = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 12l9-9 9 9"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/></svg>'
  };
  function SampleIcons(name) { return ICONS[name] || ''; }
  SampleIcons.home = ICONS.home;
  SampleIcons.gear = ICONS.gear;
  window.SampleIcons = SampleIcons;
})();
