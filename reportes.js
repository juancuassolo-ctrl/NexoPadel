// Reportes de gestión (Pádel / Bar / Total): cálculo y HTML. Lo usa el panel; base de caja (lo cobrado y pagado).
(()=>{
const TZ="America/Argentina/Cordoba";
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const money=n=>"$"+Number(n||0).toLocaleString("es-AR",{maximumFractionDigits:0}),sg=n=>(n>0?"+":n<0?"−":"")+money(Math.abs(n));
const pct=(a,b)=>b?(Math.round(a/b*1000)/10).toLocaleString("es-AR")+"%":"—";
const UN={padel:"Pádel",bar:"Bar",total:"Pádel + Bar"};
const CAT={sena:"Seña de turno",turno:"Cobro de turno",inscripcion:"Inscripción a torneo",producto:"Venta de productos",servicio:"Venta de servicios",evento:"Eventos y alquiler de espacio",sponsor:"Sponsors y publicidad",
 compra_stock:"Compra de mercadería",mercaderia:"Mercadería",insumos:"Insumos",sueldo:"Sueldos",alquiler:"Alquiler",servicios_pub:"Servicios (luz, gas, agua, internet)",impuestos:"Impuestos y tasas",mantenimiento:"Mantenimiento",marketing:"Marketing",gasto:"Gasto general",retiro:"Retiro de socios",otro:"Otros"};
const D=s=>new Date(s+"T12:00:00Z"),S=d=>d.toISOString().slice(0,10),add=(s,n)=>{const d=D(s);d.setUTCDate(d.getUTCDate()+n);return S(d)},dd=s=>s.slice(8)+"/"+s.slice(5,7)+"/"+s.slice(0,4);
const hora=i=>Number(new Intl.DateTimeFormat("en-GB",{hour:"2-digit",hour12:false,timeZone:TZ}).format(new Date(i)))%24,hh=h=>String(h).padStart(2,"0")+":00";
function periodo(per,an,d1,d2){let a,b,label,pa,pb;
 if(per==="dia"){a=b=an;label=D(an).toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"UTC"})}
 else if(per==="semana"){a=add(an,-((D(an).getUTCDay()+6)%7));b=add(a,6);label="Semana del "+dd(a)+" al "+dd(b)}
 else if(per==="mes"){a=an.slice(0,8)+"01";b=S(new Date(Date.UTC(+an.slice(0,4),+an.slice(5,7),0)));label=D(a).toLocaleDateString("es-AR",{month:"long",year:"numeric",timeZone:"UTC"})}
 else{a=d1<=d2?d1:d2;b=d1<=d2?d2:d1;label="Del "+dd(a)+" al "+dd(b)}
 const n=Math.round((D(b)-D(a))/864e5)+1;pb=add(a,-1);pa=per==="mes"?pb.slice(0,8)+"01":add(a,-n);return{a,b,n,label,pa,pb}}
function nav(per,an,k){if(per==="mes"){const d=D(an);d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+k);return S(d)}return add(an,k*(per==="semana"?7:1))}
// Totales de un conjunto de movimientos. Los retiros de socios no son gasto operativo: se informan aparte.
function resumen(M){const r={ing:0,egr:0,ret:0,efe:0,tra:0,n:M.length,cat:{ing:{},egr:{}},dia:{},med:{efectivo:{i:0,e:0},transferencia:{i:0,e:0}},uni:{}};
 M.forEach(m=>{const i=m.tipo==="ingreso",v=Number(m.monto),ret=m.categoria==="retiro";
  if(ret)r.ret+=v;else if(i){r.ing+=v;r.cat.ing[m.categoria]=(r.cat.ing[m.categoria]||0)+v}else{r.egr+=v;r.cat.egr[m.categoria]=(r.cat.egr[m.categoria]||0)+v}
  r[m.metodo_pago==="efectivo"?"efe":"tra"]+=i?v:-v;r.med[m.metodo_pago][i?"i":"e"]+=v;
  const d=r.dia[m.fecha]||(r.dia[m.fecha]={i:0,e:0});if(i)d.i+=v;else if(!ret)d.e+=v;
  const u=r.uni[m.unidad]||(r.uni[m.unidad]={ing:0,egr:0,ret:0});if(ret)u.ret+=v;else if(i)u.ing+=v;else u.egr+=v});
 r.res=r.ing-r.egr;r.neto=r.res-r.ret;return r}
