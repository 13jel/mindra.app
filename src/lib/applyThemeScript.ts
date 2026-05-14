export const applyThemeScript = `
(function() {
  try {
    var raw = localStorage.getItem('mindra-ui');
    if (!raw) return;
    var parsed = JSON.parse(raw);
    var s = parsed && parsed.state ? parsed.state : {};
    var root = document.documentElement;
    if (s.palette) root.dataset.palette = s.palette;
    if (s.density) root.dataset.density = s.density;
    root.dataset.kind = s.kindMode ? 'on' : 'off';
  } catch (e) {}
})();
`.trim();