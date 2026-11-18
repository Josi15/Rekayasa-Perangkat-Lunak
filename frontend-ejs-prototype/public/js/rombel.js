var FN='Raditya Nabila Ahmad Clarissa Daffa Salsa Fikri Aulia Bima Citra Dimas Eka Farhan Gita Hafiz Indah Joko Kirana Lutfi Maya'.split(' '),
LN='Arya Pratama Dwi Ananda Rian Hidayat Putri Fauzan Nugroho Wijaya Santoso Lestari Ramadhan Permata Saputra Kusuma Maharani Setiawan Anggraini Firmansyah'.split(' '),
WL='Ibu Siti Rahmawati, S.Pd.|Hendra Kusuma, M.Si.|Dra. Sri Wahyuni|Irwan Setiawan, S.Pd.|Dewi Lestari, M.Pd.|Agus Prasetyo, S.Si.|Rina Marlina, S.Pd.|Yusuf Hakim, M.Pd.|Ni Made Sari, S.Pd.|Andi Wijaya, S.T.|Lilis Suryani, M.Pd.|Teguh Santoso, S.Pd.'.split('|'),
RN=[['MIPA 1','Unggulan','R.302 Gedung Sains Lt. 2'],['MIPA 2','Reguler','R.303 Gedung Sains Lt. 2'],['IPS 1','Reguler','R.201 Gedung Sosial Lt. 1'],['IPS 2','Reguler','R.202 Gedung Sosial Lt. 1'],['MIPA 3','Reguler','R.304 Gedung Sains Lt. 3'],['MIPA 4','Reguler','R.305 Gedung Sains Lt. 3'],['IPS 3','Reguler','R.203 Gedung Sosial Lt. 2'],['IPS 4','Reguler','R.204 Gedung Sosial Lt. 2']],
FIX=[['0064829104','Raditya Arya Pratama','L',98.4,88.6,'Ketua Kelas'],['0065192841','Nabila Dwi Ananda','P',99.1,95.0,'Wakil Ketua'],['0063920194','Ahmad Rian Hidayat','L',97.0,87.0,'Sekretaris 1'],['0067784310','Clarissa Aurelia Putri','P',96.5,86.5,'Sekretaris 2'],['0067471928','Daffa Fauzan','L',95.0,83.0,'Bendahara 1']],
ROLES=['Ketua Kelas','Wakil Ketua','Sekretaris 1','Sekretaris 2','Bendahara 1'],
FILL={'XII MIPA 1':36,'XII MIPA 2':35,'XII IPS 1':34,'XII IPS 2':33},
R=[],seed=7;
function rnd(){seed=(seed*9301+49297)%233280;return seed/233280}
['XII','XI','X'].forEach(function(t){RN.forEach(function(r,i){var nm=t+' '+r[0],n=FILL[nm]||(33+Math.floor(rnd()*4));
 R.push({t:t,n:nm,tag:t==='XII'&&i===0?'Unggulan':'Reguler',rm:r[2],w:WL[(R.length)%WL.length],c:n,ro:null})})});
function roster(c){if(c.ro)return c.ro;var o=[];
 for(var i=0;i<c.c;i++){if(c.n==='XII MIPA 1'&&i<5){o.push(FIX[i]);continue}
  o.push(['00'+(60000000+Math.floor(rnd()*9999999)),FN[Math.floor(rnd()*20)]+' '+LN[Math.floor(rnd()*20)]+(rnd()>.6?' '+LN[Math.floor(rnd()*20)]:''),i%2?'P':'L',+(93+rnd()*6.9).toFixed(1),+(80+rnd()*15).toFixed(1),i<5?ROLES[i]:'Anggota'])}
 return c.ro=o}
