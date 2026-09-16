const CATALOG_URL="data/economics_streaming_catalog.json";
const GRAPH_URL="data/economics_knowledge_graph.json";
const PROJECTS_URL="data/economics_project_profiles.json";
const STORAGE_KEY="dntl_economia_streaming_state_v2";
const LEGACY_KEY="dntl_economia_streaming_progress_v1";
let catalog=null,graph=null,projects=null;
let activeFormat="Todos",searchTerm="";
let state=loadState();

function loadState(){
  try{
    const existing=JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(existing)return normalizeState(existing);
    const legacy=JSON.parse(localStorage.getItem(LEGACY_KEY));
    if(legacy)return normalizeState({items:legacy.items||{},lastOpened:legacy.lastOpened||null});
  }catch{}
  return normalizeState({});
}
function normalizeState(raw){
  return {
    items:raw.items||{},
    actions:Array.isArray(raw.actions)?raw.actions:[],
    events:Array.isArray(raw.events)?raw.events:[],
    projectSettings:raw.projectSettings||{},
    focusProject:raw.focusProject||null,
    lastOpened:raw.lastOpened||null
  };
}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function itemState(id){return state.items[id]||{started:false,completed:false,applied:false,evidence:""};}
function recordEvent(type,itemId,extra={}){state.events.push({type,itemId,ts:new Date().toISOString(),...extra});if(state.events.length>300)state.events=state.events.slice(-300);}
function patchItem(id,patch,eventType){
  state.items[id]={...itemState(id),...patch};
  if(eventType)recordEvent(eventType,id);
  saveState();
}
function ensureProjectSettings(){
  for(const p of projects.projects){
    if(!state.projectSettings[p.id])state.projectSettings[p.id]={active:p.defaultActive!==false};
  }
  if(!state.focusProject||!projects.projects.some(p=>p.id===state.focusProject))state.focusProject=projects.defaultFocus;
  saveState();
}
function allItems(){return LearningRecommendationEngine.allItems(catalog);}
function itemById(id){return allItems().find(i=>i.id===id);}
function projectById(id){return projects.projects.find(p=>p.id===id);}
function contentById(id){return LearningRecommendationEngine.contentIndex(graph)[id]||{concepts:{},related:[]};}
function mastery(){return LearningRecommendationEngine.conceptMastery(catalog,graph,state);}
function ranked(){return LearningRecommendationEngine.rank(catalog,graph,projects,state);}
function formatLabel(kind){return ({video:"VIDEO",lesson:"LECTURA",simulation:"SIMULACIÓN",case:"CASO"})[kind]||String(kind||"").toUpperCase();}
function symbolFor(channel){return channel?.symbol||"∴";}
function escapeHtml(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function pct(v){return Math.round((Number(v)||0)*100);}
function todayISO(offset=0){const d=new Date();d.setDate(d.getDate()+offset);return d.toISOString().slice(0,10);}
function statusFor(id){const s=itemState(id);if(s.applied)return["applied","Aplicado"];if(s.completed)return["completed","Completado"];if(s.started)return["started","Iniciado"];return["","Nuevo"];}
function filtered(items){
  return items.filter(item=>{
    const f=activeFormat==="Todos"||formatLabel(item.kind)===activeFormat;
    const blob=[item.title,item.author,item.summary,item.application,item.channelTitle,(item.tags||[]).join(" ")].join(" ").toLowerCase();
    return f&&(!searchTerm||blob.includes(searchTerm.toLowerCase()));
  });
}
function card(item,channel){
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
function renderProjects(){
  const m=mastery();
  document.querySelector("#project-grid").innerHTML=projects.projects.map(p=>{
    const setting=state.projectSettings[p.id]||{active:p.defaultActive!==false};
    const focused=state.focusProject===p.id;
    const pm=LearningRecommendationEngine.projectMastery(p,m);
    return '<article class="project-card '+(focused?"focused ":"")+(setting.active?"":"inactive")+'">'+
      '<span class="project-symbol">'+escapeHtml(p.symbol)+'</span><h3>'+escapeHtml(p.title)+'</h3><p>'+escapeHtml(p.description)+'</p>'+
      '<div class="project-mastery"><div class="meter"><span style="width:'+pct(pm)+'%"></span></div><div class="meter-label"><span>dominio útil</span><strong>'+pct(pm)+'%</strong></div></div>'+
      '<div class="project-actions"><button class="mini-button '+(focused?"primary":"")+'" data-project-focus="'+p.id+'" '+(!setting.active?"disabled":"")+'>'+(focused?"Foco actual":"Enfocar")+'</button>'+
      '<button class="mini-button" data-project-toggle="'+p.id+'">'+(setting.active?"Desactivar":"Activar")+'</button></div></article>';
  }).join("");
}
function renderFeatured(){
  const row=ranked()[0], item=row.item, channel=catalog.channels.find(c=>c.id===item.channelId), s=itemState(item.id);
  const components=row.components;
  document.querySelector("#featured-next").innerHTML='<article class="next-card" data-symbol="'+escapeHtml(symbolFor(channel))+'"><div>'+
    '<p class="next-why">Recomendación personal</p><h3>'+escapeHtml(item.title)+'</h3><p>'+escapeHtml(item.summary)+'</p>'+
    '<p class="recommendation-reason">'+escapeHtml(row.reason||"Prioridad calculada por proyecto, gap y progreso.")+'</p>'+
    '<div class="score-pills"><span class="score-pill">proyecto <strong>'+components.projectFit.toFixed(1)+'</strong></span>'+
    '<span class="score-pill">gap <strong>'+components.knowledgeGap.toFixed(1)+'</strong></span>'+
    '<span class="score-pill">grafo <strong>'+((components.proximity||0)+(components.outcomeFollowup||0)).toFixed(1)+'</strong></span>'+
    '<span class="score-pill">score <strong>'+row.score.toFixed(1)+'</strong></span></div>'+
    '<div class="hero-actions"><button class="play-button" data-open="'+item.id+'">▶ '+(s.started?"Retomar":"Empezar")+'</button><button class="save-button" data-open="'+item.id+'">Ver por qué</button></div></div>'+
    '<div class="next-stats"><span><b>Proyecto foco</b>'+escapeHtml(projectById(state.focusProject)?.title||"—")+'</span><span><b>Canal</b>'+escapeHtml(channel.title)+'</span><span><b>Autor</b>'+escapeHtml(item.author)+'</span><span><b>Aplicación</b>'+escapeHtml(item.applicationShort)+'</span></div></article>';
  document.querySelector("#score-legend").innerHTML='<b>Cómo leer el score:</b> más alto = mayor encaje con proyecto + mayor gap de conocimiento + conexiones útiles del grafo; completar/aplicar reduce prioridad. Outcomes inconclusos elevan piezas vecinas para rediseñar la siguiente acción.';
}
function renderWeekly(){
  const rows=LearningRecommendationEngine.weeklyMix(catalog,graph,projects,state,5);
  document.querySelector("#weekly-grid").innerHTML=rows.map((row,i)=>'<article class="weekly-card" data-open="'+row.item.id+'" tabindex="0" role="button">'+
    '<span class="weekly-rank">0'+(i+1)+'</span><small>'+escapeHtml(row.item.channelTitle)+'</small><h3>'+escapeHtml(row.item.title)+'</h3>'+
    '<p>'+escapeHtml(row.reason||row.item.applicationShort)+'</p></article>').join("");
}
function renderActions(){
  const pending=LearningRecommendationEngine.nextReviewActions(state);
  const reviewed=[...state.actions].filter(a=>a.status==="reviewed").sort((a,b)=>String(b.reviewedAt).localeCompare(String(a.reviewedAt))).slice(0,2);
  const shell=document.querySelector("#action-ledger");
  if(!pending.length&&!reviewed.length){
    shell.innerHTML='<div class="action-empty"><strong>Aún no hay aplicaciones registradas.</strong><p>Abre una pieza, define una acción concreta y el motor la traerá de vuelta cuando toque observar el outcome.</p></div>';
    return;
  }
  const cards=[];
  for(const a of pending){
    const item=itemById(a.itemId),project=projectById(a.projectId),due=a.reviewDate&&a.reviewDate<=todayISO();
    cards.push('<article class="action-card '+(due?"overdue":"")+'"><div><h3>'+escapeHtml(a.action)+'</h3><p>'+escapeHtml(item?.title||a.itemId)+'</p>'+
      '<div class="action-meta"><span>'+escapeHtml(project?.title||"Proyecto")+'</span><span>revisar '+escapeHtml(a.reviewDate||"sin fecha")+'</span></div></div>'+
      '<div><p><strong>Esperabas:</strong> '+escapeHtml(a.expectedOutcome||"—")+'</p><p><strong>Métrica:</strong> '+escapeHtml(a.metric||"—")+'</p></div>'+
      '<button class="play-button" data-review-action="'+a.id+'">'+(due?"Registrar outcome":"Revisar")+'</button></article>');
  }
  for(const a of reviewed){
    const project=projectById(a.projectId);
    cards.push('<article class="action-card reviewed"><div><h3>'+escapeHtml(a.action)+'</h3><p>'+escapeHtml(a.learning||a.observedOutcome||"Outcome revisado")+'</p>'+
      '<div class="action-meta"><span>'+escapeHtml(project?.title||"Proyecto")+'</span><span class="outcome-chip">'+escapeHtml(a.outcomeSignal||"reviewed")+'</span></div></div>'+
      '<div><p><strong>Observado:</strong> '+escapeHtml(a.observedOutcome||"—")+'</p></div><span class="outcome-chip">loop cerrado</span></article>');
  }
  shell.innerHTML=cards.join("");
}
function renderKnowledge(){
  const m=mastery(),focus=projectById(state.focusProject),concepts=LearningRecommendationEngine.conceptIndex(graph);
  const rows=Object.entries(focus?.conceptWeights||{}).map(([id,w])=>({id,w:Number(w),m:m[id]||0,concept:concepts[id]})).filter(x=>x.concept)
    .sort((a,b)=>b.w*(1-b.m)-a.w*(1-a.m)).slice(0,12);
  document.querySelector("#knowledge-grid").innerHTML=rows.map(x=>'<article class="knowledge-card '+(x.m<.35?"low":"")+'"><header><h3>'+escapeHtml(x.concept.title)+'</h3><strong>'+pct(x.m)+'%</strong></header>'+
    '<p>'+escapeHtml(x.concept.description)+'</p><div class="meter"><span style="width:'+pct(x.m)+'%"></span></div></article>').join("");
}
function renderContinue(){
  const items=allItems().filter(i=>itemState(i.id).started&&!itemState(i.id).completed);
  document.querySelector("#continue-section").hidden=items.length===0;
  if(items.length)document.querySelector("#continue-rail").innerHTML=items.map(item=>card(item,catalog.channels.find(c=>c.id===item.channelId))).join("");
}
function renderChannels(){
  const html=catalog.channels.map(channel=>{
    const items=filtered(channel.items.map(i=>({...i,channelId:channel.id,channelTitle:channel.title,relevance:channel.relevance})));
    if(!items.length)return"";
    return '<section class="channel-block"><div class="channel-heading"><div><h3>'+escapeHtml(channel.title)+'</h3><p>'+escapeHtml(channel.description)+'</p></div><span class="channel-relevance">base '+channel.relevance+'/5</span></div><div class="rail">'+items.map(i=>card(i,channel)).join("")+'</div></section>';
  }).join("");
  document.querySelector("#channel-rails").innerHTML=html||'<p>No encontré piezas con esos filtros.</p>';
}
function renderProgress(){
  const states=Object.values(state.items),applied=states.filter(s=>s.applied).length,reviewed=state.actions.filter(a=>a.status==="reviewed").length;
  document.querySelector("#progress-started").textContent=states.filter(s=>s.started).length;
  document.querySelector("#progress-applied").textContent=applied;
  document.querySelector("#progress-reviewed").textContent=reviewed;
  document.querySelector("#progress-rate").textContent=state.actions.length?Math.round(reviewed/state.actions.length*100)+"%":"0%";
}
function renderMap(){
  const m=mastery(),focus=projectById(state.focusProject),weights=focus?.conceptWeights||{};
  const nodes=graph.concepts.map(c=>({c,m:m[c.id]||0,w:Number(weights[c.id])||0})).sort((a,b)=>b.w*(1-b.m)-a.w*(1-a.m)).slice(0,22);
  document.querySelector("#dynamic-map").innerHTML='<span class="graph-node core">'+escapeHtml(focus?.title||"Project")+'</span>'+nodes.map(x=>'<span class="graph-node '+(x.m>=.65?"mastered":x.w>=4&&x.m<.4?"gap":"")+'" title="'+escapeHtml(x.c.description)+'">'+escapeHtml(x.c.title)+' · '+pct(x.m)+'%</span>').join("");
}
function renderAll(){renderFormats();renderProjects();renderFeatured();renderWeekly();renderActions();renderKnowledge();renderContinue();renderChannels();renderProgress();renderMap();bindDynamic();}
function bindDynamic(){
  document.querySelectorAll("[data-format]").forEach(el=>el.onclick=()=>{activeFormat=el.dataset.format;renderAll();});
  document.querySelectorAll("[data-open]").forEach(el=>{el.onclick=()=>openItem(el.dataset.open);el.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openItem(el.dataset.open);}};});
  document.querySelectorAll("[data-project-focus]").forEach(el=>el.onclick=()=>{state.focusProject=el.dataset.projectFocus;saveState();renderAll();});
  document.querySelectorAll("[data-project-toggle]").forEach(el=>el.onclick=()=>{
    const id=el.dataset.projectToggle,current=state.projectSettings[id]?.active!==false;
    state.projectSettings[id]={...(state.projectSettings[id]||{}),active:!current};
    if(state.focusProject===id&&!state.projectSettings[id].active){
      const next=projects.projects.find(p=>state.projectSettings[p.id]?.active!==false&&p.id!==id);
      if(next)state.focusProject=next.id;
    }
    saveState();renderAll();
  });
  document.querySelectorAll("[data-review-action]").forEach(el=>el.onclick=()=>openOutcome(el.dataset.reviewAction));
}
function projectOptions(selected){
  return LearningRecommendationEngine.activeProjects(projects,state).map(p=>'<option value="'+p.id+'" '+(p.id===selected?"selected":"")+'>'+escapeHtml(p.title)+'</option>').join("");
}
function openItem(id){
  const item=itemById(id);if(!item)return;
  state.lastOpened=id;patchItem(id,{started:true,lastOpenedAt:new Date().toISOString()},"open");
  const row=ranked().find(r=>r.item.id===id),s=itemState(id),media=item.youtubeId?'<div class="video-wrap"><iframe src="https://www.youtube-nocookie.com/embed/'+item.youtubeId+'" title="'+escapeHtml(item.title)+'" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>':"";
  const lesson='<div class="lesson-body">'+item.body.map(p=>'<p>'+escapeHtml(p)+'</p>').join("")+'</div>';
  const source=item.sourceUrl?'<a class="source-link" href="'+item.sourceUrl+'" target="_blank" rel="noreferrer">Abrir fuente original ↗</a>':"";
  document.querySelector("#modal-content").innerHTML='<article class="modal-inner"><p class="eyebrow">'+escapeHtml(item.channelTitle.toUpperCase())+'</p><h2>'+escapeHtml(item.title)+'</h2><p class="lede">'+escapeHtml(item.summary)+'</p>'+
    '<div class="modal-meta"><span>'+formatLabel(item.kind)+'</span><span>'+escapeHtml(item.duration)+'</span><span>'+escapeHtml(item.level)+'</span><span>'+escapeHtml(item.author)+'</span></div>'+
    '<div class="recommendation-box"><strong>¿Por qué ahora?</strong><p>'+escapeHtml(row?.reason||"Conecta con tu proyecto y tu estado actual de aprendizaje.")+'</p></div>'+media+lesson+source+
    '<div class="apply-box"><p class="eyebrow">CONCEPTO → PROYECTO → ACCIÓN → OUTCOME</p><h3>'+escapeHtml(item.challenge)+'</h3>'+
    '<div class="application-form"><label>Proyecto<select id="apply-project">'+projectOptions(state.focusProject)+'</select></label><label>Revisar resultado el<input id="apply-review-date" type="date" value="'+todayISO(7)+'"></label>'+
    '<label class="full">Acción concreta<textarea id="apply-action" placeholder="Ej. subir 3% el precio de una tipología piloto y comparar absorción…">'+escapeHtml(s.evidence||"")+'</textarea></label>'+
    '<label>Resultado esperado<input id="apply-expected" placeholder="Ej. mantener absorción con mayor revenue"></label><label>Métrica observable<input id="apply-metric" placeholder="Ej. reservas/semana, precio m², conversión"></label></div>'+
    '<div class="modal-actions"><button class="play-button" id="save-application">Registrar aplicación</button><button class="save-button" id="mark-complete">'+(s.completed?"✓ Completado":"Marcar completado")+'</button></div></div></article>';
  const modal=document.querySelector("#content-modal");modal.showModal();
  document.querySelector("#save-application").onclick=()=>{
    const action=document.querySelector("#apply-action").value.trim();if(!action)return;
    const projectId=document.querySelector("#apply-project").value,reviewDate=document.querySelector("#apply-review-date").value;
    const application={id:"act_"+Date.now(),itemId:id,projectId,conceptIds:Object.keys(contentById(id).concepts||{}),action,
      expectedOutcome:document.querySelector("#apply-expected").value.trim(),metric:document.querySelector("#apply-metric").value.trim(),reviewDate,status:"pending",createdAt:new Date().toISOString()};
    state.actions.push(application);patchItem(id,{evidence:action,applied:true,completed:true,applicationIds:[...(s.applicationIds||[]),application.id]},"apply");
    saveState();modal.close();renderAll();
  };
  document.querySelector("#mark-complete").onclick=()=>{patchItem(id,{completed:true},"complete");saveState();modal.close();renderAll();};
}
function openOutcome(actionId){
  const a=state.actions.find(x=>x.id===actionId);if(!a)return;
  const item=itemById(a.itemId),project=projectById(a.projectId);
  document.querySelector("#outcome-content").innerHTML='<article class="modal-inner"><p class="eyebrow">OBSERVED OUTCOME</p><h2>'+escapeHtml(a.action)+'</h2>'+
    '<p class="lede">'+escapeHtml(project?.title||"Proyecto")+' · '+escapeHtml(item?.title||a.itemId)+'</p>'+
    '<div class="recommendation-box"><p><strong>Hipótesis previa:</strong> '+escapeHtml(a.expectedOutcome||"No registrada")+'<br><strong>Métrica:</strong> '+escapeHtml(a.metric||"No registrada")+'</p></div>'+
    '<div class="application-form"><label class="full">¿Qué ocurrió?<textarea id="outcome-observed" placeholder="Describe el resultado observado…"></textarea></label>'+
    '<label class="full">¿Qué aprendiste / qué cambiarías?<textarea id="outcome-learning" placeholder="Separa resultado de calidad de decisión…"></textarea></label></div>'+
    '<p class="eyebrow" style="margin-top:18px">LECTURA DEL RESULTADO</p><div class="outcome-options">'+
    '<button class="outcome-option" data-outcome-signal="confirmed">Confirmó</button><button class="outcome-option" data-outcome-signal="inconclusive">Inconcluso</button><button class="outcome-option" data-outcome-signal="contradicted">Contradijo</button></div>'+
    '<button class="play-button" id="save-outcome">Cerrar loop</button></article>';
  let signal="inconclusive";
  document.querySelector("#outcome-modal").showModal();
  document.querySelectorAll("[data-outcome-signal]").forEach(el=>el.onclick=()=>{signal=el.dataset.outcomeSignal;document.querySelectorAll("[data-outcome-signal]").forEach(x=>x.classList.toggle("active",x===el));});
  document.querySelector('[data-outcome-signal="inconclusive"]').classList.add("active");
  document.querySelector("#save-outcome").onclick=()=>{
    a.status="reviewed";a.outcomeSignal=signal;a.observedOutcome=document.querySelector("#outcome-observed").value.trim();a.learning=document.querySelector("#outcome-learning").value.trim();a.reviewedAt=new Date().toISOString();
    recordEvent("review",a.itemId,{actionId:a.id,outcomeSignal:signal});saveState();document.querySelector("#outcome-modal").close();renderAll();
  };
}
async function init(){
  const [c,g,p]=await Promise.all([fetch(CATALOG_URL).then(r=>r.json()),fetch(GRAPH_URL).then(r=>r.json()),fetch(PROJECTS_URL).then(r=>r.json())]);
  catalog=c;graph=g;projects=p;ensureProjectSettings();
  document.querySelector("#catalog-search").addEventListener("input",e=>{searchTerm=e.target.value;renderChannels();bindDynamic();});
  document.querySelector("#search-toggle").onclick=()=>document.querySelector("#catalog-search").focus();
  document.querySelector("#modal-close").onclick=()=>document.querySelector("#content-modal").close();
  document.querySelector("#outcome-close").onclick=()=>document.querySelector("#outcome-modal").close();
  document.querySelector("#show-map").onclick=()=>{renderMap();document.querySelector("#concept-map-modal").showModal();};
  document.querySelector("#map-close").onclick=()=>document.querySelector("#concept-map-modal").close();
  document.querySelector("#continue-learning").onclick=()=>openItem((state.lastOpened&&itemState(state.lastOpened).started&&!itemState(state.lastOpened).completed)?state.lastOpened:ranked()[0].item.id);
  renderAll();
}
init().catch(err=>{
  document.querySelector("#channel-rails").innerHTML="<p>No se pudo cargar el Learning Recommendation Engine.</p>";
  console.error(err);
});