(function () {
  var root = document.getElementById('holidaycalc-app');
  if (!root) return;

  var districtSel = root.querySelector('[data-role="district"]');
  var yearSel = root.querySelector('[data-role="year"]');
  var calEl = root.querySelector('[data-role="calendar"]');
  var statsEl = root.querySelector('[data-role="stats"]');
  var noteEl = root.querySelector('[data-role="note"]');
  var src = root.dataset.src || '../assets/holidaycalc/holidaycalc-data.json';

  var MONTHS = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen',
                'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
  var WD = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
  var CODE_CLASS = { T: 'hc-t', W: 'hc-w', H: 'hc-h', B: 'hc-b', J: 'hc-b', S: 'hc-b' };
  var CODE_LABEL = { T: 'vyučování', W: 'víkend', H: 'státní svátek', B: 'prázdniny',
                     J: 'jarní prázdniny', S: 'hlavní prázdniny' };
  var DATA = null;
  var GROUP_OF = {};

  fetch(src)
    .then(function (r) { return r.json(); })
    .then(function (json) { DATA = json; init(); })
    .catch(function () {
      calEl.innerHTML = '<p class="placeholder">Data se nepodařilo načíst — zkuste stránku otevřít přes webserver, ne přímo ze souboru.</p>';
    });

  function parse(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function fmt(isoStr) { var d = parse(isoStr); return d.getDate() + '. ' + (d.getMonth() + 1) + '. ' + d.getFullYear(); }
  function fmtShort(isoStr) { var d = parse(isoStr); return d.getDate() + '. ' + (d.getMonth() + 1) + '.'; }
  function addDays(d, n) { var c = new Date(d); c.setDate(c.getDate() + n); return c; }
  function dayIndex(year, d) { return Math.round((d - new Date(+year, 8, 1)) / 86400000); }

  function init() {
    DATA.districts.forEach(function (r) {
      GROUP_OF[r.name] = r.group;
      var o = document.createElement('option');
      o.value = r.name; o.textContent = r.name;
      districtSel.appendChild(o);
    });
    var years = Object.keys(DATA.years);
    years.forEach(function (y) {
      var o = document.createElement('option');
      o.value = y; o.textContent = DATA.years[y].label;
      yearSel.appendChild(o);
    });
    var today = new Date();
    var current = String(today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1);
    yearSel.value = DATA.years[current] ? current : years[years.length - 1];
    if (GROUP_OF['Praha 1 až 5']) districtSel.value = 'Praha 1 až 5';
    districtSel.addEventListener('change', render);
    yearSel.addEventListener('change', render);
    render();
  }

  function render() {
    var y = yearSel.value;
    var Y = DATA.years[y];
    var group = String(GROUP_OF[districtSel.value]);
    var slot = Y.slot_of_group[group];
    var st = Y.stats[slot];

    var codes = Y.codes.split('');
    var j0 = dayIndex(y, parse(Y.jarni[slot]));
    for (var k = 0; k < 7; k++) codes[j0 + k] = 'J';

    var lwStart = dayIndex(y, parse(st.longest.start));
    var lwEnd = dayIndex(y, parse(st.longest.end));

    var html = '';
    for (var m = 0; m < 12; m++) {
      var monthStart = new Date(+y + (m >= 4 ? 1 : 0), (8 + m) % 12, 1);
      var monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      html += '<div class="hc-month"><p class="hc-month-name">' + MONTHS[monthStart.getMonth()] + ' ' + monthStart.getFullYear() + '</p><div class="hc-grid">';
      WD.forEach(function (w) { html += '<span class="hc-wd">' + w + '</span>'; });
      var lead = (monthStart.getDay() + 6) % 7;
      for (var e = 0; e < lead; e++) html += '<span></span>';
      for (var d = monthStart; d <= monthEnd; d = addDays(d, 1)) {
        var i = dayIndex(y, d);
        var c = codes[i];
        var cls = CODE_CLASS[c] + (i >= lwStart && i <= lwEnd && c === 'T' ? ' hc-long' : '');
        html += '<span class="hc-day ' + cls + '" title="' + fmt(iso(d)) + ' · ' + CODE_LABEL[c] + '">' + d.getDate() + '</span>';
      }
      html += '</div></div>';
    }
    calEl.innerHTML = html;

    statsEl.innerHTML =
      stat('školní rok', fmtShort(Y.first_day) + ' – ' + fmt(Y.last_day)) +
      stat('jarní prázdniny', fmtShort(Y.jarni[slot]) + ' – ' + fmt(iso(addDays(parse(Y.jarni[slot]), 6)))) +
      stat('vyučovacích dnů', st.teaching_days) +
      stat('nejdelší úsek bez volna', st.longest.teaching_days + ' vyučovacích dnů (' + fmtShort(st.longest.start) + ' – ' + fmtShort(st.longest.end) + ')') +
      stat('letní prázdniny ' + parse(Y.summer.start).getFullYear(), Y.summer.days + ' dnů (' + fmtShort(Y.summer.start) + ' – ' + fmtShort(Y.summer.end) + ')') +
      stat('pracovních dnů bez školy', st.free_working_days + ' (dovolená: 20–25 dnů)');

    var notes = [];
    if (+y > DATA.meta.last_published_school_year) {
      notes.push('Školní rok ' + Y.label + ' MŠMT zatím nevyhlásilo — termíny jsou vypočtené podle pravidel vyhlášky.');
    }
    if (Y.deviation) {
      notes.push('V tomto roce MŠMT ukončilo vyučování dříve, než stanoví vyhláška.');
    }
    noteEl.innerHTML = notes.map(function (n) { return '<p>' + n + '</p>'; }).join('');
  }

  function stat(label, value) {
    return '<div class="hc-stat"><span class="hc-stat-label">' + label + '</span><span class="hc-stat-value">' + value + '</span></div>';
  }
})();
