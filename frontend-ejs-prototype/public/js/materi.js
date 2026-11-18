const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

let timer;
function toast(t) {
  const el = $('#toast'); el.textContent = t; el.hidden = false;
  clearTimeout(timer); timer = setTimeout(() => (el.hidden = true), 3200);
}
$$('[data-toast]').forEach(b => b.addEventListener('click', () => toast(b.dataset.toast)));

// Unggah modul: buka pemilih berkas
$('#btnUnggah').addEventListener('click', () => $('#fileUnggah').click());
$('#fileUnggah').addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  toast(`Berkas "${f.name}" dipilih. Sambungkan ke API backend untuk mengunggah.`);
  // TODO: kirim ke backend dengan fetch('/api/materi', { method: 'POST', body: FormData })
});

// Filter + pencarian
const daftar = $('#daftar');
const cards = $$('.mod', daftar);
function filter() {
  const q = $('#cari').value.trim().toLowerCase(), t = $('#fTingkat').value, m = $('#fMapel').value, s = $('#fStatus').value;
  let n = 0;
  cards.forEach(c => {
    const ok = (!t || c.dataset.tingkat === t) && (!m || c.dataset.mapel === m) && (!s || c.dataset.status === s) &&
      (!q || c.textContent.toLowerCase().includes(q));
    c.hidden = !ok; if (ok) n++;
  });
  $('#kosong').hidden = n > 0;
  $('#jumlah').textContent = `${n} item ditampilkan`;
}
['#cari', '#fTingkat', '#fMapel', '#fStatus'].forEach(s => $(s).addEventListener('input', filter));

// Urutkan: Teranyar <-> Terlama
let teranyar = true;
$('#btnUrut').addEventListener('click', () => {
  teranyar = !teranyar;
  $('#urutLabel').textContent = teranyar ? 'Teranyar' : 'Terlama';
  cards.sort((a, b) => teranyar ? b.dataset.urutan - a.dataset.urutan : a.dataset.urutan - b.dataset.urutan)
    .forEach(c => daftar.insertBefore(c, $('#kosong')));
});

// Setujui modul: hapus dari antrean, perbarui hitungan
$$('.js-setujui').forEach(b => b.addEventListener('click', () => {
  b.closest('.q-item').remove();
  const sisa = $$('#antrean .q-item').length;
  $('#pending').textContent = `${sisa} Pending`;
  toast('Modul disetujui (simulasi). Sambungkan ke API backend untuk menyimpan.');
  // TODO: fetch('/api/materi/verifikasi', { method: 'POST', ... })
}));
