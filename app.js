/* ══════════════════════════════════════
   CSV Grid Printer — Application
   ══════════════════════════════════════ */

// ── State ──
let csvData = [];
let headers = [];
let colSettings = [];

// ── DOM Elements ──
const $ = (id) => document.getElementById(id);

const els = {
  fileInput:   $('fileInput'),
  dropZone:    $('dropZone'),
  status:      $('status'),
  colSec:      $('colSec'),
  titleCol:    $('titleCol'),
  colList:     $('colList'),
  gridCols:    $('gridCols'),
  gridRows:    $('gridRows'),
  borderStyle: $('borderStyle'),
  footerText:  $('footerText'),
  footerAlign: $('footerAlign'),
  footerSize:  $('footerSize'),
  footerColor: $('footerColor'),
  btnPrint:    $('btnPrint'),
  emptyMsg:    $('emptyMsg'),
  pages:       $('pages'),
  tplCell:     $('tplCell'),
  calcCols:    $('cC'),
  calcRows:    $('cR'),
  calcTotal:   $('cT'),
  pvHead:      $('pvHead'),
  pvTxt:       $('pvTxt'),
  tgFB:        $('tgFB'),
};

/* ══════════════════════════════════════
   CSV Parsing
   ══════════════════════════════════════ */

function detectDelimiter(text) {
  const firstLine = text.split('\n')[0];
  const commas     = (firstLine.match(/,/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  const tabs       = (firstLine.match(/\t/g) || []).length;

  if (tabs >= commas && tabs >= semicolons && tabs > 0) return '\t';
  return semicolons > commas ? ';' : ',';
}

function parseCSV(text, delimiter) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const result = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const cells = [];
    let current = '';
    let quoted = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (ch === delimiter && !quoted) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    result.push(cells);
  }

  return result;
}

/* ══════════════════════════════════════
   File Handling
   ══════════════════════════════════════ */

function setStatus(message, type) {
  els.status.textContent = message;
  els.status.className = 'status ' + type;
}

function loadFile(file) {
  if (!file.name.match(/\.(csv|tsv|txt)$/i)) {
    setStatus('Unsupported format', 'err');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target.result;
      const delimiter = detectDelimiter(text);
      const parsed = parseCSV(text, delimiter);

      if (parsed.length < 2) {
        setStatus('Not enough data', 'err');
        return;
      }

      headers = parsed[0];
      csvData = parsed.slice(1).filter((row) => row.some((cell) => cell !== ''));
      setStatus(`✓ ${csvData.length} rows — ${headers.length} columns`, 'ok');

      initColumnSettings();
      els.colSec.style.display = 'block';
      els.btnPrint.disabled = false;
      els.emptyMsg.style.display = 'none';
      render();
    } catch (err) {
      setStatus('Error: ' + err.message, 'err');
    }
  };
  reader.readAsText(file);
}

function initColumnSettings() {
  // Title selector
  els.titleCol.innerHTML = '<option value="">— No title —</option>';
  headers.forEach((h, i) => {
    els.titleCol.innerHTML += `<option value="${i}">${h}</option>`;
  });
  if (headers.length) els.titleCol.value = '0';

  // Per-column defaults
  colSettings = headers.map((_, i) => ({
    visible: true,
    align: 'center',
    size: 12,
    bold: i === 0,
  }));

  buildColumnList();
}

/* ══════════════════════════════════════
   Column Settings UI
   ══════════════════════════════════════ */

function buildColumnList() {
  els.colList.innerHTML = '';

  headers.forEach((h, i) => {
    const s = colSettings[i];
    const titleIdx = els.titleCol.value !== '' ? +els.titleCol.value : null;
    const isTitle = i === titleIdx;

    const item = document.createElement('div');
    item.className = 'col-item' + (s.visible ? ' active' : ' inactive');
    item.id = 'ci-' + i;

    item.innerHTML = `
      <div class="col-top">
        <div class="tg-sm${s.visible ? ' on' : ''}" data-i="${i}" onclick="toggleColumn(${i},this)"></div>
        <span class="col-name" onclick="toggleColumn(${i},this.previousElementSibling)">${h}</span>
        ${isTitle ? '<span class="col-role">Title</span>' : ''}
      </div>
      <div class="col-opts"${!s.visible ? ' style="display:none"' : ''} id="co-${i}">
        <div class="mini"><label>Align</label>
          <select onchange="colSettings[${i}].align=this.value;render()">
            <option value="left"${s.align === 'left' ? ' selected' : ''}>Left</option>
            <option value="center"${s.align === 'center' ? ' selected' : ''}>Center</option>
            <option value="right"${s.align === 'right' ? ' selected' : ''}>Right</option>
          </select>
        </div>
        <div class="mini"><label>Size</label>
          <input type="number" value="${s.size}" min="4" max="24" step=".5"
            onchange="colSettings[${i}].size=+this.value;render()"
            oninput="colSettings[${i}].size=+this.value;render()">
        </div>
        <div class="mini-tg"><span>Bold</span>
          <div class="tg-sm${s.bold ? ' on' : ''}" onclick="colSettings[${i}].bold=this.classList.toggle('on');render()"></div>
        </div>
      </div>
    `;
    els.colList.appendChild(item);
  });
}

function toggleColumn(i, el) {
  colSettings[i].visible = !colSettings[i].visible;
  const s = colSettings[i];

  if (el) el.classList.toggle('on', s.visible);

  const item = $('ci-' + i);
  item.classList.toggle('active', s.visible);
  item.classList.toggle('inactive', !s.visible);

  const opts = $('co-' + i);
  if (opts) opts.style.display = s.visible ? '' : 'none';

  render();
}

