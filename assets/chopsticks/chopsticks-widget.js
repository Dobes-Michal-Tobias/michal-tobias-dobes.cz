(function () {
  var root = document.getElementById('chopsticks-app');
  if (!root) return;

  var selects = {
    p1a: root.querySelector('[data-role="p1a"]'),
    p1b: root.querySelector('[data-role="p1b"]'),
    p2a: root.querySelector('[data-role="p2a"]'),
    p2b: root.querySelector('[data-role="p2b"]'),
  };
  var turnButtons = root.querySelectorAll('[data-turn]');
  var rulesetButtons = root.querySelectorAll('[data-ruleset]');
  var resultEl = root.querySelector('[data-role="result"]');

  var state = { p1a: 2, p1b: 2, p2a: 2, p2b: 2, turn: 0, ruleset: 'basic' };
  var DATA = null;

  fetch('../assets/chopsticks/chopsticks-data.json')
    .then(function (r) { return r.json(); })
    .then(function (json) { DATA = json; render(); })
    .catch(function () {
      resultEl.innerHTML = '<p class="placeholder">Data se nepodařilo načíst — zkuste stránku otevřít přes webserver, ne přímo ze souboru.</p>';
    });

  Object.keys(selects).forEach(function (key) {
    selects[key].addEventListener('change', function () {
      state[key] = parseInt(selects[key].value, 10);
      render();
    });
  });

  turnButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      turnButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.turn = parseInt(btn.dataset.turn, 10);
      render();
    });
  });

  rulesetButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      rulesetButtons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.ruleset = btn.dataset.ruleset;
      render();
    });
  });

  function sortedHand(a, b) { return a <= b ? [a, b] : [b, a]; }

  function statusLabel(status) {
    if (status === 'WIN') return { text: 'VÝHRA', cls: 'cw-win' };
    if (status === 'LOSS') return { text: 'PROHRA', cls: 'cw-loss' };
    return { text: 'REMÍZA', cls: 'cw-draw' };
  }

  var STATUS_CS = { WIN: 'výhra', LOSS: 'prohra', DRAW: 'remíza' };

  function render() {
    if (!DATA) {
      resultEl.innerHTML = '<p class="placeholder">Načítám data…</p>';
      return;
    }
    var p1 = sortedHand(state.p1a, state.p1b);
    var p2 = sortedHand(state.p2a, state.p2b);
    var key = p1[0] + '' + p1[1] + '-' + p2[0] + '' + p2[1] + '-' + state.turn;
    var entry = DATA[state.ruleset][key];
    if (!entry) {
      resultEl.innerHTML = '<p class="placeholder">Tuhle pozici se nepodařilo najít.</p>';
      return;
    }

    var moverLabel = state.turn === 0 ? 'Hráč 1' : 'Hráč 2';
    var mover = state.turn === 0 ? p1 : p2;

    if (mover[0] === 0 && mover[1] === 0) {
      resultEl.innerHTML =
        '<p class="cw-verdict"><span class="cw-status cw-loss">KONEC HRY</span> — ' + moverLabel + ' nemá žádnou živou ruku, prohrává.</p>';
      return;
    }

    var s = statusLabel(entry.status);
    var verdictText;
    if (entry.status === 'WIN') {
      verdictText = moverLabel + ' vyhrává — vynucená výhra za ' + entry.distance + ' tahů při dokonalé hře.';
    } else if (entry.status === 'LOSS') {
      verdictText = moverLabel + ' prohrává — soupeř to může vynutit za ' + entry.distance + ' tahů.';
    } else {
      verdictText = 'Remíza (cyklus) — žádná strana tu nemá vynucenou výhru, záleží na chybách.';
    }

    var html = '<p class="cw-verdict"><span class="cw-status ' + s.cls + '">' + s.text + '</span> ' + verdictText + '</p>';

    if (entry.moves && entry.moves.length) {
      html += '<p class="cw-moves-label">Doporučené tahy (od nejlepšího):</p><ul class="plain">';
      entry.moves.forEach(function (m) {
        html += '<li>' + m.move + ' <span class="cw-move-note">(soupeř pak: ' + STATUS_CS[m.opponentStatus] +
          (m.opponentDistance !== null ? ', ' + m.opponentDistance + ' tahů' : '') + ')</span></li>';
      });
      html += '</ul>';
    }

    resultEl.innerHTML = html;
  }
})();
