var PS='Peminatan Sains (Fase F)',PI='Peminatan IPS (Fase F)',WU='Wajib Umum (Fase E & F)',WF='Wajib Umum (Fase F)',ML='Muatan Lokal Daerah',
K=['Ibu Siti Rahmawati, S.Pd.','Hendro Kusuma, M.Si.','Dewi Kartika, S.Pd.','Ahmad Fauzi, S.Kom.','Dra. Nining Suryati','Irwan Setiawan, S.Pd.','Dra. Sri Wahyuni','Agus Prasetyo, S.Si.','Rina Marlina, S.Pd.','Yusuf Hakim, M.Pd.'];
// kode, nama, jenjang, detail, kelompok, jp, koordinator, tim, status(v/r), tab
var D=[
['BIO-301','Biologi Tingkat Lanjut','Kelas XI & XII','⚗ Lab Sains Terpadu',PS,5,0,2,'v','M'],
['MAT-302','Matematika Peminatan & Kalkulus','Kelas XII MIPA','∑',PS,5,1,3,'v','M'],
['IND-101','Bahasa Indonesia','Kelas X, XI, XII','📖 (Reguler Seluruh Rombel)',WU,4,2,4,'v','E'],
['INF-204','Informatika & Rekayasa Perangkat Lunak','Kelas XI','🖥 (Laboratorium Komputer)',PS,4,3,1,'r','M'],
['MLK-102','Bahasa & Budaya Daerah Sunda','Kelas X, XI, XII','🌿 (Kurikulum Daerah Jabar)',ML,2,4,0,'v','E'],
['FIS-301','Fisika Tingkat Lanjut','Kelas XI & XII','⚗ Lab Fisika',PS,5,7,2,'v','M'],
['KIM-301','Kimia Tingkat Lanjut','Kelas XI & XII','⚗ Lab Kimia',PS,5,8,1,'r','M'],
['MAT-301','Matematika Peminatan','Kelas XI MIPA','∑',PS,4,1,2,'v','M'],
['EKO-301','Ekonomi Tingkat Lanjut','Kelas XI & XII IPS','',PI,4,5,1,'v','I'],
['SOS-301','Sosiologi Perubahan Sosial','Kelas XI & XII IPS','',PI,4,6,0,'v','I'],
['GEO-301','Geografi Regional','Kelas XI & XII IPS','',PI,4,9,1,'r','I'],
['SEJ-301','Sejarah Peminatan','Kelas XI & XII IPS','',PI,3,2,0,'v','I'],
['PAI-101','Pendidikan Agama & Budi Pekerti','Kelas X','',WU,3,6,3,'v','E'],
['PKN-101','Pendidikan Pancasila','Kelas X','',WU,2,5,1,'v','E'],
['ING-101','Bahasa Inggris','Kelas X','',WU,3,8,2,'v','E'],
['MAT-101','Matematika Umum','Kelas X','∑',WU,4,1,3,'v','E'],
['SEJ-101','Sejarah Indonesia','Kelas X','',WU,2,9,1,'r','E'],
['PJO-101','PJOK','Kelas X','',WU,3,7,2,'v','E'],
['SBD-101','Seni Budaya','Kelas X','',WU,2,4,1,'v','E'],
['INF-101','Informatika','Kelas X','🖥 (Laboratorium Komputer)',WU,2,3,1,'v','E'],
['IPA-101','Ilmu Pengetahuan Alam Dasar','Kelas X','⚗ Lab Sains Terpadu',WU,4,0,3,'v','E'],
['IPS-101','Ilmu Pengetahuan Sosial Dasar','Kelas X','',WU,3,5,2,'v','E'],
['PRK-101','Projek Penguatan Profil Pelajar','Kelas X','',WU,3,2,3,'r','E'],
['MLK-101','Pendidikan Lingkungan Hidup','Kelas X, XI, XII','🌿',ML,1,7,0,'v','E'],
['MLK-103','Kewirausahaan Lokal','Kelas X, XI, XII','',ML,2,9,1,'v','E'],
['MLK-104','Seni Tradisional Jawa Barat','Kelas X, XI, XII','',ML,2,4,0,'r','E'],
['PAI-201','Pendidikan Agama & Budi Pekerti','Kelas XI & XII','',WF,3,6,3,'v','I'],
['PKN-201','Pendidikan Pancasila','Kelas XI & XII','',WF,2,5,1,'v','I'],
['ING-201','Bahasa Inggris','Kelas XI & XII','',WF,3,8,2,'v','I'],
['MAT-201','Matematika Umum','Kelas XI & XII','∑',WF,3,1,2,'v','I'],
['PJO-201','PJOK','Kelas XI & XII','',WF,3,7,2,'v','I'],
['SBD-201','Seni Budaya','Kelas XI & XII','',WF,2,4,1,'r','I']],
tab='',pg=1,N=5,tt;
function $(i){return document.getElementById(i)}
function toast(m){var e=$('toast');e.textContent=m;e.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){e.classList.remove('show')},1800)}
function ini(s){return s.replace(/^(Ibu|Pak|Dra\.|Drs\.)\s/,'').split(' ').slice(0,2).map(function(x){return x[0]}).join('')}
function render(){var q=$('q').value.trim().toLowerCase(),s=$('ss').value;
 var r=D.filter(function(d){return(!tab||d[9]===tab)&&(!s||d[8]===s)&&(!q||(d[0]+d[1]).toLowerCase().indexOf(q)>-1)});
 var pages=Math.max(1,Math.ceil(r.length/N));if(pg>pages)pg=pages;
 $('tb').innerHTML=r.length?r.slice((pg-1)*N,pg*N).map(function(d){var k=K[d[6]];
  return '<tr><td class="c"><span class="kd">'+d[0]+'</span></td><td class="mp"><b>'+d[1]+'</b><small>'+d[2]+(d[3]?' • '+d[3]:'')+'</small></td><td class="c"><span class="kg"><i></i>'+d[4]+'</span></td><td class="c jp"><b>'+d[5]+' JP</b><small>/ Pekan</small></td><td><div class="kr"><span class="pa">'+ini(k)+'</span><div><b>'+k+'</b><small>'+(d[7]?'+'+d[7]+' Guru Pengampu':'Koordinator Tunggal')+'</small></div></div></td><td class="c">'+(d[8]==='v'?'<span class="st">✔ Modul Ajar Valid 100%</span>':'<span class="st r">📋 Perlu Review Silabus</span>')+'</td><td class="c"><button class="ed" data-t="Ubah '+d[0]+'" aria-label="Ubah '+d[1]+'">✎</button></td></tr>'}).join(''):'<tr><td colspan="7" class="empty">Mata pelajaran tidak ditemukan</td></tr>';
 $('info').textContent='Menampilkan '+Math.min(N,Math.max(0,r.length-(pg-1)*N))+' dari '+r.length+' total mata pelajaran terdaftar';
 var h='<button '+(pg===1?'disabled':'')+' data-p="'+(pg-1)+'">Sebelumnya</button>';
 for(var i=1;i<=pages;i++)h+='<button class="'+(i===pg?'on':'')+'" data-p="'+i+'">'+i+'</button>';
 $('pn').innerHTML=h+'<button '+(pg===pages?'disabled':'')+' data-p="'+(pg+1)+'">Selanjutnya</button>'}
$('tabs').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;tab=b.dataset.f;pg=1;this.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===b)});render()});
$('pn').addEventListener('click',function(e){var b=e.target.closest('button');if(!b||b.disabled)return;pg=+b.dataset.p;render()});
$('q').addEventListener('input',function(){pg=1;render()});$('ss').addEventListener('change',function(){pg=1;render()});
document.addEventListener('click',function(e){var t=e.target.closest('[data-t]');if(t){e.preventDefault();toast(t.dataset.t+' (pratinjau)')}});
render();