function ventas(V,uu){const L=V.filter(v=>v.productos.unidad===uu);if(!L.length)return null;const prod={},rub={},tk=new Set(),hr={};let tot=0,uni=0,cos=0;
 L.forEach(v=>{const p=v.productos,c=v.cantidad*(Number(p.costo)||0),x=prod[p.nombre]||(prod[p.nombre]={n:p.nombre,rubro:p.rubro||"Sin rubro",u:0,m:0,c:0});
  x.u+=v.cantidad;x.m+=Number(v.monto);x.c+=c;const y=rub[x.rubro]||(rub[x.rubro]={m:0,c:0,u:0});y.m+=Number(v.monto);y.c+=c;y.u+=v.cantidad;
  tot+=Number(v.monto);uni+=v.cantidad;cos+=c;tk.add(v.ticket||v.id);const h=hora(v.created_at);hr[h]=(hr[h]||0)+Number(v.monto)});
 return{prod:Object.values(prod).sort((a,b)=>b.m-a.m),rub:Object.entries(rub).sort((a,b)=>b[1].m-a[1].m),tot,uni,cos,tk:tk.size,hr:Object.entries(hr).sort((a,b)=>b[1]-a[1]).slice(0,3)}}
function serie(r,pr){const o={},by=pr.n>62?s=>s.slice(0,7):s=>s;Object.entries(r.dia).forEach(([d,v])=>{const x=o[by(d)]||(o[by(d)]={i:0,e:0});x.i+=v.i;x.e+=v.e});
 if(pr.n<=62)for(let i=0;i<pr.n;i++){const d=add(pr.a,i);o[d]=o[d]||{i:0,e:0}}return Object.entries(o).sort((a,b)=>a[0]<b[0]?-1:1)}