var tab='',cur=R[0],pg=1,N=5,tt;
function $(i){return document.getElementById(i)}
function toast(m){var e=$('toast');e.textContent=m;e.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){e.classList.remove('show')},1800)}
function ini(s){return s.replace(/^(Ibu|Pak|Dra\.|Drs\.)\s/,'').split(' ').slice(0,2).map(function(x){return x[0]}).join('')}
function list(){var q=$('rq').value.trim().toLowerCase();
 var r=R.filter(function(c){return(!tab||c.t===tab)&&(!q||(c.n+c.rm+c.w).toLowerCase().indexOf(q)>-1)});
 $('lst').innerHTML=r.length?r.map(function(c){var s=36-c.c,full=!s;
  var ft=c===cur?'<div class="wl"><span class="pa">'+ini(c.w)+'</span><div><b>'+c.w+'</b><small>NIP 198204'+(12+R.indexOf(c))+' 200501 2 004</small></div><span class="ck">✔</span></div>':'<div class="wk"><span>Wali: '+c.w+'</span><span>›</span></div>';
  return '<button class="rb'+(c===cur?' on':'')+'" data-i="'+R.indexOf(c)+'"><div class="t"><div><h3>'+c.n+'</h3><span class="tg'+(c.tag==='Unggulan'?'':' r')+'">'+c.tag+'</span></div><span class="fill'+(full?' f':'')+'">'+c.c+' / 36 ('+(full?'PENUH':'Sisa '+s)+')</span></div><div class="rm">▤ '+c.rm+'</div>'+ft+'</button>'}).join(''):'<div class="empty">Rombel tidak ditemukan</div>'}
function detail(){var o=roster(cur),l=o.filter(function(x){return x[2]==='L'}).length,p=o.length-l;
 $('dn').textContent='Daftar Anggota Rombel: '+cur.n;$('dc').textContent=cur.c+' Siswa';$('dw').textContent=cur.w;
 $('dg').textContent=l+' L / '+p+' P ('+Math.round(l/o.length*100)+'%)';
 var q=$('sq').value.trim().toLowerCase(),g=$('sg').value,s=$('ss').value;
 var r=o.filter(function(x){return(!g||x[2]===g)&&(!s||(s==='k'?x[5]!=='Anggota':x[5]==='Anggota'))&&(!q||(x[0]+x[1]).toLowerCase().indexOf(q)>-1)});
 var pages=Math.max(1,Math.ceil(r.length/N));if(pg>pages)pg=pages;
 $('tb').innerHTML=r.length?r.slice((pg-1)*N,pg*N).map(function(x){var k=x[5]==='Ketua Kelas'?' k':x[5]==='Anggota'?'':' w';
  return '<tr><td class="mono">'+x[0]+'</td><td><b style="font-weight:600">'+x[1]+'</b></td><td><span class="gd'+(x[2]==='P'?' p':'')+'">'+x[2]+'</span></td><td class="pr">'+x[3].toFixed(1)+'%</td><td><span class="nl">'+x[4].toFixed(1)+'<small>(Tuntas)</small></span></td><td><span class="rl'+k+'">'+x[5]+'</span></td></tr>'}).join(''):'<tr><td colspan="6" class="empty">Siswa tidak ditemukan</td></tr>';
 $('info').textContent='Menampilkan '+Math.min(N,Math.max(0,r.length-(pg-1)*N))+' dari '+r.length+' siswa terdaftar';
 var h='<button '+(pg===1?'disabled':'')+' data-p="'+(pg-1)+'" aria-label="Sebelumnya">‹</button>';
 for(var i=1;i<=pages;i++)h+='<button class="'+(i===pg?'on':'')+'" data-p="'+i+'">'+i+'</button>';
 $('pn').innerHTML=h+'<button '+(pg===pages?'disabled':'')+' data-p="'+(pg+1)+'" aria-label="Berikutnya">›</button>'}
$('tabs').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;tab=b.dataset.f;this.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===b)});list()});
$('lst').addEventListener('click',function(e){var b=e.target.closest('.rb');if(!b)return;cur=R[+b.dataset.i];pg=1;$('sq').value='';$('sg').value='';$('ss').value='';list();detail()});
$('pn').addEventListener('click',function(e){var b=e.target.closest('button');if(!b||b.disabled)return;pg=+b.dataset.p;detail()});
$('rq').addEventListener('input',list);
['sq','sg','ss'].forEach(function(i){$(i).addEventListener('input',function(){pg=1;detail()})});
document.addEventListener('click',function(e){var t=e.target.closest('[data-t]');if(t){e.preventDefault();toast(t.dataset.t+' (pratinjau)')}});
list();detail();
