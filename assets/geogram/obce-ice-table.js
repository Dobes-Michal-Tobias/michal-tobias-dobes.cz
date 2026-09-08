(function () {
  var root = document.getElementById('ice-table-app');
  if (!root) return;

  var searchInput = root.querySelector('[data-role="search"]');
  var regionSelect = root.querySelector('[data-role="filter-region"]');
  var zemeSelect = root.querySelector('[data-role="filter-zeme"]');
  var numberSelect = root.querySelector('[data-role="filter-number"]');
  var suffixSelect = root.querySelector('[data-role="filter-suffix"]');
  var tbody = root.querySelector('tbody');
  var countEl = root.querySelector('[data-role="count"]');
  var headers = root.querySelectorAll('th[data-key]');

  var rows = [];
  var sortKey = 'population';
  var sortDir = 'desc';

  function fillSelect(select, values) {
    values.forEach(function (v) {
      var opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
  }

  function uniqueSorted(key) {
    var seen = {};
    rows.forEach(function (r) { seen[r[key]] = true; });
    return Object.keys(seen).sort(function (a, b) { return a.localeCompare(b, 'cs'); });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render() {
    var q = searchInput.value.trim().toLowerCase();
    var region = regionSelect.value;
    var zeme = zemeSelect.value;
    var number = numberSelect.value;
    var suffix = suffixSelect.value;

    var filtered = rows.filter(function (r) {
      if (q && r.name.toLowerCase().indexOf(q) === -1) return false;
      if (region && r.region !== region) return false;
      if (zeme && r.zeme !== zeme) return false;
      if (number && r.number !== number) return false;
      if (suffix && r.suffix !== suffix) return false;
      return true;
    });

    filtered.sort(function (a, b) {
      var va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      va = String(va); vb = String(vb);
      return sortDir === 'asc' ? va.localeCompare(vb, 'cs') : vb.localeCompare(va, 'cs');
    });

    var html = filtered.map(function (r) {
      return '<tr>' +
        '<td>' + escapeHtml(r.name) + '</td>' +
        '<td>' + escapeHtml(r.region) + '</td>' +
        '<td>' + escapeHtml(r.zeme) + '</td>' +
        '<td class="num">' + (r.population != null ? r.population.toLocaleString('cs') : '—') + '</td>' +
        '<td>' + escapeHtml(r.number) + '</td>' +
        '<td>' + escapeHtml(r.suffix) + '</td>' +
        '</tr>';
    }).join('');

    tbody.innerHTML = html || '<tr><td colspan="6" class="table-empty">Žádná obec neodpovídá filtru.</td></tr>';
    countEl.textContent = filtered.length.toLocaleString('cs') + ' / ' + rows.length.toLocaleString('cs') + ' obcí';

    headers.forEach(function (th) {
      th.classList.remove('sorted-asc', 'sorted-desc');
      if (th.dataset.key === sortKey) th.classList.add(sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
    });
  }

  headers.forEach(function (th) {
    th.addEventListener('click', function () {
      var key = th.dataset.key;
      if (sortKey === key) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortKey = key;
        sortDir = key === 'population' ? 'desc' : 'asc';
      }
      render();
    });
  });

  [searchInput, regionSelect, zemeSelect, numberSelect, suffixSelect].forEach(function (el) {
    el.addEventListener('input', render);
    el.addEventListener('change', render);
  });

  fetch('../assets/geogram/obce-ice-table.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      rows = data;
      fillSelect(regionSelect, uniqueSorted('region'));
      fillSelect(zemeSelect, uniqueSorted('zeme'));
      fillSelect(numberSelect, ['Plurál', 'Singulár', 'Neznámé']);
      fillSelect(suffixSelect, ['-ovice', '-nice', 'holé -ice']);
      render();
    })
    .catch(function (err) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Data se nepodařilo načíst.</td></tr>';
      console.error('obce-ice-table:', err);
    });
})();