const tab=(heads,rows,nf=1,tot)=>`<div class="w"><table><tr>${heads.map((h,i)=>`<th class="${i>=nf?"n":""}">${h}</th>`).join("")}</tr>${rows.map((r,j)=>`<tr class="${tot&&j===rows.length-1?"tot":""}">${r.map((c,i)=>`<td class="${i>=nf?"n":""}">${c}</td>`).join("")}</tr>`).join("")}</table></div>`;
const kp=a=>`<div class="kpi">${a.map(([l,v,s])=>`<div><span>${l}</span><b>${v}</b><small>${s||"&nbsp;"}</small></div>`).join("")}</div>`;
const vr=(a,b)=>b?`${a>=b?"▲":"▼"} ${Math.abs(Math.round((a-b)/b*100))}% vs período anterior`:"sin datos del período anterior";
const catRows=(o,t)=>{const e=Object.entries(o).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[CAT[k]||esc(k),money(v),pct(v,t)]);if(e.length)e.push(["Total",money(t),"100%"]);return e};
function html(c){const{u,pr,M,Mp,V,R,CI,K,CF,P}=c,r=resumen(M),rp=resumen(Mp),o=[];
 o.push(`<div class="repH"><img src="${esc(c.logo)}" alt=""><div><h2 style="margin:0">${esc(c.nombre)} · Reporte de ${UN[u]}</h2><div class="cap">${esc(pr.label)}</div><div class="m">Generado el ${new Date().toLocaleString("es-AR",{dateStyle:"short",timeStyle:"short",timeZone:TZ})} · Criterio de caja: refleja lo efectivamente cobrado y pagado</div></div></div>`);
 o.push(kp([["Ingresos",money(r.ing),vr(r.ing,rp.ing)],["Egresos operativos",money(r.egr),vr(r.egr,rp.egr)],["Resultado operativo",sg(r.res),r.ing?"margen "+pct(r.res,r.ing):""],["Retiros de socios",money(r.ret),"no se descuentan del resultado"]]));
 o.push(kp([["Efectivo neto",sg(r.efe),"ingresos menos egresos"],["Transferencias netas",sg(r.tra),"ingresos menos egresos"],["Resultado tras retiros",sg(r.neto),""],["Movimientos",r.n,"registrados en el período"]]));
 if(u==="total"){const rows=["padel","bar"].map(k=>{const x=r.uni[k]||{ing:0,egr:0,ret:0};return[UN[k],money(x.ing),money(x.egr),sg(x.ing-x.egr),pct(x.ing-x.egr,x.ing),money(x.ret)]});
  rows.push(["Total",money(r.ing),money(r.egr),sg(r.res),pct(r.res,r.ing),money(r.ret)]);o.push(`<h2>Resultado por unidad de negocio</h2>`+tab(["Unidad","Ingresos","Egresos","Resultado","Margen","Retiros"],rows,1,true))}
 o.push(`<div class="cols"><div><h2>Ingresos por concepto</h2>${r.ing?tab(["Concepto","Monto","%"],catRows(r.cat.ing,r.ing),1,true):'<p class="m">Sin ingresos.</p>'}</div><div><h2>Egresos por concepto</h2>${r.egr||r.ret?tab(["Concepto","Monto","%"],catRows({...r.cat.egr,...(r.ret?{retiro:r.ret}:{})},r.egr+r.ret),1,true):'<p class="m">Sin egresos.</p>'}</div></div>`);
 o.push(`<h2>Medios de pago</h2>`+tab(["Medio","Ingresos","Egresos","Neto"],["efectivo","transferencia"].map(k=>[k[0].toUpperCase()+k.slice(1),money(r.med[k].i),money(r.med[k].e),sg(r.med[k].i-r.med[k].e)]),1));
 const se=serie(r,pr),mx=Math.max(1,...se.map(([,v])=>Math.max(v.i,v.e)));
 o.push(`<h2>Evolución ${pr.n>62?"mensual":"diaria"}</h2><div class="bars">${se.map(([k,v])=>`<div class="bcol" title="${esc(k)}: ingresos ${money(v.i)}, egresos ${money(v.e)}"><div class="pair"><i class="bi" style="height:${v.i/mx*100}%"></i><i class="be" style="height:${v.e/mx*100}%"></i></div><span>${pr.n>62?k.slice(5):k.slice(8)}</span></div>`).join("")}</div><p class="m"><span class="lg bi"></span> Ingresos <span class="lg be"></span> Egresos</p>`);
 const dias=se.filter(([,v])=>v.i||v.e);if(dias.length)o.push(tab([pr.n>62?"Mes":"Día","Ingresos","Egresos","Resultado"],dias.map(([k,v])=>[pr.n>62?k.slice(5)+"/"+k.slice(0,4):dd(k),money(v.i),money(v.e),sg(v.i-v.e)]),1));
 ["bar","padel"].filter(k=>u==="total"||u===k).forEach(k=>{const x=ventas(V,k),stk=P.filter(p=>p.unidad===k&&p.tipo==="producto"),bajo=stk.filter(p=>p.stock<=p.stock_minimo);if(!x&&!stk.length)return;
  o.push(`<h2>${k==="bar"?"Bar · ventas por producto y servicio":"Pádel · ventas de la tienda"}</h2>`);
  if(x){o.push(kp([["Ventas",money(x.tot),x.uni+" unidades"],["Tickets",x.tk,"ticket promedio "+money(x.tot/x.tk)],["Margen bruto estimado",money(x.tot-x.cos),"margen "+pct(x.tot-x.cos,x.tot)],["Mayor venta por hora",x.hr.map(([h])=>hh(h)).join(" · ")||"—","franjas con más ventas"]]));
   o.push(tab(["Producto o servicio","Rubro","Unid.","Ingresos","Costo est.","Margen","Margen %"],x.prod.map(p=>[esc(p.n),esc(p.rubro),p.u,money(p.m),money(p.c),sg(p.m-p.c),pct(p.m-p.c,p.m)]),2));
   o.push(`<h2 style="font-size:15px">Por rubro</h2>`+tab(["Rubro","Unid.","Ingresos","Margen %"],x.rub.map(([n,v])=>[esc(n),v.u,money(v.m),pct(v.m-v.c,v.m)]),1))}
  o.push(`<p class="m">Stock valorizado al costo (hoy): <b>${money(sum(stk,p=>p.stock*p.costo))}</b>${bajo.length?" · Stock bajo: "+bajo.map(p=>esc(p.nombre)).join(", "):""}. El costo estimado usa el costo actual cargado en cada producto.</p>`)});
 if(u!=="bar"&&R){const sl=Math.floor((CF.cierre-CF.apertura)*60/CF.duracion),ok=R.filter(x=>x.estado!=="cancelado"),cap=sl*K.filter(k=>k.activa).length*pr.n,cob=ok.filter(x=>x.estado==="cobrado"),hr={};ok.forEach(x=>{const h=hora(x.inicio);hr[h]=(hr[h]||0)+1});
  o.push(`<h2>Pádel · canchas y turnos</h2>`+kp([["Turnos reservados",ok.length,"de "+cap+" posibles"],["Ocupación",pct(ok.length,cap),"turnos / capacidad del período"],["Turnos cobrados",cob.length,"ingreso medio "+money(cob.length?sum(cob,x=>x.precio)/cob.length:0)],["Cancelados",R.length-ok.length,"clientes nuevos: "+(c.nuevos||0)]]));
  o.push(tab(["Cancha","Turnos","Ocupación","Facturado (cobrados)"],K.map(k=>{const t=ok.filter(x=>x.cancha_id===k.id);return[esc(k.nombre)+(k.activa?"":" (inactiva)"),t.length,pct(t.length,sl*pr.n),money(sum(t.filter(x=>x.estado==="cobrado"),x=>x.precio))]}),1));
  o.push(`<p class="m">Reservas por la web: ${ok.filter(x=>x.origen==="web").length} · cargadas en el mostrador: ${ok.filter(x=>x.origen!=="web").length}${Object.keys(hr).length?" · Horarios con más turnos: "+Object.entries(hr).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([h,n])=>hh(h)+" ("+n+")").join(", "):""}</p>`)}
 const cd=new Set(CI.map(x=>x.fecha+"|"+x.unidad)),sin=[...new Set(M.map(x=>x.fecha+"|"+x.unidad))].filter(x=>!cd.has(x)).sort();
 o.push(`<h2>Control de caja</h2>`+(CI.length?tab(["Día","Unidad","Efectivo esperado","Efectivo contado","Dif.","Transf. esperada","Transf. verificada","Dif."],CI.map(x=>[dd(x.fecha),UN[x.unidad],money(x.efectivo_esperado),money(x.efectivo_contado),sg(x.dif_efectivo),money(x.transferencia_esperada),money(x.transferencia_contada),sg(x.dif_transferencia)]),2):'<p class="m">No hay cierres de caja en el período.</p>')+
  `<p class="m">Diferencia acumulada: efectivo <b>${sg(sum(CI,x=>Number(x.dif_efectivo)))}</b>, transferencias <b>${sg(sum(CI,x=>Number(x.dif_transferencia)))}</b>. Días con movimientos y sin cierre: <b>${sin.length}</b>${sin.length?" ("+sin.slice(0,8).map(x=>dd(x.split("|")[0]).slice(0,5)+" "+UN[x.split("|")[1]]).join(", ")+(sin.length>8?"…":"")+")":""}.</p>`);
 if(c.detalle)o.push(`<h2>Detalle de movimientos</h2>`+(M.length?tab(["Fecha","Unidad","Concepto","Medio","Ingreso","Egreso"],M.map(m=>{const i=m.tipo==="ingreso";return[dd(m.fecha),UN[m.unidad],(CAT[m.categoria]||esc(m.categoria))+(m.descripcion&&m.descripcion!==CAT[m.categoria]?" · "+esc(m.descripcion):""),m.metodo_pago,i?money(m.monto):"",i?"":money(m.monto)]}),4):'<p class="m">Sin movimientos.</p>'));
 return o.join("")}
