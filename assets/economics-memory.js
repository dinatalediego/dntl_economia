(function(root){
  "use strict";
  const CONFIG=root.ECONOMICS_SUPABASE_CONFIG||{};
  const USER_KEY="dntl_economia_last_user_id";
  let client=null;
  let user=null;
  let authSubscription=null;
  let statusListener=()=>{};
  let sessionListener=()=>{};
  let syncChain=Promise.resolve();

  function emit(status,detail=""){statusListener({status,detail,user});}
  function setStatusListener(fn){statusListener=typeof fn==="function"?fn:()=>{};}
  function setSessionListener(fn){sessionListener=typeof fn==="function"?fn:()=>{};}
  function getClient(){return client;}
  function getUser(){return user;}
  function isSignedIn(){return Boolean(user);}
  function userCacheKey(id){return "dntl_economia_streaming_state_v3_"+id;}
  function blankState(){return {items:{},actions:[],events:[],experiments:[],projectSettings:{},focusProject:null,lastOpened:null};}
  function normalizeState(raw={}){
    return {
      items:raw.items||{},
      actions:Array.isArray(raw.actions)?raw.actions:[],
      events:Array.isArray(raw.events)?raw.events:[],
      experiments:Array.isArray(raw.experiments)?raw.experiments:[],
      projectSettings:raw.projectSettings||{},
      focusProject:raw.focusProject||null,
      lastOpened:raw.lastOpened||null
    };
  }
  function hasMeaningfulState(state){
    return Object.keys(state?.items||{}).length>0||
      (state?.actions||[]).length>0||
      (state?.events||[]).length>0||
      (state?.experiments||[]).length>0;
  }
  function saveUserCache(state){
    if(user) localStorage.setItem(userCacheKey(user.id),JSON.stringify(normalizeState(state)));
  }
  function loadUserCache(){
    if(!user)return null;
    try{return normalizeState(JSON.parse(localStorage.getItem(userCacheKey(user.id))||"null")||{});}
    catch{return null;}
  }
  function uuid(){
    if(root.crypto?.randomUUID)return root.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{
      const r=Math.random()*16|0,v=c==="x"?r:(r&3|8);return v.toString(16);
    });
  }
  function queue(label,task){
    if(!user)return Promise.resolve({skipped:true});
    syncChain=syncChain.then(async()=>{
      emit("syncing",label);
      try{const out=await task();emit("synced",label);return out;}
      catch(error){console.error("EconomicsMemory",label,error);emit("error",error.message||String(error));return {error};}
    });
    return syncChain;
  }
  function stateItemFromRow(row){
    return {
      started:Boolean(row.started),completed:Boolean(row.completed),applied:Boolean(row.applied),
      evidence:row.evidence||"",startedAt:row.started_at,completedAt:row.completed_at,
      appliedAt:row.applied_at,lastOpenedAt:row.last_opened_at,updatedAt:row.updated_at
    };
  }
  function actionFromRow(row,outcomes){
    const outcome=outcomes.get(row.id);
    return {
      id:row.id,itemId:row.item_id,projectId:row.project_id,conceptIds:row.concept_ids||[],
      action:row.action,expectedOutcome:row.expected_outcome||"",metric:row.metric||"",
      reviewDate:row.review_date,status:row.status,createdAt:row.created_at,updatedAt:row.updated_at,
      outcomeSignal:outcome?.signal,observedOutcome:outcome?.observed_outcome||"",
      learning:outcome?.learning||"",reviewedAt:outcome?.observed_at
    };
  }
  function experimentFromRow(row){
    return {
      id:row.id,projectId:row.project_id,linkedApplicationId:row.linked_application_id,
      title:row.title,hypothesis:row.hypothesis,treatment:row.treatment||"",comparison:row.comparison||"",
      outcomeMetric:row.outcome_metric||"",status:row.status,startDate:row.start_date,endDate:row.end_date,
      notes:row.notes||"",createdAt:row.created_at,updatedAt:row.updated_at
    };
  }
  async function loadRemote(){
    if(!user)return blankState();
    const [profile,settings,learning,events,applications,outcomes,experiments]=await Promise.all([
      client.from("eco_profiles").select("*").eq("user_id",user.id).maybeSingle(),
      client.from("eco_project_settings").select("*").eq("user_id",user.id),
      client.from("eco_learning_state").select("*").eq("user_id",user.id),
      client.from("eco_learning_events").select("*").eq("user_id",user.id).order("event_at",{ascending:false}).limit(300),
      client.from("eco_applications").select("*").eq("user_id",user.id).order("created_at",{ascending:false}),
      client.from("eco_outcomes").select("*").eq("user_id",user.id).order("observed_at",{ascending:false}),
      client.from("eco_experiments").select("*").eq("user_id",user.id).order("updated_at",{ascending:false})
    ]);
    for(const result of [profile,settings,learning,events,applications,outcomes,experiments]){
      if(result.error)throw result.error;
    }
    const outcomeMap=new Map((outcomes.data||[]).map(x=>[x.application_id,x]));
    const state=blankState();
    for(const row of learning.data||[])state.items[row.item_id]=stateItemFromRow(row);
    state.projectSettings=Object.fromEntries((settings.data||[]).map(row=>[row.project_id,{active:row.active,weightOverride:row.weight_override||{}}]));
    state.focusProject=profile.data?.active_project_id||null;
    state.events=(events.data||[]).reverse().map(row=>({
      id:row.id,type:row.event_type,itemId:row.item_id,projectId:row.project_id,
      actionId:row.action_id,ts:row.event_at,payload:row.payload||{}
    }));
    state.actions=(applications.data||[]).map(row=>actionFromRow(row,outcomeMap));
    state.experiments=(experiments.data||[]).map(experimentFromRow);
    state.lastOpened=state.events.filter(e=>e.type==="open"&&e.itemId).slice(-1)[0]?.itemId||null;
    return state;
  }
  function mergeSameUser(local,remote){
    const merged=normalizeState(remote);
    for(const [id,l] of Object.entries(local.items||{})){
      const r=merged.items[id]||{};
      merged.items[id]={
        ...r,...l,
        started:Boolean(r.started||l.started),
        completed:Boolean(r.completed||l.completed),
        applied:Boolean(r.applied||l.applied),
        evidence:r.evidence||l.evidence||""
      };
    }
    const remoteActions=new Map((merged.actions||[]).map(a=>[a.id,a]));
    for(const a of local.actions||[])if(a.id&&!remoteActions.has(a.id))merged.actions.push(a);
    const remoteExp=new Map((merged.experiments||[]).map(e=>[e.id,e]));
    for(const e of local.experiments||[])if(e.id&&!remoteExp.has(e.id))merged.experiments.push(e);
    merged.projectSettings={...(local.projectSettings||{}),...(merged.projectSettings||{})};
    merged.focusProject=merged.focusProject||local.focusProject||null;
    merged.lastOpened=merged.lastOpened||local.lastOpened||null;
    return merged;
  }
  async function ensureProfile(state){
    const payload={user_id:user.id,active_project_id:state.focusProject||null,updated_at:new Date().toISOString()};
    const {error}=await client.from("eco_profiles").upsert(payload,{onConflict:"user_id"});
    if(error)throw error;
  }
  async function importState(state){
    if(!user)return;
    const normalized=normalizeState(state);
    await ensureProfile(normalized);
    const settings=Object.entries(normalized.projectSettings||{}).map(([projectId,s])=>({
      user_id:user.id,project_id:projectId,active:s.active!==false,weight_override:s.weightOverride||{},updated_at:new Date().toISOString()
    }));
    if(settings.length){
      const {error}=await client.from("eco_project_settings").upsert(settings,{onConflict:"user_id,project_id"});
      if(error)throw error;
    }
    const items=Object.entries(normalized.items||{}).map(([itemId,s])=>({
      user_id:user.id,item_id:itemId,started:Boolean(s.started),completed:Boolean(s.completed),applied:Boolean(s.applied),
      evidence:s.evidence||null,started_at:s.startedAt||null,completed_at:s.completedAt||null,
      applied_at:s.appliedAt||null,last_opened_at:s.lastOpenedAt||null,updated_at:s.updatedAt||new Date().toISOString()
    }));
    if(items.length){
      const {error}=await client.from("eco_learning_state").upsert(items,{onConflict:"user_id,item_id"});
      if(error)throw error;
    }
    for(const action of normalized.actions||[]){
      const actionId=/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(action.id||"")?action.id:uuid();
      action.id=actionId;
      const payload={
        id:actionId,user_id:user.id,item_id:action.itemId,project_id:action.projectId,
        concept_ids:action.conceptIds||[],action:action.action,expected_outcome:action.expectedOutcome||null,
        metric:action.metric||null,review_date:action.reviewDate||null,status:action.status||"pending",
        created_at:action.createdAt||new Date().toISOString(),updated_at:action.updatedAt||new Date().toISOString()
      };
      const {error}=await client.from("eco_applications").upsert(payload,{onConflict:"id"});
      if(error)throw error;
      if(action.status==="reviewed"&&action.outcomeSignal){
        const {error:outcomeError}=await client.from("eco_outcomes").upsert({
          application_id:actionId,user_id:user.id,signal:action.outcomeSignal,
          observed_outcome:action.observedOutcome||null,learning:action.learning||null,
          observed_at:action.reviewedAt||new Date().toISOString()
        },{onConflict:"application_id"});
        if(outcomeError)throw outcomeError;
      }
    }
    for(const exp of normalized.experiments||[]){
      const expId=/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(exp.id||"")?exp.id:uuid();
      exp.id=expId;
      const {error}=await client.from("eco_experiments").upsert({
        id:expId,user_id:user.id,project_id:exp.projectId,linked_application_id:exp.linkedApplicationId||null,
        title:exp.title,hypothesis:exp.hypothesis,treatment:exp.treatment||null,comparison:exp.comparison||null,
        outcome_metric:exp.outcomeMetric||null,status:exp.status||"designed",start_date:exp.startDate||null,
        end_date:exp.endDate||null,notes:exp.notes||null,updated_at:new Date().toISOString()
      },{onConflict:"id"});
      if(error)throw error;
    }
    const {error:eventError}=await client.from("eco_learning_events").insert({
      user_id:user.id,event_type:"sync_import",payload:{source:"local_v2_or_v3",items:items.length,actions:(normalized.actions||[]).length}
    });
    if(eventError)throw eventError;
    saveUserCache(normalized);
  }
  async function hydrate(localState){
    if(!user)return normalizeState(localState);
    emit("syncing","loading memory");
    const remote=await loadRemote();
    const lastUser=localStorage.getItem(USER_KEY);
    const cached=loadUserCache();
    let merged=remote;
    if(hasMeaningfulState(remote)){
      if(lastUser===user.id&&cached)merged=mergeSameUser(cached,remote);
    }else if(lastUser===user.id&&cached&&hasMeaningfulState(cached)){
      merged=mergeSameUser(cached,remote);
      await importState(merged);
    }else if(!lastUser&&hasMeaningfulState(localState)){
      merged=mergeSameUser(localState,remote);
      await importState(merged);
    }
    localStorage.setItem(USER_KEY,user.id);
    saveUserCache(merged);
    emit("synced","memory loaded");
    return merged;
  }
  async function syncProfile(state){
    return queue("profile",()=>ensureProfile(state));
  }
  async function syncProject(projectId,setting,state,eventType="project_toggle"){
    return queue("project",async()=>{
      const now=new Date().toISOString();
      const {error}=await client.from("eco_project_settings").upsert({
        user_id:user.id,project_id:projectId,active:setting.active!==false,
        weight_override:setting.weightOverride||{},updated_at:now
      },{onConflict:"user_id,project_id"});
      if(error)throw error;
      await ensureProfile(state);
      const {error:eventError}=await client.from("eco_learning_events").insert({
        user_id:user.id,event_type:eventType,project_id:projectId,
        payload:{active:setting.active!==false,focusProject:state.focusProject||null},event_at:now
      });
      if(eventError)throw eventError;
    });
  }
  async function syncItem(itemId,item,eventType,extra={}){
    return queue("learning item",async()=>{
      const now=new Date().toISOString();
      const payload={
        user_id:user.id,item_id:itemId,started:Boolean(item.started),completed:Boolean(item.completed),applied:Boolean(item.applied),
        evidence:item.evidence||null,started_at:item.startedAt||null,completed_at:item.completedAt||null,
        applied_at:item.appliedAt||null,last_opened_at:item.lastOpenedAt||null,updated_at:now
      };
      const {error}=await client.from("eco_learning_state").upsert(payload,{onConflict:"user_id,item_id"});
      if(error)throw error;
      if(eventType){
        const {error:eventError}=await client.from("eco_learning_events").insert({
          user_id:user.id,event_type:eventType,item_id:itemId,project_id:extra.projectId||null,
          action_id:extra.actionId||null,payload:extra.payload||{},event_at:extra.ts||now
        });
        if(eventError)throw eventError;
      }
    });
  }
  async function createApplication(action){
    if(!action.id)action.id=uuid();
    return queue("application",async()=>{
      const {error}=await client.from("eco_applications").insert({
        id:action.id,user_id:user.id,item_id:action.itemId,project_id:action.projectId,
        concept_ids:action.conceptIds||[],action:action.action,expected_outcome:action.expectedOutcome||null,
        metric:action.metric||null,review_date:action.reviewDate||null,status:action.status||"pending",
        created_at:action.createdAt||new Date().toISOString(),updated_at:new Date().toISOString()
      });
      if(error)throw error;
      const {error:eventError}=await client.from("eco_learning_events").insert({
        user_id:user.id,event_type:"apply",item_id:action.itemId,project_id:action.projectId,
        action_id:action.id,payload:{expectedOutcome:action.expectedOutcome||null,metric:action.metric||null}
      });
      if(eventError)throw eventError;
    });
  }
  async function saveOutcome(action){
    return queue("outcome",async()=>{
      const observedAt=action.reviewedAt||new Date().toISOString();
      const {error}=await client.from("eco_outcomes").upsert({
        application_id:action.id,user_id:user.id,signal:action.outcomeSignal,
        observed_outcome:action.observedOutcome||null,learning:action.learning||null,observed_at:observedAt
      },{onConflict:"application_id"});
      if(error)throw error;
      const {error:updateError}=await client.from("eco_applications").update({
        status:"reviewed",updated_at:new Date().toISOString()
      }).eq("id",action.id).eq("user_id",user.id);
      if(updateError)throw updateError;
      const {error:eventError}=await client.from("eco_learning_events").insert({
        user_id:user.id,event_type:"review",item_id:action.itemId,project_id:action.projectId,
        action_id:action.id,payload:{signal:action.outcomeSignal}
      });
      if(eventError)throw eventError;
    });
  }
  async function saveExperiment(exp){
    if(!exp.id)exp.id=uuid();
    return queue("experiment",async()=>{
      const {error}=await client.from("eco_experiments").upsert({
        id:exp.id,user_id:user.id,project_id:exp.projectId,linked_application_id:exp.linkedApplicationId||null,
        title:exp.title,hypothesis:exp.hypothesis,treatment:exp.treatment||null,comparison:exp.comparison||null,
        outcome_metric:exp.outcomeMetric||null,status:exp.status||"designed",start_date:exp.startDate||null,
        end_date:exp.endDate||null,notes:exp.notes||null,updated_at:new Date().toISOString()
      },{onConflict:"id"});
      if(error)throw error;
      const {error:eventError}=await client.from("eco_learning_events").insert({
        user_id:user.id,event_type:"experiment",project_id:exp.projectId,payload:{experimentId:exp.id,status:exp.status||"designed"}
      });
      if(eventError)throw eventError;
    });
  }
  async function signInWithGoogle(){
    if(!client)throw new Error("Supabase no está inicializado.");
    const redirectTo=location.origin+location.pathname;
    const {error}=await client.auth.signInWithOAuth({provider:"google",options:{redirectTo}});
    if(error)throw error;
  }
  async function signInWithPassword(email,password){
    const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error)throw error;return data;
  }
  async function signUp(email,password){
    const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});
    if(error)throw error;return data;
  }
  async function signOut(){
    const current=user;
    const {error}=await client.auth.signOut();
    if(error)throw error;
    if(current)localStorage.removeItem(userCacheKey(current.id));
    localStorage.removeItem(USER_KEY);
  }
  async function init(){
    if(!root.supabase?.createClient)throw new Error("No se cargó supabase-js.");
    client=root.supabase.createClient(CONFIG.url,CONFIG.publishableKey,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    });
    const {data,error}=await client.auth.getSession();
    if(error)throw error;
    user=data.session?.user||null;
    emit(user?"connected":"local",user?"session restored":"anonymous");
    const {data:listener}=client.auth.onAuthStateChange((_event,session)=>{
      const next=session?.user||null;
      setTimeout(()=>{
        user=next;
        emit(user?"connected":"local",user?"signed in":"signed out");
        sessionListener({user,event:_event});
      },0);
    });
    authSubscription=listener.subscription;
    return {user,client};
  }
  function destroy(){authSubscription?.unsubscribe?.();}

  root.EconomicsMemory={
    init,destroy,getClient,getUser,isSignedIn,setStatusListener,setSessionListener,hydrate,saveUserCache,
    syncProfile,syncProject,syncItem,createApplication,saveOutcome,saveExperiment,
    signInWithGoogle,signInWithPassword,signUp,signOut,uuid,blankState,normalizeState
  };
})(window);