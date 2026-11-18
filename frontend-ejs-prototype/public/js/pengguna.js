var D=[
['USR-G-8201','SR','Ibu Siti Rahmawati, S.Pd.','Tenaga Pendidik Tetap','19820412 200501 2 004','NIP NASIONAL','siti.rahmawati@sman1.sch.id','Guru Pengampu','Wali Kelas XII MIPA 1 (Biologi)','XII'],
['USR-S-0678','RA','Raditya Arya Pratama','Peserta Didik Aktif','0064829104','NISN KEMENDIKBUD','raditya.pratama@siswa.sman1.sch.id','Siswa','XII MIPA 1 (No. Absen 28)','XII'],
['USR-A-8901','BS','Drs. Bambang Sutrisno, M.Pd.','Pimpinan Satdik','19740520 199903 1 002','NIP NASIONAL','bambang.sutrisno@sman1.sch.id','Admin IT / TU','Kepala TU & Kurikulum',''],
['USR-G-7405','HK','Hendra Kusuma, M.Si.','Tenaga Pendidik Tetap','19800815 200604 1 008','NIP NASIONAL','hendra.k@sman1.sch.id','Guru Pengampu','Wali Kelas XII MIPA 2 (Fisika)','XII'],
['USR-S-0689','CA','Clarissa Aurelia Putri','Peserta Didik Aktif','0067784310','NISN KEMENDIKBUD','clarissa.l@siswa.sman1.sch.id','Siswa','XII MIPA 1 (No. Absen 04)','XII'],
['USR-S-0702','DF','Dimas Fajar Nugroho','Peserta Didik Aktif','0071982121','NISN KEMENDIKBUD','dimas.nugroho@siswa.sman1.sch.id','Siswa','XI IPS 2 (No. Absen 11)','XI'],
['USR-G-7410','RP','Dra. Ratna Purwanti','Tenaga Pendidik Tetap','19740510 199903 2 001','NIP NASIONAL','ratna.p@sman1.sch.id','Guru Pengampu','Guru Matematika Kelas X','X'],
['USR-S-0715','AR','Ahmad Rizky Pratama','Peserta Didik Aktif','0079321188','NISN KEMENDIKBUD','ahmad.rizky@siswa.sman1.sch.id','Siswa','X-2 (No. Absen 02)','X'],
['USR-T-9120','BA','Budi Anugrah, A.Md.','Staf Laboratorium','19890203 201402 1 001','NIP NASIONAL','budi.anugrah@sman1.sch.id','Staf TU','Lab Komputer CBT',''],
['USR-G-7422','HW','Pak Hendra Wijaya, S.Sos.','Tenaga Pendidik Tetap','19780915 200312 1 002','NIP NASIONAL','hendra.w@sman1.sch.id','Guru Pengampu','Guru Sosiologi Kelas XI','XI']];
var f='all',pg=1,N=5,tb=document.getElementById('tb'),qi=document.getElementById('q'),sel=document.getElementById('sel'),tt;
function toast(m){var e=document.getElementById('toast');e.textContent=m;e.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){e.classList.remove('show')},1800)}
function cls(r){return r==='Admin IT / TU'?'a':r==='Siswa'?'s':''}
function rows(){var q=qi.value.trim().toLowerCase(),j=sel.value;
 return D.filter(function(u){var tabOk=f==='all'||(f==='Staf TU'?(u[7]==='Staf TU'||u[7]==='Admin IT / TU'):u[7]===f);
  return tabOk&&(!j||u[9]===j)&&(!q||(u[2]+u[4]+u[6]).toLowerCase().indexOf(q)>-1)})}
function render(){var r=rows(),pages=Math.max(1,Math.ceil(r.length/N));if(pg>pages)pg=pages;
 var s=r.slice((pg-1)*N,pg*N);
 tb.innerHTML=s.length?s.map(function(u){return '<tr><td><input type="checkbox" class="ck" aria-label="Pilih '+u[2]+'"></td><td class="mono">'+u[0]+'</td><td><div class="nm"><span class="pa'+(u[7]==='Siswa'?' s':'')+'">'+u[1]+'</span><div><b>'+u[2]+'</b><small>'+u[3]+'</small></div></div></td><td class="idn">'+u[4]+'<small>'+u[5]+'</small></td><td class="mono">'+u[6]+'</td><td><span class="rl '+cls(u[7])+'">'+u[7].replace('Guru Pengampu','Guru<br>Pengampu').replace('Admin IT / TU','Admin IT /<br>TU')+'</span></td><td class="ks">'+u[8]+'</td></tr>'}).join(''):'<tr><td colspan="7" class="empty">Pengguna tidak ditemukan</td></tr>';
 document.getElementById('all').checked=false;
 document.getElementById('info').textContent=r.length?'Menampilkan '+((pg-1)*N+1)+'-'+Math.min(pg*N,r.length)+' dari '+r.length+' pengguna (data contoh)':'Tidak ada data';
 var h='<button '+(pg===1?'disabled':'')+' data-p="'+(pg-1)+'" aria-label="Sebelumnya">‹</button>';
 for(var i=1;i<=pages;i++)h+='<button class="'+(i===pg?'on':'')+'" data-p="'+i+'">'+i+'</button>';
 h+='<button '+(pg===pages?'disabled':'')+' data-p="'+(pg+1)+'" aria-label="Berikutnya">›</button>';
 document.getElementById('pn').innerHTML=h}
document.getElementById('tabs').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;f=b.dataset.f;pg=1;this.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===b)});render()});
document.getElementById('pn').addEventListener('click',function(e){var b=e.target.closest('button');if(!b||b.disabled)return;pg=+b.dataset.p;render()});
document.getElementById('all').addEventListener('change',function(){var c=this.checked;document.querySelectorAll('.ck').forEach(function(x){x.checked=c})});
qi.addEventListener('input',function(){pg=1;render()});sel.addEventListener('change',function(){pg=1;render()});
document.addEventListener('click',function(e){var t=e.target.closest('[data-t]');if(t){e.preventDefault();toast(t.dataset.t+' (pratinjau)')}});
render();
