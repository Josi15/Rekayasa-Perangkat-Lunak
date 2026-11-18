function $(i){return document.getElementById(i)}var tt,orig=$('right').innerHTML,cur=0;
function toast(m,er){var e=$('toast');e.textContent=m;e.className='toast show'+(er?' er':'');clearTimeout(tt);tt=setTimeout(function(){e.classList.remove('show')},2000)}
document.addEventListener('click',function(e){var t=e.target.closest('[data-t]');if(t){e.preventDefault();toast(t.dataset.t+' (pratinjau)')}});
document.addEventListener('input',function(e){if(e.target.id==='nama'){var v=e.target.value.trim();$('lname').textContent=(v||'—').replace(/\s*Jakarta$/i,'').toUpperCase()}
 if(e.target.id==='npsn'){e.target.value=e.target.value.replace(/\D/g,'');$('lnpsn').textContent=e.target.value||'—'}
 var w=e.target.closest('.in');if(w)w.classList.remove('er')});
document.addEventListener('click',function(e){
 if(e.target.id==='cek'){var v=$('npsn').value;if(v.length!==8)toast('NPSN harus 8 digit',1);else toast('NPSN '+v+' ditemukan di Kemendikbud (simulasi)')}
 if(e.target.closest('#save')){var bad=0;document.querySelectorAll('[data-r]').forEach(function(w){var i=w.querySelector('input,textarea');var x=!i.value.trim();w.classList.toggle('er',x);if(x)bad++});
  if(bad)toast(bad+' kolom wajib belum diisi',1);else if($('npsn').value.length!==8){toast('NPSN harus 8 digit',1);$('npsn').parentNode.classList.add('er')}else toast('Perubahan konfigurasi disimpan (pratinjau)')}});
$('tabs').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;cur=+b.dataset.k;this.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===b)});
 var c=$('cols'),r=$('right');
 if(cur===0){c.style.gridTemplateColumns='';c.firstElementChild.style.display='';r.innerHTML=orig}
 else{c.firstElementChild.style.display='none';c.style.gridTemplateColumns='1fr';r.innerHTML='<div class="ph2"><b>'+b.textContent.replace(/^\S+\s/,'')+'</b>Desain tab ini belum dikirim, jadi belum dibuat di pratinjau.</div>'}});
