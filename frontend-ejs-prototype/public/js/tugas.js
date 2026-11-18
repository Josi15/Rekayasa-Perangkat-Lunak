const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

let timer;
function toast(t) {
  const el = $('#toast'); el.textContent = t; el.hidden = false;
  clearTimeout(timer); timer = setTimeout(() => (el.hidden = true), 3200);
}
$$('[data-toast]').forEach(b => b.addEventListener('click', () => toast(b.dataset.toast)));

const rows = $$('#baris tr[data-status]');
const { total, ukuran } = window.TUGAS_META;
let halaman = 1, cocok = rows;

function cocokkan() {
  const q = $('#cari').value.trim().toLowerCase(), r = $('#fRombel').value, m = $('#fMapel').value, s = $('#fStatus').value;
  cocok = rows.filter(tr =>
    (!r || tr.dataset.rombel === r) && (!m || tr.dataset.mapel === m) && (!s || tr.dataset.status === s) &&
    (!q || tr.textContent.toLowerCase().includes(q)));
  halaman = 1;
  render();
}

function render() {
  const jml = cocok.length, hal = Math.max(1, Math.ceil(jml / ukuran));
  halaman = Math.min(halaman, hal);
  const awal = (halaman - 1) * ukuran, akhir = Math.min(awal + ukuran, jml);
  rows.forEach(tr => (tr.hidden = true));
  cocok.slice(awal, akhir).forEach(tr => (tr.hidden = false));
  $('#kosong').hidden = jml > 0;

  const filtered = jml !== rows.length;
  const dari = jml ? awal + 1 : 0;
  $('#infoAtas').textContent = `Menampilkan ${akhir - awal} dari ${filtered ? jml : total} tugas`;
  $('#infoBawah').textContent = `Menampilkan ${dari}-${akhir} dari total ${filtered ? jml : total} tugas`;

  const nav = $('#halaman'); nav.innerHTML = '';
  const tombol = (isi, p, opsi = {}) => {
    const b = document.createElement('button');
    b.innerHTML = isi; b.disabled = !!opsi.off;
    if (opsi.aria) b.setAttribute('aria-label', opsi.aria);
    if (p === halaman && !opsi.nav) b.className = 'is-active';
    b.addEventListener('click', () => { halaman = p; render(); });
    nav.appendChild(b);
  };
  tombol('<i class="bi bi-chevron-left"></i>', halaman - 1, { off: halaman === 1, nav: true, aria: 'Sebelumnya' });
  for (let i = 1; i <= hal; i++) tombol(i, i);
  tombol('<i class="bi bi-chevron-right"></i>', halaman + 1, { off: halaman === hal, nav: true, aria: 'Berikutnya' });
}

['#cari', '#fRombel', '#fMapel', '#fStatus'].forEach(s => $(s).addEventListener('input', cocokkan));
$('#btnReset').addEventListener('click', () => {
  $('#cari').value = ''; ['#fRombel', '#fMapel', '#fStatus'].forEach(s => ($(s).value = ''));
  cocokkan();
});

// Ekspor rekap (CSV, bisa dibuka di Excel) dari baris yang sedang terfilter
$('#btnEkspor').addEventListener('click', () => {
  const esc = v => `"${v.replace(/"/g, '""').replace(/\s+/g, ' ').trim()}"`;
  const kepala = ['Nama Tugas', 'Kode', 'Rombel', 'Guru', 'Batas Tenggat', 'Progres', 'Status'];
  const isi = cocok.map(tr => {
    const td = $$('td', tr);
    return [td[0].querySelector('strong').textContent, td[0].querySelector('.kode').textContent,
      td[1].textContent, td[2].textContent, td[3].textContent, td[4].textContent, td[5].textContent].map(esc).join(',');
  });
  const blob = new Blob(['\ufeff' + [kepala.map(esc).join(','), ...isi].join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'rekap-tugas.csv' });
  a.click(); URL.revokeObjectURL(a.href);
  toast('Rekap diunduh sebagai CSV (bisa dibuka di Excel).');
});

$('#btnPeringatan').addEventListener('click', () =>
  toast('Peringatan tenggat massal terkirim (simulasi). Sambungkan ke API backend.'));

render();