const sum=(l,f)=>l.reduce((s,x)=>s+f(x),0);
function texto(c){const r=resumen(c.M),top=Object.entries(r.cat.ing).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>"  · "+(CAT[k]||k)+": "+money(v));
 return`${c.nombre} · Reporte de ${UN[c.u]}\n${c.pr.label}\nIngresos: ${money(r.ing)}\nEgresos: ${money(r.egr)}\nResultado: ${sg(r.res)}${r.ing?" ("+pct(r.res,r.ing)+")":""}\nRetiros de socios: ${money(r.ret)}\nEfectivo neto: ${sg(r.efe)} · Transferencias: ${sg(r.tra)}`+(top.length?"\nPrincipales ingresos:\n"+top.join("\n"):"")}
function csv(M){const q=s=>'"'+String(s??"").replace(/"/g,'""')+'"';return["Fecha;Unidad;Tipo;Categoría;Descripción;Medio de pago;Monto"].concat(M.map(m=>[m.fecha,UN[m.unidad],m.tipo,CAT[m.categoria]||m.categoria,q(m.descripcion),m.metodo_pago,m.monto].join(";"))).join("\r\n")}
if(typeof document!=="undefined"){const st=document.createElement("style");st.textContent=`.rep h2{font-size:18px;line-height:24px;font-weight:600;margin:28px 0 8px}.rep .repH{display:flex;gap:16px;align-items:center;margin-bottom:20px}.rep .repH img{width:56px;height:56px;border-radius:50%}
.rep .cols{display:grid;grid-template-columns:1fr 1fr;gap:24px}.cap::first-letter{text-transform:uppercase}.rep tr.tot td{font-weight:600}.rep .kpi{margin-bottom:12px}
.bars{display:flex;align-items:flex-end;gap:3px;height:140px;overflow-x:auto}.bcol{flex:1 0 14px;display:flex;flex-direction:column;justify-content:flex-end;height:100%;align-items:center;gap:3px}
.bcol .pair{display:flex;align-items:flex-end;gap:1px;height:110px;width:100%}.pair i{flex:1;display:block;min-height:1px}.bi{background:var(--accent)}.be{background:#9aa3ad}.bcol span{font-size:10px;color:var(--muted)}
.lg{display:inline-block;width:10px;height:10px;margin:0 4px 0 12px;vertical-align:-1px}
@media(max-width:760px){.rep .cols{grid-template-columns:1fr}}
@media print{@page{size:A4;margin:12mm}body{display:block;background:#fff}aside,.head,.noprint{display:none!important}main{padding:0;max-width:none}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}.rep h2{break-after:avoid}.rep .cols{grid-template-columns:1fr 1fr!important}.rep .cols>div{break-inside:avoid}.rep .w{overflow:visible}.rep tr{break-inside:avoid}.rep .kpi{break-inside:avoid}}`;document.head.appendChild(st)}
window.RP={CAT,UN,periodo,nav,resumen,ventas,html,texto,csv};
})();
