var U=[{i:'AR',n:'Ahmad Rizky Pratama',t:'Siswa',tg:'Siswa Baru',d:'NISN: 0071982121 • Kelas X-2 • Didaftarkan 15 menit lalu'},
{i:'ND',n:'Nurul Diana, S.Pd.',t:'Guru',tg:'Guru Pengampu',d:'NUPTK: 49301294812 • Bahasa Inggris • Menunggu Aktivasi 2FA'},
{i:'BA',n:'Budi Anugrah, A.Md.',t:'Tendik',tg:'Staf Laboratorium',d:'NIP: 198902032014021001 • Lab Komputer CBT • Permintaan Hak Akses'}];
var f='all',ul=document.getElementById('ul'),qi=document.getElementById('gs'),tt;
function toast(m){var e=document.getElementById('toast');e.textContent=m;e.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){e.classList.remove('show')},1800)}
function render(){var q=qi.value.trim().toLowerCase();
 var r=U.filter(function(u){return (f==='all'||u.t===f)&&(!q||(u.n+u.d).toLowerCase().indexOf(q)>-1)});
 ul.innerHTML=r.length?r.map(function(u){return '<div class="u"><span class="av2">'+u.i+'</span><div class="inf"><b>'+u.n+'</b><span class="tag'+(u.t==='Tendik'?' n':'')+'">'+u.tg+'</span><small>'+u.d+'</small></div><div class="a"><button class="btn s g" data-t="Detail '+u.n+'">Detail</button><button class="btn s" data-t="Disetujui: '+u.n+'">✓ Setujui</button></div></div>'}).join(''):'<p style="color:var(--mute);text-align:center;margin:12px">Pengguna tidak ditemukan</p>'}
document.getElementById('tabs').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;f=b.dataset.f;this.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===b)});render()});
qi.addEventListener('input',render);
document.addEventListener('click',function(e){var t=e.target.closest('[data-t]');if(t){e.preventDefault();toast(t.dataset.t+' (pratinjau)')}});
render();
