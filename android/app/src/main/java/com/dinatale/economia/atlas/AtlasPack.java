package com.dinatale.economia.atlas;

import java.io.*;
import java.nio.charset.Charset;
import java.security.MessageDigest;
import java.util.*;
import java.util.zip.*;
import org.json.*;

/** Reader and fail-closed validator for the portable Atlas ZIP contract. */
final class AtlasPack {
  static final int MAX_ZIP_BYTES = 20_000_000, MAX_JSON_BYTES = 4_000_000;
  static final String[] FILES = {"data.json", "model.json", "story.json", "scenario.json"};
  final JSONObject manifest, data, model, story, scenario;

  private AtlasPack(JSONObject m, JSONObject d, JSONObject mo, JSONObject st, JSONObject sc) {
    manifest=m; data=d; model=mo; story=st; scenario=sc;
  }

  static AtlasPack parse(byte[] raw) throws Exception {
    if (raw == null || raw.length == 0 || raw.length > MAX_ZIP_BYTES) throw bad();
    HashMap<String,byte[]> payload = new HashMap<>();
    HashSet<String> names = new HashSet<>();
    try (ZipInputStream in = new ZipInputStream(new ByteArrayInputStream(raw))) {
      ZipEntry e; byte[] buf = new byte[8192];
      while ((e=in.getNextEntry()) != null) {
        String n=e.getName();
        if (e.isDirectory() || e.getMethod()!=ZipEntry.STORED || n.contains("/") || n.contains("\\") || n.startsWith(".")
            || !names.add(n) || names.size()>5) throw bad();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        int count=0, r;
        while ((r=in.read(buf))!=-1) {
          count+=r;
          if (count>MAX_JSON_BYTES) throw bad();
          out.write(buf,0,r);
        }
        if (e.getCompressedSize()>MAX_JSON_BYTES || e.getSize()>MAX_JSON_BYTES) throw bad();
        payload.put(n,out.toByteArray());
        in.closeEntry();
      }
    } catch (Exception ex) { throw bad(); }
    if (payload.size()!=5 || !payload.containsKey("manifest.json")) throw bad();
    for (String n:FILES) if (!payload.containsKey(n)) throw bad();

    JSONObject manifest=json(payload.get("manifest.json"));
    if (!"1.0.0".equals(manifest.optString("schema_version"))
        || !"housing-discovery".equals(manifest.optString("pack_id"))
        || !"1.0.0".equals(manifest.optString("pack_version"))
        || !manifest.optString("git_commit").matches("[a-f0-9]{40}")
        || !manifest.optString("builder_sha256").matches("[a-f0-9]{64}")) throw bad();
    String classification=manifest.optString("classification");
    if (!classification.equals("PRIVATE") && !classification.equals("SYNTHETIC")) throw bad();
    JSONObject hashes=manifest.optJSONObject("files");
    if (hashes==null || hashes.length()!=4) throw bad();
    HashMap<String,JSONObject> packs=new HashMap<>();
    for (String n:FILES) {
      JSONObject h=hashes.optJSONObject(n);
      byte[] b=payload.get(n);
      if (h==null || h.optInt("bytes",-1)!=b.length || !sha256(b).equals(h.optString("sha256"))) throw bad();
      packs.put(n.substring(0,n.length()-5),json(b));
    }
    JSONObject d=packs.get("data"), m=packs.get("model"), s=packs.get("story"), sc=packs.get("scenario");
    for (JSONObject p:new JSONObject[]{d,m,s,sc}) {
      if (!"1.0.0".equals(p.optString("schema_version")) || !"1.0.0".equals(p.optString("version"))
          || !classification.equals(p.optString("classification"))
          || !p.optString("label").equals("PRIVATE".equals(classification)
             ? "PRIVATE / HISTÓRICO RECONSTRUIDO" : "DEMO / SYNTHETIC DATA")) throw bad();
      JSONObject prov=p.optJSONObject("provenance");
      if (prov==null || !prov.toString().equals(d.optJSONObject("provenance").toString())) throw bad();
    }
    if (!"data".equals(d.optString("kind")) || !"project_month".equals(d.optString("grain"))
        || !"model".equals(m.optString("kind")) || !"story".equals(s.optString("kind"))
        || !"scenario".equals(sc.optString("kind")) || !"moving_average_3".equals(m.optString("family"))
        || !d.optString("id").equals(m.optString("data_pack_id"))
        || !d.optString("id").equals(s.optString("data_pack_id"))
        || !m.optString("id").equals(s.optString("model_pack_id"))
        || !m.optString("id").equals(sc.optString("model_pack_id"))) throw bad();

    JSONArray rows=d.optJSONArray("rows"), results=m.optJSONArray("results");
    if (rows==null || rows.length()==0 || rows.length()>10000 || results==null || results.length()==0) throw bad();
    HashMap<String,TreeMap<String,JSONObject>> series=new HashMap<>();
    for(int i=0;i<rows.length();i++){
      JSONObject row=rows.optJSONObject(i); if(row==null) throw bad();
      String project=row.optString("project"), period=row.optString("period");
      double open=number(row,"stock_open"), sales=number(row,"sales"), close=number(row,"stock_close");
      if(project.isEmpty() || !project.matches("[A-Za-z0-9][A-Za-z0-9_.:-]{0,119}") || !period.matches("\\d{4}-(0[1-9]|1[0-2])-01") || row.optInt("review_units",-1)!=0
          || open<0 || sales<0 || sales>open+1e-8 || Math.abs(open-sales-close)>1e-8) throw bad();
      TreeMap<String,JSONObject> months=series.get(project); if(months==null){months=new TreeMap<>();series.put(project,months);}
      if(months.put(period,row)!=null) throw bad();
    }
    if(series.size()!=results.length()) throw bad();
    HashSet<String> resultProjects=new HashSet<>();
    for(int i=0;i<results.length();i++){
      JSONObject result=results.optJSONObject(i); if(result==null) throw bad();
      String p=result.optString("project"); TreeMap<String,JSONObject> months=series.get(p);
      if(months==null || !resultProjects.add(p) || months.size()<7) throw bad();
      ArrayList<JSONObject> list=new ArrayList<>(months.values());
      for(int j=0;j<list.size();j++){
        if(j>0){
          JSONObject before=list.get(j-1), after=list.get(j);
          if(!nextMonth(before.optString("period"),after.optString("period"))
              || Math.abs(number(before,"stock_close")-number(after,"stock_open"))>1e-8) throw bad();
        }
      }
      JSONObject last=list.get(list.size()-1);
      if(!result.optString("origin").equals(last.optString("period"))
          || Math.abs(number(result,"stock")-number(last,"stock_close"))>1e-8) throw bad();
      double avg=(number(list.get(list.size()-1),"sales")+number(list.get(list.size()-2),"sales")
          +number(list.get(list.size()-3),"sales"))/3d;
      if(Math.abs(number(result,"prediction")-Math.min(number(last,"stock_close"),avg))>1e-7) throw bad();
    }
    JSONArray indicators=d.optJSONArray("indicators"), scenarios=sc.optJSONArray("scenarios");
    if(indicators==null || scenarios==null || scenarios.length()==0) throw bad();
    HashSet<String> indicatorIds=new HashSet<>();
    for(int i=0;i<indicators.length();i++){
      JSONObject x=indicators.optJSONObject(i);
      if(x==null || !indicatorIds.add(x.optString("id")) || !series.containsKey(x.optString("id").replaceFirst("-(stock|velocity|sales)$",""))) throw bad();
    }
    for(int i=0;i<scenarios.length();i++){
      JSONObject x=scenarios.optJSONObject(i); if(x==null) throw bad();
      double mult=number(x,"multiplier"), prediction=number(x,"prediction");
      TreeMap<String,JSONObject> ms=series.get(x.optString("project"));
      JSONObject res=find(results,"project",x.optString("project"));
      if(ms==null || !m.optString("id").equals(x.optString("model_pack_id")) || mult<.5 || mult>1.5
          || prediction<0 || prediction>number(res,"stock")+1e-8
          || Math.abs(prediction-Math.min(number(res,"stock"),number(res,"prediction")*mult))>1e-7) throw bad();
    }
    if(!manifest.optString("classification").equals(d.optString("classification"))
        || !manifest.optString("generated_at").equals(d.optJSONObject("provenance").optString("generated_at"))) throw bad();
    return new AtlasPack(manifest,d,m,s,sc);
  }