/* ══════════════════════════════════════
   Configuration
   ══════════════════════════════════════ */

function getConfig() {
  const titleIdx = els.titleCol.value !== '' ? +els.titleCol.value : null;
  return {
    tIdx:   titleIdx,
    cols:   Math.max(1, +els.gridCols.value || 5),
    rows:   Math.max(1, +els.gridRows.value || 10),
    bStyle: els.borderStyle.value,
    fText:  els.footerText.value.trim(),
    fAlign: els.footerAlign.value,
    fSize:  parseFloat(els.footerSize.value) || 6,
    fColor: els.footerColor.value,
    fBold:  els.tgFB.classList.contains('on'),
  };
}

/* ══════════════════════════════════════
   Rendering
   ══════════════════════════════════════ */

function render() {
  updateCalcDisplay();
  renderTemplatePreview();
  renderPages();
}

function updateCalcDisplay() {
  const cols = +els.gridCols.value || 5;
  const rows = +els.gridRows.value || 10;
  els.calcCols.textContent = cols;
  els.calcRows.textContent = rows;
  els.calcTotal.textContent = cols * rows;
}

function renderTemplatePreview() {
  const conf = getConfig();

  let html = '<div class="tpl-body">';
  headers.forEach((h, i) => {
    const s = colSettings[i];
    if (!s.visible) return;
    const isTitle = i === conf.tIdx;
    const val = isTitle ? h : h + ': sample';
    html += `<div class="gc-line" style="font-size:${s.size}pt;font-weight:${s.bold ? 700 : 400};color:${isTitle ? '#111' : '#555'};text-align:${s.align};">${val}</div>`;
  });
  html += '</div>';

  if (conf.fText) {
    html += `<div class="tpl-footer" style="text-align:${conf.fAlign};font-size:${conf.fSize}pt;color:${conf.fColor};font-weight:${conf.fBold ? 700 : 400};">${conf.fText}</div>`;
  }

  els.tplCell.innerHTML = html;
}

function buildCell(cellEl, rowData, conf) {
  const body = document.createElement('div');
  body.className = 'gc-body';

  headers.forEach((h, i) => {
    const s = colSettings[i];
    if (!s.visible) return;

    const isTitle = i === conf.tIdx;
    const val = rowData[i] || '';
    if (!val) return;

    const line = document.createElement('div');
    line.className = 'gc-line';
    line.style.fontSize = s.size + 'pt';
    line.style.fontWeight = s.bold ? '700' : '400';
    line.style.textAlign = s.align;
    line.style.color = isTitle ? '#111' : '#555';
    line.textContent = isTitle ? val : h + ': ' + val;

    body.appendChild(line);
  });

  cellEl.appendChild(body);

  if (conf.fText) {
    const footer = document.createElement('div');
    footer.className = 'gc-footer';
    footer.style.textAlign = conf.fAlign;
    footer.style.fontSize = conf.fSize + 'pt';
    footer.style.color = conf.fColor;
    footer.style.fontWeight = conf.fBold ? '700' : '400';
    footer.textContent = conf.fText;
    cellEl.appendChild(footer);
  }
}

function renderPages() {
  const conf = getConfig();
  const perPage = conf.cols * conf.rows;
  const total = csvData.length;

  if (!total) {
    els.pages.innerHTML = '';
    els.pvHead.style.display = 'none';
    return;
  }

  const totalPages = Math.ceil(total / perPage) || 1;
  els.pvHead.style.display = 'block';
  els.pvTxt.textContent = `${total} items → ${totalPages} pages (${conf.cols}×${conf.rows} = ${perPage}/hal)`;

  els.pages.innerHTML = '';

  for (let p = 0; p < totalPages; p++) {
    const start = p * perPage;
    const page = document.createElement('div');
    page.className = 'a4 show';

    const grid = document.createElement('div');
    grid.className = 'grid';
    grid.style.gridTemplateColumns = `repeat(${conf.cols},1fr)`;
    grid.style.gridTemplateRows = `repeat(${conf.rows},1fr)`;

    for (let i = 0; i < perPage; i++) {
      const idx = start + i;
      const cell = document.createElement('div');
      cell.className = 'gc';
      cell.style.borderStyle = conf.bStyle;

      if (idx < total) {
        buildCell(cell, csvData[idx], conf);
      } else {
        cell.classList.add('empty');
      }
      grid.appendChild(cell);
    }

    if (totalPages > 1) {
      const pageNum = document.createElement('div');
      pageNum.className = 'pgnum';
      pageNum.textContent = `${p + 1} / ${totalPages}`;
      page.appendChild(pageNum);
    }

    page.appendChild(grid);
    els.pages.appendChild(page);
  }
}

/* ══════════════════════════════════════
   Event Listeners
   ══════════════════════════════════════ */

// Drag & drop
els.dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  els.dropZone.classList.add('over');
});
els.dropZone.addEventListener('dragleave', () => {
  els.dropZone.classList.remove('over');
});
els.dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  els.dropZone.classList.remove('over');
  if (e.dataTransfer.files.length) loadFile(e.dataTransfer.files[0]);
});

// File input
els.fileInput.addEventListener('change', (e) => {
  if (e.target.files.length) loadFile(e.target.files[0]);
});

// Layout & footer controls
[
  els.gridCols, els.gridRows, els.borderStyle,
  els.footerText, els.footerAlign, els.footerSize, els.footerColor,
].forEach((el) => {
  el.addEventListener('input', render);
  el.addEventListener('change', render);
});

// Title column change
els.titleCol.addEventListener('change', () => {
  buildColumnList();
  render();
});

// Footer bold toggle
els.tgFB.addEventListener('click', function () {
  this.classList.toggle('on');
  render();
});
