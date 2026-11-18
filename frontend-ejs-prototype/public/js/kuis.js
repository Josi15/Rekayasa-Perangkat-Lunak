const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

let timer;
function toast(t) {
  const el = $('#toast'); el.textContent = t; el.hidden = false;
  clearTimeout(timer); timer = setTimeout(() => (el.hidden = true), 3200);
}
$$('[data-toast]').forEach(b => b.addEventListener('click', () => toast(b.dataset.toast)));

// ---- Tab + paginasi tabel ----
const rows = $$('#baris tr');
const { total, ukuran } = window.KUIS_META;
let filter = '', halaman = 1, cocok = rows;

function render() {
  const jml = cocok.length, hal = Math.max(1, Math.ceil(jml / ukuran));
  halaman = Math.min(halaman, hal);
  const awal = (halaman - 1) * ukuran, akhir = Math.min(awal + ukuran, jml);
  rows.forEach(r => (r.hidden = true));
  cocok.slice(awal, akhir).forEach(r => (r.hidden = false));
  const semua = filter === '';
  $('#info').textContent = `Menampilkan ${akhir - awal} dari ${semua ? total : jml} asesmen aktif semester ini`;

  const nav = $('#halaman'); nav.innerHTML = '';
  const btn = (isi, p, off, aktif) => {
    const b = document.createElement('button');
    b.textContent = isi; b.disabled = off;
    if (aktif) b.className = 'is-active';
    b.addEventListener('click', () => { halaman = p; render(); });
    nav.appendChild(b);
  };
  btn('Sebelumnya', halaman - 1, halaman === 1);
  for (let i = 1; i <= hal; i++) btn(i, i, false, i === halaman);
  btn('Berikutnya', halaman + 1, halaman === hal);
}

$$('.kq-tab').forEach(t => t.addEventListener('click', () => {
  $$('.kq-tab').forEach(x => x.classList.toggle('is-active', x === t));
  filter = t.dataset.f;
  cocok = rows.filter(r => !filter || r.dataset.status === filter);
  halaman = 1; render();
}));

// ---- Generator token darurat ----
const ALFA = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
function buatToken() {
  const a = new Uint32Array(2); crypto.getRandomValues(a);
  return `BP-${String(a[0] % 10000).padStart(4, '0')}-${ALFA[a[1] % ALFA.length]}`;
}

function tambahLog(li) {
  const log = $('#log'); log.prepend(li); li.classList.add('baru');
  while (log.children.length > 5) log.lastElementChild.remove();
}

$('#formToken').addEventListener('submit', e => {
  e.preventDefault();
  const nisn = $('#nisn');
  if (!/^\d{10}$/.test(nisn.value.trim())) { nisn.focus(); return toast('NISN harus 10 digit angka.'); }
  const token = buatToken();
  $('#tokenOut').textContent = token;
  const li = document.createElement('li'); li.className = 'token';
  const set = (cls, tag, txt) => { const d = document.createElement(tag); d.className = cls; d.textContent = txt; return d; };
  const l1 = set('l1', 'div', ''); const s = document.createElement('strong');
  s.innerHTML = '<i class="bi bi-shield-lock-fill"></i> '; s.append('Token Bypass Dirilis');
  l1.append(s, set('mono', 'span', 'Baru saja'));
  const l3 = set('l3', 'div', ''); l3.append(set('', 'span', `Berlaku ${$('#masa').value} menit • NISN ${nisn.value.trim()}`));
  li.append(l1, set('l2', 'div', $('#sesi').value), l3);
  tambahLog(li);
  toast(`Token ${token} dirilis (simulasi). Sambungkan ke API backend.`);
  // TODO: fetch('/api/cbt/token-darurat', { method:'POST', body: JSON.stringify({ sesi, nisn, masa }) })
});

$('#btnSalin').addEventListener('click', async () => {
  const t = $('#tokenOut').textContent;
  try { await navigator.clipboard.writeText(t); toast(`Token ${t} disalin.`); }
  catch { toast('Gagal menyalin. Salin manual dari kotak token.'); }
});

render();
