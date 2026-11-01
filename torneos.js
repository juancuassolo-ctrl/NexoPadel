// Vista de torneos compartida por la gestión y el turnero: tablas de grupos y cuadro de eliminatorias.
(()=>{
const TZ="America/Argentina/Cordoba",EST={pendiente:"Pendiente",programado:"Programado",jugando:"Jugando",finalizado:"Finalizado",suspendido:"Suspendido"};
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const L=i=>String.fromCharCode(64+i),nom=p=>p?`${p.jugador1} / ${p.jugador2}`:null;
const fmt=f=>new Date(f).toLocaleString("es-AR",{weekday:"short",day:"numeric",month:"numeric",hour:"2-digit",minute:"2-digit",timeZone:TZ});
const pill=e=>`<span class="tp ${e}">${EST[e]}</span>`,res=m=>(m.sets||[]).map(s=>s[0]+"-"+s[1]).join("  ")||"—";
// Tabla de un grupo: victoria = 2 puntos; desempata diferencia de sets y de games
function tabla(P,M){const t={};P.forEach(p=>t[p.id]={p,pj:0,pg:0,pp:0,sg:0,sp:0,gg:0,gp:0,pts:0});
 M.filter(m=>m.estado==="finalizado"&&m.ganador&&t[m.pareja_a]&&t[m.pareja_b]).forEach(m=>{const A=t[m.pareja_a],B=t[m.pareja_b];let sa=0,sb=0;
  (m.sets||[]).forEach(([x,y])=>{A.gg+=x;A.gp+=y;B.gg+=y;B.gp+=x;if(x>y)sa++;else if(y>x)sb++});
  A.sg+=sa;A.sp+=sb;B.sg+=sb;B.sp+=sa;A.pj++;B.pj++;const w=m.ganador===A.p.id?A:B,l=w===A?B:A;w.pg++;l.pp++;w.pts+=2});
 return Object.values(t).sort((a,b)=>b.pts-a.pts||(b.sg-b.sp)-(a.sg-a.sp)||(b.gg-b.gp)-(a.gg-a.gp)||a.p.jugador1.localeCompare(b.p.jugador1))}
function grupos(T,P,M,act){if(!T.grupos)return"";
 return Array.from({length:T.grupos},(_,i)=>i+1).map(g=>{const ps=P.filter(p=>p.grupo===g),ms=M.filter(m=>m.fase==="grupo"&&m.grupo===g).sort((a,b)=>a.ronda-b.ronda||a.pos-b.pos),
  n=id=>esc(nom(P.find(p=>p.id===id))||"Por definir");
  return`<section class="tg"><h3>Grupo ${L(g)}</h3><div class="tw"><table class="tt"><tr><th></th><th>Pareja</th><th class="n">PJ</th><th class="n">PG</th><th class="n">PP</th><th class="n">Sets</th><th class="n g">Games</th><th class="n">Pts</th></tr>
  ${tabla(ps,ms).map((r,i)=>`<tr class="${i<T.clasifican?"q":""}"><td>${i+1}</td><td>${esc(nom(r.p))}</td><td class="n">${r.pj}</td><td class="n">${r.pg}</td><td class="n">${r.pp}</td><td class="n">${r.sg}-${r.sp}</td><td class="n g">${r.gg}-${r.gp}</td><td class="n"><b>${r.pts}</b></td></tr>`).join("")||`<tr><td colspan="8" class="m">Sin parejas en este grupo</td></tr>`}</table></div>
  <div>${ms.map(m=>`<div class="mr" ${act?`data-act="part" data-id="${m.id}"`:""}><span class="mj">F${m.ronda}</span><span class="mn">${n(m.pareja_a)} <i>vs</i> ${n(m.pareja_b)}${m.fecha||m.cancha?`<small>${m.fecha?fmt(m.fecha):""}${m.cancha?" · "+esc(m.cancha):""}</small>`:""}</span><b>${res(m)}</b>${pill(m.estado)}</div>`).join("")}</div></section>`}).join("")}
function llave(M,P,act){const Lm=M.filter(m=>m.fase==="llave");if(!Lm.length)return"";const R=Math.max(...Lm.map(m=>m.ronda)),by=r=>Lm.filter(m=>m.ronda===r).sort((a,b)=>a.pos-b.pos);
 const RN=r=>({0:"Final",1:"Semifinal",2:"Cuartos de final",3:"Octavos de final",4:"16avos de final"})[R-r]||"Ronda "+r;
 const box=m=>{const side=l=>{const id=m["pareja_"+l],p=P.find(x=>x.id===id),w=m.ganador&&m.ganador===id,lab=m["origen_"+l];
   return`<div class="bs ${w?"w":""}"><span class="bn">${p?esc(nom(p)):`<i>${esc(lab&&lab!=="Sorteo"?lab:"Por definir")}</i>`}</span><span class="bk">${(m.sets||[]).map(s=>`<span>${s[l==="a"?0:1]}</span>`).join("")}</span></div>`};
  return`<div class="bw"><div class="bx" ${act?`data-act="part" data-id="${m.id}"`:""}>${side("a")}${side("b")}<div class="bf">${EST[m.estado]}${m.fecha?" · "+fmt(m.fecha):""}${m.cancha?" · "+esc(m.cancha):""}</div></div></div>`};
 return`<div class="br">${Array.from({length:R},(_,i)=>i+1).map(r=>`<div class="bc"><div class="bh">${RN(r)}</div><div class="bm">${by(r).map(box).join("")}</div></div>`).join("")}</div>`}
function campeon(M,P){const f=M.filter(m=>m.fase==="llave").sort((a,b)=>b.ronda-a.ronda)[0];const p=f&&f.ganador&&P.find(x=>x.id===f.ganador);return p?`<div class="champ">Campeones: <b>${esc(nom(p))}</b></div>`:""}
const st=document.createElement("style");st.textContent=`.tv{--tb:#e1e6dc;--tm:#586155;--tt:#0e141b;--ta:#7aa81e;--ts:#fff;--ts2:#f2f8e2;--tg:#f1f3ee;--tc:#c9d0c3;--tpg:#3d5a08;--tchamp:#0e141b;--tchampt:#fff;--tlime:#a6cb3f}
.tv h3{font-size:16px;font-weight:600;margin:24px 0 8px}.tv .m,.tv small{color:var(--tm);font-size:12px}.tv small{display:block}
.tw{overflow-x:auto}.tt{width:100%;border-collapse:collapse;font-size:14px}.tt th{font-weight:400;font-size:12px;color:var(--tm);text-align:left;padding:0 8px 6px}
.tt td{padding:6px 8px;border-top:1px solid var(--tg);border-left:3px solid transparent}.tt tr.q td:first-child{border-left-color:var(--ta)}.tt .n{text-align:right;font-variant-numeric:tabular-nums}
.mr{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;padding:8px 0;border-top:1px solid var(--tg);font-size:14px}.mr .mn{flex:1 1 200px}.mr .mn i{color:var(--tm);font-style:normal;margin:0 4px}.mr .mj{width:26px;color:var(--tm);font-size:12px}
.mr b{font-weight:600;font-variant-numeric:tabular-nums}.mr[data-act]{cursor:pointer}.mr[data-act]:hover{background:var(--tg)}
.tp{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:999px;font-size:12px;font-weight:500;background:var(--tg);color:#374151;white-space:nowrap}
.tp.pendiente{background:#fff;border:1px dashed var(--tc)}.tp.programado{background:var(--ts2);color:var(--tpg)}.tp.jugando{background:#fffbeb;color:#92400e}.tp.finalizado{background:#dcfce7;color:#14532d}.tp.suspendido{background:#ffedea;color:#831c1e}
.br{display:flex;overflow-x:auto;padding:4px 2px 12px}.bc{display:flex;flex-direction:column;flex:none;width:230px;margin-right:28px}.bc:last-child{margin-right:0}
.bh{font-size:12px;color:var(--tm);margin-bottom:8px;height:16px}.bm{display:flex;flex-direction:column;flex:1}
.bw{flex:1;display:flex;align-items:center;position:relative;padding:6px 0;min-height:92px}
.bx{position:relative;width:100%;border:1px solid var(--tb);border-radius:6px;background:var(--ts);font-size:13px}
.bs{display:flex;justify-content:space-between;gap:8px;padding:5px 8px;min-height:28px;align-items:center}.bs+.bs{border-top:1px solid var(--tg)}.bs.w{font-weight:600;background:var(--ts2)}
.bn{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bn i{color:var(--tm);font-style:normal;font-weight:400}.bk{display:flex;gap:8px;font-variant-numeric:tabular-nums}
.bf{font-size:11px;color:var(--tm);padding:3px 8px;border-top:1px solid var(--tg)}.bx[data-act]{cursor:pointer}.bx[data-act]:hover{border-color:var(--ta)}
.bc:not(:last-child) .bw::after{content:"";position:absolute;right:-14px;width:14px;top:50%;border-top:1px solid var(--tc)}
.bc:not(:last-child) .bw::before{content:"";position:absolute;right:-14px;border-right:1px solid var(--tc)}
.bc:not(:last-child) .bw:nth-child(odd)::before{top:50%;bottom:0}.bc:not(:last-child) .bw:nth-child(even)::before{top:0;bottom:50%}
.bc+.bc .bx::before{content:"";position:absolute;left:-14px;width:14px;top:50%;border-top:1px solid var(--tc)}
.tv .tg h3{margin-top:12px}.tt td:nth-child(2){min-width:130px}
@media(max-width:600px){.mr .mn{flex-basis:100%}.tt .g{display:none}}
.champ{margin:12px 0;padding:14px 16px;border-radius:8px;background:var(--tchamp);color:var(--tchampt)}.champ b{color:var(--tlime);font-weight:700}`;
document.head.appendChild(st);
window.TV={EST,nom,tabla,grupos,llave,campeon,pill,res,fmt,L};
})();
