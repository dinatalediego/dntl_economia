package com.dinatale.economia.atlas;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.*;
import java.io.*;
import java.util.*;
import org.json.*;

/** Offline reader; the imported private pack never enters app progress backups or network APIs. */
public final class AtlasProductsActivity extends Activity {
  static final int PICK_PACK=31;
  LinearLayout page;
  AtlasPack pack;
  String project;
  float multiplier=1f;
  int fg, muted, panel, bg;
  File packFile;

  public void onCreate(Bundle state) {
    super.onCreate(state);
    bg=Color.rgb(16,28,41); panel=Color.rgb(27,43,60); fg=Color.rgb(245,239,228); muted=Color.rgb(173,189,199);
    getWindow().setStatusBarColor(bg); getWindow().setNavigationBarColor(bg);
    packFile=new File(getFilesDir(),"atlas-products-v1.zip");
    try { if(packFile.isFile() && packFile.length()<=AtlasPack.MAX_ZIP_BYTES) pack=AtlasPack.parse(read(packFile)); } catch(Exception ignored) { pack=null; }
    render();
  }
  int dp(float n){return Math.round(n*getResources().getDisplayMetrics().density);}
  LinearLayout column(){LinearLayout l=new LinearLayout(this);l.setOrientation(1);return l;}
  TextView text(LinearLayout p,String s,int size,boolean bold){
    TextView t=new TextView(this);t.setText(s);t.setTextColor(fg);t.setTextSize(size);
    t.setPadding(0,dp(5),0,dp(5));t.setLineSpacing(dp(3),1);if(bold)t.setTypeface(null,Typeface.BOLD);p.addView(t);return t;
  }
  void muted(LinearLayout p,String s){TextView t=text(p,s,14,false);t.setTextColor(muted);}
  LinearLayout card(LinearLayout p){
    LinearLayout c=column();c.setPadding(dp(16),dp(12),dp(16),dp(12));c.setBackgroundColor(panel);
    LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2);lp.setMargins(0,dp(7),0,dp(7));p.addView(c,lp);return c;
  }
  void button(LinearLayout p,String label,Runnable run){
    Button b=new Button(this);b.setText(label);b.setAllCaps(false);b.setTextColor(fg);b.setMinHeight(dp(48));b.setOnClickListener(v->run.run());p.addView(b,new LinearLayout.LayoutParams(-1,-2));
  }
  void render(){
    page=column();page.setBackgroundColor(bg);page.setPadding(dp(18),dp(12),dp(18),dp(20));
    ScrollView scroll=new ScrollView(this);scroll.addView(page);setContentView(scroll);
    text(page,"DNTL  /  PRODUCTOS ANALÍTICOS",13,true);
    text(page,"Atlas offline",27,true);
    muted(page,"Importa un pack JSON y verifica sus huellas internas. SHA-256 detecta corrupción, no autentica quién lo generó. El archivo permanece en este dispositivo; no se conecta al CRM ni se transmite.");
    button(page,"Importar pack Atlas (.zip)",this::pick);
    if(pack!=null)button(page,"Eliminar pack local",()->new AlertDialog.Builder(this)
        .setTitle("¿Eliminar este pack privado?")
        .setMessage("Se borrará únicamente el producto analítico guardado en esta app. Tus notas y progreso no cambiarán.")
        .setNegativeButton("Cancelar",null)
        .setPositiveButton("Eliminar",(d,w)->{packFile.delete();pack=null;project=null;render();})
        .show());
    if(pack==null){
      LinearLayout c=card(page);text(c,"Aún no hay un pack instalado",18,true);
      muted(c,"En tu PC genera y valida el ZIP privado desde analytics.comercial_proyecto_mes. Luego pásalo al teléfono e impórtalo aquí. Un archivo inválido no reemplaza ningún pack anterior.");
      return;
    }
    JSONObject provenance=pack.data.optJSONObject("provenance");
    String label=pack.data.optString("classification")+"  ·  "+pack.data.optString("label");
    LinearLayout meta=card(page);text(meta,label,17,true);
    muted(meta,"Corte: "+provenance.optString("as_of")+"  ·  Generado: "+provenance.optString("generated_at"));
    muted(meta,"Fuente: "+provenance.optString("source")+"  ·  Grano: proyecto / mes");
    muted(meta,"Historia retrospectiva revisada; no es lo conocido en tiempo real.");
    JSONArray rows=pack.data.optJSONArray("rows");
    TreeSet<String> projects=new TreeSet<>();
    for(int i=0;i<rows.length();i++)projects.add(rows.optJSONObject(i).optString("project"));
    String[] options=projects.toArray(new String[0]);
    if(project==null||!projects.contains(project))project=options[0];
    Spinner chooser=new Spinner(this);
    ArrayAdapter<String> adapter=new ArrayAdapter<String>(this,android.R.layout.simple_spinner_item,options);
    adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);chooser.setAdapter(adapter);
    chooser.setSelection(Arrays.asList(options).indexOf(project));page.addView(chooser);
    chooser.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener(){
      public void onNothingSelected(android.widget.AdapterView<?> v){}
      public void onItemSelected(android.widget.AdapterView<?> v,View view,int pos,long id){
        String next=options[pos];if(!next.equals(project)){project=next;render();}
      }});
    LinearLayout hist=card(page);text(hist,pack.story.optString("question"),19,true);
    muted(hist,"Mes completo · stock de apertura · ventas · stock al cierre");
    JSONArray series=projectRows();
    for(int i=Math.max(0,series.length()-12);i<series.length();i++){
      JSONObject r=series.optJSONObject(i);
      text(hist,r.optString("period").substring(0,7)+"    "+fmt(r.optDouble("sales"))+" ventas   ·   stock "+fmt(r.optDouble("stock_close")),14,false);
    }
    LinearLayout indicators=card(page);text(indicators,"Indicadores · último período",18,true);
    JSONArray items=pack.data.optJSONArray("indicators");
    for(int i=0;i<items.length();i++){JSONObject x=items.optJSONObject(i);if(x.optString("id").startsWith(project+"-"))
      muted(indicators,x.optString("name")+": "+fmt(x.optDouble("value"))+" "+x.optString("unit")+" · "+x.optString("period"));}

    JSONObject model=AtlasPack.find(pack.model.optJSONArray("results"),"project",project);
    LinearLayout mc=card(page);text(mc,"Modelo · media móvil de 3 meses",18,true);
    muted(mc,pack.model.optString("explanation"));
    JSONArray metrics=pack.model.optJSONArray("metrics");
    if(metrics!=null&&metrics.length()>0)muted(mc,"MAE temporal: "+fmt(metrics.optJSONObject(0).optDouble("value"))+" "+metrics.optJSONObject(0).optString("unit")+" · n="+metrics.optJSONObject(0).optInt("n"));
    muted(mc,"Predicción base para el siguiente mes: "+fmt(model.optDouble("prediction"))+" unidades · stock límite "+fmt(model.optDouble("stock")));
    muted(mc,"Incertidumbre: "+pack.model.optJSONObject("uncertainty").optString("status")+" · "+pack.model.optJSONObject("uncertainty").optString("explanation"));
    LinearLayout sc=card(page);text(sc,"Experimento de supuesto (no causal)",18,true);
    TextView value=text(sc,"Ritmo × "+fmt(multiplier),16,true);
    SeekBar control=new SeekBar(this);control.setMax(20);control.setProgress(Math.round((multiplier-.5f)*20));sc.addView(control);
    TextView result=text(sc,"",18,true);
    Runnable calculate=()->{
      double raw=model.optDouble("prediction")*multiplier;
      double predicted=Math.min(model.optDouble("stock"),raw);
      value.setText("Ritmo × "+String.format(Locale.ROOT,"%.2f",multiplier));
      result.setText("Resultado del escenario: "+fmt(predicted)+" unidades (base "+fmt(model.optDouble("prediction"))+")");
    }; calculate.run();
    control.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener(){
      public void onProgressChanged(SeekBar b,int p,boolean user){if(user){multiplier=.5f+p/20f;calculate.run();}}
      public void onStartTrackingTouch(SeekBar b){}
      public void onStopTrackingTouch(SeekBar b){}
    });
    muted(sc,"El multiplicador es un supuesto del usuario, no parámetro estimado ni intervalo de confianza.");
    JSONArray findings=pack.story.optJSONArray("findings");
    for(int i=0;i<findings.length();i++){JSONObject f=findings.optJSONObject(i);if(f.optString("id").startsWith(project+"-")){
      LinearLayout fc=card(page);text(fc,"Hallazgo",18,true);muted(fc,f.optString("statement"));
      JSONArray cannot=f.optJSONArray("cannot_conclude");if(cannot!=null)for(int j=0;j<cannot.length();j++)muted(fc,"No concluir: "+cannot.optString(j));
    }}
    LinearLayout story=card(page);text(story,"Qué aprendemos / qué no sabemos",18,true);
    muted(story,pack.story.optString("what_we_learned"));muted(story,pack.story.optString("what_we_do_not_know"));
    muted(story,pack.model.optJSONArray("limitations").toString());
    muted(page,"Pack ID: "+pack.manifest.optString("pack_id")+" · versión "+pack.manifest.optString("pack_version"));
  }
  JSONArray projectRows(){
    JSONArray rows=pack.data.optJSONArray("rows"),out=new JSONArray();
    for(int i=0;i<rows.length();i++){JSONObject r=rows.optJSONObject(i);if(project.equals(r.optString("project")))out.put(r);}
    ArrayList<JSONObject> sorted=new ArrayList<>();for(int i=0;i<out.length();i++)sorted.add(out.optJSONObject(i));
    sorted.sort((a,b)->a.optString("period").compareTo(b.optString("period")));
    JSONArray result=new JSONArray();for(JSONObject x:sorted)result.put(x);return result;
  }
  String fmt(double d){return String.format(Locale.ROOT,"%.2f",d);}
  void pick(){
    Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.setType("application/zip");i.addCategory(Intent.CATEGORY_OPENABLE);startActivityForResult(i,PICK_PACK);
  }
  static byte[] read(File f)throws Exception{try(InputStream in=new FileInputStream(f)){return read(in);}}
  static byte[] read(InputStream in)throws Exception{
    ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[8192];int n;
    while((n=in.read(b))!=-1){out.write(b,0,n);if(out.size()>AtlasPack.MAX_ZIP_BYTES)throw new Exception("Máximo 20 MB");}
    return out.toByteArray();
  }
  protected void onActivityResult(int req,int result,Intent data){
    super.onActivityResult(req,result,data);if(req!=PICK_PACK||result!=RESULT_OK||data==null||data.getData()==null)return;
    try{
      byte[] raw;try(InputStream in=getContentResolver().openInputStream(data.getData())){if(in==null)throw AtlasPack.bad();raw=read(in);}
      AtlasPack validated=AtlasPack.parse(raw);
      File tmp=new File(getFilesDir(),"atlas-products-v1.zip.tmp");
      try(FileOutputStream out=new FileOutputStream(tmp)){out.write(raw);out.getFD().sync();}
      if(!tmp.renameTo(packFile)){tmp.delete();throw new Exception("No se pudo sustituir el pack local");}
      pack=validated;project=null;multiplier=1f;render();
      Toast.makeText(this,"Pack validado e importado solo en este dispositivo",Toast.LENGTH_LONG).show();
    }catch(Exception e){Toast.makeText(this,"Importación rechazada; se conserva el pack anterior",Toast.LENGTH_LONG).show();}
  }
  public void onBackPressed(){finish();}
}