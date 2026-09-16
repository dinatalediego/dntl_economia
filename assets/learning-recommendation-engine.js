(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports){module.exports=api;}else{root.LearningRecommendationEngine=api;}
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  function clamp(v,min=0,max=1){return Math.max(min,Math.min(max,v));}
  function allItems(catalog){return catalog.channels.flatMap(c=>c.items.map(i=>({...i,channelId:c.id,channelTitle:c.title,relevance:Number(c.relevance)||0})));}
  function contentIndex(graph){return Object.fromEntries((graph.content||[]).map(x=>[x.id,x]));}
  function conceptIndex(graph){return Object.fromEntries((graph.concepts||[]).map(x=>[x.id,x]));}
  function itemProgress(s){if(!s)return 0;if(s.applied)return 1;if(s.completed)return .68;if(s.started)return .25;return 0;}
  function conceptMastery(catalog,graph,state){
    const idx=contentIndex(graph), totals={}, weights={};
    for(const item of allItems(catalog)){
      const map=(idx[item.id]||{}).concepts||{};
      const p=itemProgress((state.items||{})[item.id]);
      for(const [cid,w0] of Object.entries(map)){
        const w=Number(w0)||0;
        totals[cid]=(totals[cid]||0)+p*w;
        weights[cid]=(weights[cid]||0)+w;
      }
    }
    const out={};
    for(const c of graph.concepts||[]) out[c.id]=weights[c.id]?clamp(totals[c.id]/weights[c.id]):0;
    return out;
  }
  function activeProjects(projects,state){
    const settings=state.projectSettings||{};
    return projects.projects.filter(p=>settings[p.id]?.active ?? p.defaultActive);
  }
  function focusProject(projects,state){
    const id=state.focusProject||projects.defaultFocus;
    return projects.projects.find(p=>p.id===id)||projects.projects[0];
  }
  function projectFit(content,projects,state){
    const active=activeProjects(projects,state), focus=focusProject(projects,state);
    let fit=0, best={project:null,concept:null,value:0};
    for(const p of active){
      const multiplier=p.id===focus.id?1.7:0.55;
      for(const [cid,cw0] of Object.entries(content.concepts||{})){
        const cw=Number(cw0)||0, pw=Number(p.conceptWeights?.[cid])||0;
        const v=cw*pw*multiplier;
        fit+=v;
        if(v>best.value)best={project:p,concept:cid,value:v};
      }
    }
    return {fit,best};
  }
  function prerequisites(graph,conceptId){
    return (graph.edges||[]).filter(e=>e.type==="requires"&&e.source===conceptId).map(e=>e.target);
  }
  function lastKinds(state,catalog,n=3){
    const events=(state.events||[]).filter(e=>e.type==="open").slice(-n).reverse();
    const idx=Object.fromEntries(allItems(catalog).map(i=>[i.id,i]));
    return events.map(e=>idx[e.itemId]?.kind).filter(Boolean);
  }
  function scoreItem(item,ctx){
    const {catalog,graph,projects,state,mastery}=ctx;
    const cidx=contentIndex(graph), concepts=conceptIndex(graph), content=cidx[item.id]||{concepts:{},related:[]};
    const progress=(state.items||{})[item.id]||{};
    const pf=projectFit(content,projects,state);
    const conceptEntries=Object.entries(content.concepts||{});
    const gap=conceptEntries.length?conceptEntries.reduce((a,[cid,w])=>a+(1-(mastery[cid]||0))*Number(w),0)/conceptEntries.reduce((a,[,w])=>a+Number(w),0):.5;
    let prereqPenalty=0, prereqBonus=0;
    for(const [cid,w] of conceptEntries){
      for(const pre of prerequisites(graph,cid)){
        const m=mastery[pre]||0;
        if(m<.28)prereqPenalty+=5*Number(w);
        else if(m>.55)prereqBonus+=1.5*Number(w);
      }
    }
    const lastId=state.lastOpened;
    const proximity=lastId&&((cidx[lastId]?.related||[]).includes(item.id)||(content.related||[]).includes(lastId))?7:0;
    const recentKinds=lastKinds(state,catalog,3);
    const diversity=recentKinds.length&&!recentKinds.includes(item.kind)?2.2:0;
    const progressPenalty=progress.applied?80:progress.completed?24:progress.started?5:0;
    let outcomeFollowup=0;
    const candidateConcepts=new Set(Object.keys(content.concepts||{}));
    for(const action of (state.actions||[]).filter(a=>a.status==="reviewed").slice(-12)){
      const source=cidx[action.itemId]||{concepts:{},related:[]};
      const shared=Object.keys(source.concepts||{}).some(cid=>candidateConcepts.has(cid));
      const related=(source.related||[]).includes(item.id);
      if(action.outcomeSignal==="inconclusive"||action.outcomeSignal==="contradicted"){
        outcomeFollowup+=related?7:shared?2.5:0;
      }else if(action.outcomeSignal==="confirmed"){
        outcomeFollowup+=related?2:(shared?0.5:0);
      }
    }
    const base=(Number(item.relevance)||0)*2.5;
    const projectComponent=pf.fit*1.35;
    const gapComponent=gap*16;
    const score=base+projectComponent+gapComponent+prereqBonus+proximity+diversity+outcomeFollowup-prereqPenalty-progressPenalty;
    const bestConcept=conceptEntries.sort((a,b)=>(1-(mastery[b[0]]||0))*b[1]-(1-(mastery[a[0]]||0))*a[1])[0]?.[0];
    const focus=focusProject(projects,state);
    const reasonParts=[];
    if(pf.best.project)reasonParts.push("encaja con "+pf.best.project.title);
    if(bestConcept&&concepts[bestConcept])reasonParts.push("tienes recorrido en "+concepts[bestConcept].title+" ("+Math.round((mastery[bestConcept]||0)*100)+"%)");
    if(proximity)reasonParts.push("conecta con lo último que abriste");
    if(outcomeFollowup>0)reasonParts.push("responde a un outcome reciente");
    if(prereqPenalty>0)reasonParts.push("antes conviene reforzar un prerrequisito");
    return {item,score,components:{base,projectFit:projectComponent,knowledgeGap:gapComponent,prereq:prereqBonus-prereqPenalty,proximity,diversity,outcomeFollowup,progressPenalty},reason:reasonParts.join(" · "),focusProject:focus.id,bestConcept};
  }
  function rank(catalog,graph,projects,state){
    const mastery=conceptMastery(catalog,graph,state);
    const ctx={catalog,graph,projects,state,mastery};
    return allItems(catalog).map(item=>scoreItem(item,ctx)).sort((a,b)=>b.score-a.score);
  }
  function weeklyMix(catalog,graph,projects,state,limit=5){
    const ranked=rank(catalog,graph,projects,state), picked=[], channels=new Set(), kinds=new Set();
    for(const row of ranked){
      const s=(state.items||{})[row.item.id]||{};
      if(s.applied)continue;
      const diversityBoost=(!channels.has(row.item.channelId)?5:0)+(!kinds.has(row.item.kind)?2:0);
      row.weeklyScore=row.score+diversityBoost;
    }
    ranked.sort((a,b)=>(b.weeklyScore??b.score)-(a.weeklyScore??a.score));
    for(const row of ranked){
      if(picked.length>=limit)break;
      if(picked.length<3&&channels.has(row.item.channelId))continue;
      picked.push(row);channels.add(row.item.channelId);kinds.add(row.item.kind);
    }
    if(picked.length<limit){
      for(const row of ranked){if(picked.length>=limit)break;if(!picked.some(x=>x.item.id===row.item.id))picked.push(row);}
    }
    return picked;
  }
  function projectMastery(project,mastery){
    let n=0,d=0;
    for(const [cid,w0] of Object.entries(project.conceptWeights||{})){const w=Number(w0)||0;n+=(mastery[cid]||0)*w;d+=w;}
    return d?n/d:0;
  }
  function nextReviewActions(state,today){
    const now=today?new Date(today):new Date();
    return [...(state.actions||[])].filter(a=>a.status!=="reviewed").sort((a,b)=>{
      const da=a.reviewDate?new Date(a.reviewDate):new Date(a.createdAt);
      const db=b.reviewDate?new Date(b.reviewDate):new Date(b.createdAt);
      const oa=da<=now?0:1, ob=db<=now?0:1;
      return oa-ob||da-db;
    });
  }
  return {allItems,contentIndex,conceptIndex,conceptMastery,activeProjects,focusProject,projectFit,scoreItem,rank,weeklyMix,projectMastery,nextReviewActions};
});