const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Notifikasi kecil
let timer;
function toast(teks) {
  const t = $('#toast'); t.textContent = teks; t.hidden = false;
  clearTimeout(timer); timer = setTimeout(() => (t.hidden = true), 3200);
}
$$('[data-toast]').forEach(b => b.addEventListener('click', () => toast(b.dataset.toast)));

// Tabel audit: tab + pencarian + rombel
const rows = $$('#prBody tr[data-kat]');
let tab = 'konfirmasi';
function filter() {
  const q = $('#prCari').value.trim().toLowerCase(), rb = $('#prRombel').value.toLowerCase();
  let n = 0;
  rows.forEach(r => {
    const ok = (tab === 'semua' || r.dataset.kat === tab) &&
      (!rb || r.textContent.toLowerCase().includes(rb)) &&
      (!q || r.textContent.toLowerCase().includes(q));
    r.hidden = !ok; if (ok) n++;
  });
  $('#prKosong').hidden = n > 0;
  $('#prInfo').textContent = `Menampilkan ${n} dari 13 kasus yang membutuhkan perhatian`;
}
$$('#prTabs .tab').forEach(t => t.addEventListener('click', () => {
  $$('#prTabs .tab').forEach(x => x.classList.remove('is-active'));
  t.classList.add('is-active'); tab = t.dataset.filter; filter();
}));
['#prCari', '#prRombel'].forEach(s => $(s).addEventListener('input', filter));
filter();

// Tombol Setujui: ubah status verifikasi di tampilan
$$('.js-setujui').forEach(b => b.addEventListener('click', () => {
  const tr = b.closest('tr'), v = $('.verif', tr);
  v.className = 'verif v-ok';
  v.innerHTML = '<i class="bi bi-check-circle"></i> <span>Disetujui Admin</span>';
  b.remove();
  toast('Izin disetujui (simulasi). Sambungkan ke API backend untuk menyimpan.');
  // TODO: fetch('/api/presensi/verifikasi', { method: 'POST', ... })
}));
