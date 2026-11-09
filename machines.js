/* machines.js — the shared /machine switcher for every machine page.
 *
 * WHY THIS FILE EXISTS
 * Each machine stays a completely separate HTML file, so updating one machine
 * never touches another. This is the only shared piece: it owns the list of
 * machines and draws the dropdown in the top-left "/machine" box.
 *
 * ADDING A MACHINE (two steps, nothing else)
 *   1. Add one line to MACHINES below:  { id, label, url }
 *      `url` is relative to the folder that holds machines.js (the site root).
 *   2. Put one tag in that page's <head>, before its module scripts:
 *        <script src="machines.js" data-machine="YOUR_ID"></script>
 *      Use "../machines.js" for pages inside a subfolder, e.g. Crane/.
 * The dropdown on every page picks up the new entry automatically.
 *
 * CURRENT FILES
 *   index.html               canonical scrubber page (the GitHub Pages entry)
 *   scrubber.html            source copy; also opens standalone with the switcher
 *   Crane/gantry-crane.html  crane page
 * Edit index.html directly for future scrubber work, or re-copy scrubber.html
 * over it; keep the two in sync if both public URLs are used.
 *
 * Works from file://, GitHub Pages project sites (/repo/) and custom domains:
 * the site root is derived from this script's own URL, not hardcoded.
 */
(function () {
  'use strict'

  var script = document.currentScript
  var declared = (script && script.getAttribute('data-machine')) || ''
  var src = (script && script.src) ? script.src : location.href
  var BASE = src.replace(/[?#].*$/, '').replace(/machines\.js$/, '')

  // ---------------------------------------------------------------- registry
  var MACHINES = [
    { id: 'scrubber', label: 'Cross-flow scrubber', url: 'index.html' },
    { id: 'crane',    label: 'Rail gantry crane',   url: 'Crane/gantry-crane.html' }
    // { id: 'pump',  label: 'Centrifugal pump',     url: 'Pump/pump.html' },
  ]

  function byId(id) {
    for (var i = 0; i < MACHINES.length; i++) if (MACHINES[i].id === id) return MACHINES[i]
    return null
  }
  function matchesPath(m) {
    var p = location.pathname
    if (p.slice(-m.url.length) === m.url) return true
    // A site root ("/" or "/repo/") serves the first machine's index.html.
    return m.url === 'index.html' && p.slice(-1) === '/'
  }

  var active = byId(declared)
  if (!active) {
    for (var i = 0; i < MACHINES.length; i++) if (matchesPath(MACHINES[i])) { active = MACHINES[i]; break }
  }
  if (!active) active = MACHINES[0]
  var ACTIVE_ID = active.id

  function carriedQuery() {
    var q = new URLSearchParams(location.search)
    q.delete('machine')          // the URL path now identifies the machine
    var s = q.toString()
    return (s ? '?' + s : '') + location.hash
  }
  function go(m) { location.href = BASE + m.url + carriedQuery() }

  // Backwards compatibility with the old single-file build, which used
  // index.html?machine=crane. Send those bookmarks to the real crane page.
  var wanted = new URLSearchParams(location.search).get('machine')
  if (wanted && wanted !== ACTIVE_ID) {
    var target = byId(wanted)
    if (target) { location.replace(BASE + target.url + carriedQuery()); return }
  }

  // ------------------------------------------------------------------ styles
  // Everything inherits from each page's own .lab-prompt and CSS variables
  // (--ink / --mute / --line / --accent), so the toggle looks native on both
  // the light and night themes and follows each page's responsive rules.
  var CSS = [
    // .lab-ui deliberately disables pointer events; opt this widget back in.
    '.lab-prompt.msw-ready { display:flex !important; align-items:center; gap:.5em; pointer-events:auto !important; z-index:5 }',
    '.lab-prompt.msw-ready b { flex:none; white-space:nowrap }',
    '.lab-prompt.msw-ready .txt, .lab-prompt.msw-ready .caret { display:none !important }',
    '.lab-prompt.msw-ready .msw { position:relative; display:inline-flex; align-items:center; min-width:0; flex:0 1 auto }',
    '.lab-prompt.msw-ready select.msw-sel {',
    '  font:inherit; font-weight:500; color:var(--ink); line-height:1.3;',
    '  background:transparent; border:0; border-bottom:1px solid var(--line); border-radius:0;',
    '  padding:.05em 1.45em .1em .1em; margin:0; outline:none; cursor:pointer; pointer-events:auto !important;',
    '  -webkit-appearance:none; appearance:none;',
    '  max-width:min(46vw,280px); white-space:nowrap; text-overflow:ellipsis',
    '}',
    '.lab-prompt.msw-ready select.msw-sel:hover { border-bottom-color:var(--mute) }',
    '.lab-prompt.msw-ready select.msw-sel:focus-visible { outline:2px solid var(--accent); outline-offset:3px; border-radius:2px }',
    '.lab-prompt.msw-ready select.msw-sel option { color:var(--ink); background:var(--paper) }',
    '.lab-prompt.msw-ready .msw-chev { position:absolute; right:.1em; top:50%; transform:translateY(-50%); pointer-events:none; font-size:.72em; color:var(--mute) }'
  ].join('\n')

  function injectStyle() {
    if (document.getElementById('machines-switcher-css')) return
    var st = document.createElement('style')
    st.id = 'machines-switcher-css'
    st.textContent = CSS
    document.head.appendChild(st)
  }

  // ------------------------------------------------------------------ widget
  function install() {
    var p = document.querySelector('.lab-prompt')
    if (!p) return false
    if (p.querySelector('select.msw-sel')) return true

    injectStyle()

    var wrap = document.createElement('span')
    wrap.className = 'msw'

    var sel = document.createElement('select')
    sel.className = 'msw-sel'
    sel.setAttribute('aria-label', 'Switch machine')
    for (var i = 0; i < MACHINES.length; i++) {
      var o = document.createElement('option')
      o.value = MACHINES[i].id
      o.textContent = MACHINES[i].label
      if (MACHINES[i].id === ACTIVE_ID) o.selected = true
      sel.appendChild(o)
    }
    sel.addEventListener('change', function () {
      var m = byId(sel.value)
      if (m && m.id !== ACTIVE_ID) go(m)
      else sel.value = ACTIVE_ID
    })
    wrap.appendChild(sel)

    var chev = document.createElement('span')
    chev.className = 'msw-chev'
    chev.setAttribute('aria-hidden', 'true')
    chev.textContent = '\u25BE'
    wrap.appendChild(chev)

    p.appendChild(wrap)
    p.classList.add('msw-ready')
    return true
  }

  // Module scripts are deferred, so .lab-prompt exists by DOMContentLoaded.
  // A short retry also covers pages that build their UI a little later.
  function start() {
    if (install()) return
    var n = 0
    var t = setInterval(function () {
      n++
      if (install() || n > 60) clearInterval(t)
    }, 100)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
  else start()

  // Small public surface, handy for smoke tests and future machines.
  window.MACHINES = {
    list: MACHINES,
    get active() { return ACTIVE_ID },
    get base() { return BASE },
    go: function (id) { var m = byId(id); if (m) go(m) }
  }
})()