  static JSONObject json(byte[] bytes) throws Exception {
    String text=new String(bytes,Charset.forName("UTF-8"));
    JSONObject o=new JSONObject(text);
    if(o.length()==0) throw bad();
    return o;
  }
  static String sha256(byte[] b) throws Exception {
    byte[] h=MessageDigest.getInstance("SHA-256").digest(b); StringBuilder s=new StringBuilder();
    for(byte x:h)s.append(String.format(Locale.ROOT,"%02x",x&255)); return s.toString();
  }
  static double number(JSONObject o,String key) throws Exception {
    Object v=o.opt(key); if(!(v instanceof Number)) throw bad();
    double n=((Number)v).doubleValue(); if(Double.isNaN(n)||Double.isInfinite(n)) throw bad(); return n;
  }
  static JSONObject find(JSONArray a,String key,String value) throws Exception {
    for(int i=0;i<a.length();i++){JSONObject o=a.optJSONObject(i);if(o!=null&&value.equals(o.optString(key)))return o;} throw bad();
  }
  static boolean nextMonth(String a,String b) {
    try {int ay=Integer.parseInt(a.substring(0,4)), am=Integer.parseInt(a.substring(5,7));
      int by=Integer.parseInt(b.substring(0,4)), bm=Integer.parseInt(b.substring(5,7));
      return (by*12+bm)-(ay*12+am)==1;}catch(Exception e){return false;}
  }
  static Exception bad(){return new Exception("Pack Atlas inválido, incompleto o incompatible");}
}