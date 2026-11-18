var RB=['XII MIPA 1 (36 Siswa)','XII MIPA 2 (35 Siswa)','XII IPS 1 (34 Siswa)','XII IPS 2 (33 Siswa)'],
DY=['Senin','Selasa','Rabu','Kamis','Jumat'],
SL=[['JAM 1 - 2','07:15 - 08:45'],['JAM 3 - 4','08:45 - 10:15'],['JAM 5 - 6','10:30 - 11:45'],['JAM 7 - 8','12:45 - 14:15']],
// nama, tipe, guru, ruang (null = ruang kelas), praktikum?
P=[['Matematika Tingkat Lanjut','2 JP Teori','Dra. Sri Wahyuni, M.Pd.','(NIP: 19780211...)',0,null],
['Biologi: Genetika Molekuler','Praktikum Lab','Ahmad Fauzi, S.Si., M.Sc.',0,1,'Lab Biologi 2 (Gedung Sains)'],
['Bahasa Indonesia: Teks Editorial','2 JP Teori','Siti Nurhaliza, S.Pd.',0,0,null],
['Fisika: Gelombang Elektromagnetik','2 JP Teori & Diskusi','Bambang Hermanto, M.Si.',0,0,null],
['Kimia: Termokimia','Praktikum Lab','Rina Marlina, S.Pd.',0,1,'Lab Kimia 1 (Gedung Sains)'],
['Bahasa Inggris: Analytical Exposition','2 JP Teori','Dewi Kartika, S.Pd.',0,0,null],
['Sejarah: Perang Dingin','2 JP Teori','Agus Prasetyo, S.Pd.',0,0,null],
['Informatika: Basis Data','Praktikum Lab','Yusuf Hakim, M.Pd.',0,1,'Lab Komputer 3'],
['Pendidikan Pancasila','2 JP Teori','Irwan Setiawan, S.Pd.',0,0,null],
['Sosiologi: Konflik Sosial','2 JP Teori & Diskusi','Dra. Nining Suryati',0,0,null],
['Ekonomi: Pasar Modal','2 JP Teori','Hendra Kusuma, M.Si.',0,0,null],
['PJOK: Bola Voli','Praktik Lapangan','Teguh Santoso, S.Pd.',0,1,'Lapangan Olahraga']],
ST=['Selesai','SEDANG','Berikutnya','Terjadwal'],ri=0,di=0,tt;
function $(i){return document.getElementById(i)}
function toast(m){var e=$('toast');e.textContent=m;e.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){e.classList.remove('show')},1800)}
function pick(r,d){if(r===0&&d===0)return[0,1,2,3];var b=r*3+d*7,o=[];for(var s=0;s<4;s++)o.push((b+s*5)%12);return o}
function ses(p,s,k,sim){var rm=p[5]||('Ruang Kelas '+RB[ri].split(' (')[0]+(typeof p[3]==='string'?' (Gd. B Lt. 2)':'')),live=sim&&k===1,pr=p[4];
 var tg=pr?'<span class="tg p">'+(p[1].indexOf('Lapangan')>-1?'🏃 ':'⚗ ')+p[1]+'</span>':'<span class="tg">'+p[1]+'</span>';
 var st=!sim?'Terjadwal':k===0?'Selesai':k===1?'':k===2?'Berikutnya':'Terjadwal';
 return '<div class="ses'+(live?' live':'')+'"><div class="tm"><b>'+SL[k][0]+'</b><span>'+SL[k][1]+'</span></div><div class="ct"><h3>'+p[0]+(pr?'':tg)+'</h3><div class="m"><span>👤 '+p[2]+' '+(typeof p[3]==='string'?p[3]:'')+'</span><span class="rm">📍 '+rm+'</span></div></div>'+(pr?tg:'')+(live?'<span class="sd">SEDANG<br>BERLANGSUNG</span><button class="ab" data-t="Buka Absensi">▤ Buka<br>Absensi</button>':'<span class="stt">'+st+'</span><button class="kb" data-t="Menu sesi" aria-label="Menu sesi">⋮</button>')+'</div>'}
function brk(a,b,c){return '<div class="brk"><span>'+a+'</span><span>'+b+'</span></div>'}
function render(){var ix=pick(ri,di),sim=ri===0&&di===0,h='';
 for(var k=0;k<4;k++){h+=ses(P[ix[k]],0,k,sim);
  if(k===1)h+=brk('☕ Istirahat Pagi & Literasi Al-Qur\'an / Pojok Baca','10:15 - 10:30 (15 Menit)');
  if(k===2)h+=brk('🏠 Istirahat Siang, Sholat Berjamaah & Makan (ISHOMA)','11:45 - 12:45 (60 Menit)')}
 $('body').innerHTML=h;$('dt').textContent='Jadwal Harian KBM: Kelas '+RB[ri].split(' (')[0];
 $('ds').textContent=DY[di]+', Pekan Efektif KBM Ke-8 • 8 Jam Pelajaran';
 $('days').innerHTML=DY.map(function(d,i){return '<button class="'+(i===di?'on':'')+'" data-d="'+i+'">'+d+'</button>'}).join('')}
$('rb').innerHTML=RB.map(function(r,i){return '<option value="'+i+'">'+r+'</option>'}).join('');
$('rb').addEventListener('change',function(){ri=+this.value;render()});
$('days').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;di=+b.dataset.d;render()});
document.addEventListener('click',function(e){var t=e.target.closest('[data-t]');if(t){e.preventDefault();toast(t.dataset.t+' (pratinjau)')}});
render();
