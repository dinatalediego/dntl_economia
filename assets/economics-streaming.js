const CATALOG_URL = "data/economics_streaming_catalog.json";
const STORAGE_KEY = "dntl_economia_streaming_progress_v1";
let catalog = null;
let state = loadState();
let activeFormat = "Todos";
let searchTerm = "";

function loadState(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {items:{}, lastOpened:null};}
  catch{return {items:{}, lastOpened:null};}
}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function itemState(id){
  return state.items[id] || {started:false,completed:false,applied:false,evidence:""};
}
function patchItem(id, patch){
  state.items[id] = {...itemState(id), ...patch};
  saveState();
  renderAll();
}
function allItems(){return catalog.channels.flatMap(channel => channel.items.map(item => ({...item, channelId:channel.id, channelTitle:channel.title, relevance:channel.relevance})))}
function formatLabel(kind){return ({video:"VIDEO",lesson:"LECTURA",simulation:"SIMULACIÓN",case:"CASO"})[kind] || kind.toUpperCase()}
function symbolFor(channel){return channel.symbol || "∴"}
function filtered(items){
  return items.filter(item => {
    const f = activeFormat === "Todos" || formatLabel(item.kind) === activeFormat;
    const blob = [item.title,item.author,item.summary,item.application,item.channelTitle,item.tags?.join(" ")].join(" ").toLowerCase();
    const q = !searchTerm || blob.includes(searchTerm.toLowerCase());
    return f && q;
  });
}
function statusFor(id){
  const s=itemState(id);
  if(s.applied)return ["applied","Aplicado"];
  if(s.completed)return ["completed","Completado"];
  if(s.started)return ["started","Iniciado"];
  return ["","Nuevo"];
}
function scoreItem(item){
  const s=itemState(item.id);
  const progressPenalty = s.applied ? 100 : s.completed ? 35 : s.started ? 8 : 0;
  const kindBonus = item.kind === "simulation" ? 2 : item.kind === "case" ? 1 : 0;
  return item.relevance*10 + kindBonus - progressPenalty;
}
function recommendedItem(){
  return [...allItems()].sort((a,b)=>scoreItem(b)-scoreItem(a))[0];
}
function card(item, channel){
  const [statusClass,statusText]=statusFor(item.id);
  return '<article class="media-card" data-open="'+item.id+'" tabindex="0" role="button" aria-label="Abrir '+escapeHtml(item.title)+'">'+
    '<div class="card-art"><strong>'+escapeHtml(symbolFor(channel))+'</strong></div>'+
    '<div class="card-body"><div class="card-topline"><span>'+formatLabel(item.kind)+'</span><span>'+escapeHtml(item.duration)+'</span></div>'+
    '<h4>'+escapeHtml(item.title)+'</h4><p>'+escapeHtml(item.summary)+'</p>'+
    '<div class="card-footer"><span><i class="status-dot '+statusClass+'"></i>'+statusText+'</span><span>'+escapeHtml(item.author)+'</span></div></div></article>';
}
function renderFormats(){
  const formats=["Todos","VIDEO","LECTURA","SIMULACIÓN","CASO"];
  document.querySelector("#format-chips").innerHTML=formats.map(f=>'<button class="format-chip '+(activeFormat===f?"active":"")+'" data-format="'+f+'">'+f+'</button>').join("");
}
function renderFeatured(){
  const item=recommendedItem();
  const channel=catalog.channels.find(c=>c.id===item.channelId);
  const s=itemState(item.id);
  document.querySelector("#featured-next").innerHTML='<article class="next-card" data-symbol="'+escapeHtml(symbolFor(channel))+'"><div>'+
    '<p class="next-why">Porque este concepto aparece mucho en tus decisiones y aún tiene recorrido.</p>'+
    '<h3>'+escapeHtml(item.title)+'</h3><p>'+escapeHtml(item.summary)+'</p>'+
    '<div class="hero-actions"><button class="play-button" data-open="'+item.id+'">▶ '+(s.started?"Retomar":"Empezar")+'</button><button class="save-button" data-open="'+item.id+'">Ver ficha</button></div></div>'+
    '<div class="next-stats"><span><b>Canal</b>'+escapeHtml(channel.title)+'</span><span><b>Autor</b>'+escapeHtml(item.author)+'</span><span><b>Formato</b>'+formatLabel(item.kind)+'</span><span><b>Aplicación</b>'+escapeHtml(item.applicationShort)+'</span></div></article>';
}
function renderContinue(){
  const items=allItems().filter(i=>itemState(i.id).started && !itemState(i.id).completed);
  const shell=document.querySelector("#continue-section");
  shell.hidden=items.length===0;
  if(!items.length)return;
  document.querySelector("#continue-rail").innerHTML=items.map(item=>{
    const channel=catalog.channels.find(c=>c.id===item.channelId);
    return card(item,channel);
  }).join("");
}
function renderChannels(){
  const html=catalog.channels.map(channel=>{
    const items=filtered(channel.items.map(i=>({...i,channelId:channel.id,channelTitle:channel.title,relevance:channel.relevance})));
    if(!items.length)return "";
    return '<section class="channel-block"><div class="channel-heading"><div><h3>'+escapeHtml(channel.title)+'</h3><p>'+escapeHtml(channel.description)+'</p></div><span class="channel-relevance">Relevancia personal '+channel.relevance+'/5</span></div>'+
      '<div class="rail">'+items.map(i=>card(i,channel)).join("")+'</div></section>';
  }).join("");
  document.querySelector("#channel-rails").innerHTML=html || '<p>No encontré piezas con esos filtros.</p>';
}
function renderProgress(){
  const states=Object.values(state.items);
  const started=states.filter(s=>s.started).length;
  const completed=states.filter(s=>s.completed).length;
  const applied=states.filter(s=>s.applied).length;
  document.querySelector("#progress-started").textContent=started;
  document.querySelector("#progress-completed").textContent=completed;
  document.querySelector("#progress-applied").textContent=applied;
  document.querySelector("#progress-rate").textContent=started?Math.round(applied/started*100)+"%":"0%";
}
function renderAll(){renderFormats();renderFeatured();renderContinue();renderChannels();renderProgress();bindDynamic();}
function bindDynamic(){
  document.querySelectorAll("[data-format]").forEach(el=>el.onclick=()=>{activeFormat=el.dataset.format;renderAll()});
  document.querySelectorAll("[data-open]").forEach(el=>{
    el.onclick=()=>openItem(el.dataset.open);
    el.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openItem(el.dataset.open)}};
  });
}
function openItem(id){
  const item=allItems().find(i=>i.id===id);
  if(!item)return;
  state.lastOpened=id;
  patchItem(id,{started:true});
  const s=itemState(id);
  const media=item.youtubeId?'<div class="video-wrap"><iframe src="https://www.youtube-nocookie.com/embed/'+item.youtubeId+'" title="'+escapeHtml(item.title)+'" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>':"";
  const lesson='<div class="lesson-body">'+item.body.map(p=>'<p>'+escapeHtml(p)+'</p>').join("")+'</div>';
  const source=item.sourceUrl?'<a class="source-link" href="'+item.sourceUrl+'" target="_blank" rel="noreferrer">Abrir fuente original ↗</a>':"";
  document.querySelector("#modal-content").innerHTML='<article class="modal-inner"><p class="eyebrow">'+escapeHtml(item.channelTitle.toUpperCase())+'</p>'+
    '<h2>'+escapeHtml(item.title)+'</h2><p class="lede">'+escapeHtml(item.summary)+'</p>'+
    '<div class="modal-meta"><span>'+formatLabel(item.kind)+'</span><span>'+escapeHtml(item.duration)+'</span><span>'+escapeHtml(item.level)+'</span><span>'+escapeHtml(item.author)+'</span></div>'+
    media+lesson+source+
    '<div class="apply-box"><p class="eyebrow">APLICAR AHORA</p><h3>'+escapeHtml(item.challenge)+'</h3><textarea id="evidence-input" placeholder="Escribe qué decisión, análisis o proyecto usarás como evidencia…">'+escapeHtml(s.evidence||"")+'</textarea>'+
    '<div class="modal-actions"><button class="play-button" id="save-evidence">Guardar evidencia</button><button class="save-button" id="mark-complete">'+(s.completed?"✓ Completado":"Marcar completado")+'</button></div></div></article>';
  const modal=document.querySelector("#content-modal");
  modal.showModal();
  document.querySelector("#save-evidence").onclick=()=>{
    const evidence=document.querySelector("#evidence-input").value.trim();
    if(!evidence)return;
    patchItem(id,{evidence,applied:true,completed:true});
    modal.close();
  };
  document.querySelector("#mark-complete").onclick=()=>{patchItem(id,{completed:true});modal.close()};
}
function escapeHtml(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
async function init(){
  const res=await fetch(CATALOG_URL);
  catalog=await res.json();
  document.querySelector("#catalog-search").addEventListener("input",e=>{searchTerm=e.target.value;renderChannels();bindDynamic()});
  document.querySelector("#search-toggle").onclick=()=>document.querySelector("#catalog-search").focus();
  document.querySelector("#modal-close").onclick=()=>document.querySelector("#content-modal").close();
  document.querySelector("#show-map").onclick=()=>document.querySelector("#concept-map-modal").showModal();
  document.querySelector("#map-close").onclick=()=>document.querySelector("#concept-map-modal").close();
  document.querySelector("#continue-learning").onclick=()=>openItem((state.lastOpened && allItems().some(i=>i.id===state.lastOpened&&!itemState(i.id).completed))?state.lastOpened:recommendedItem().id);
  renderAll();
}
init().catch(err=>{
  document.querySelector("#channel-rails").innerHTML="<p>No se pudo cargar el catálogo. Ejecuta el sitio mediante HTTP/GitHub Pages.</p>";
  console.error(err);
});