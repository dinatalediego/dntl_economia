package com.dinatale.economia.atlas;

import android.app.*;
import android.content.*;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.*;
import android.text.*;
import android.view.*;
import android.widget.*;
import java.io.*;
import java.util.*;
import org.json.*;

public class MainActivity extends Activity {
  Store store;
  JSONArray lessons = new JSONArray(), museum = new JSONArray();
  JSONObject atlas = new JSONObject();
  LinearLayout root, body, nav;
  String screen = "Inicio",
      intent = "Explorar",
      energy = "Sin indicar",
      mode = "Aplicar a mi trabajo";
  int minutes = 10;
  long background = 0;
  boolean boot = true, moodOpen = false, detail = false;
  int bg, fg, muted, panel, accent = Color.rgb(225, 170, 87);
  float font = 1;
  String level = "Mundo";
  MapView map;
  LinearLayout placePanel;
  JSONObject selected;
  byte[] pendingExport;
  final String[] intents = {
    "Explorar", "Entender algo", "Aplicarlo a mi vida", "Ponerme a prueba", "Sorpréndeme"
  };
  final String[] interests = {
    "Trabajo y carrera", "Negocios", "Vivienda", "Costo de vida", "Consumo"
  };

  public void onCreate(Bundle b) {
    super.onCreate(b);
    store = new Store(this);
    try {
      JSONObject cat = new JSONObject(asset("lessons.json"));
      JSONArray channels = cat.getJSONArray("channels");
      for (int i = 0; i < channels.length(); i++) {
        JSONObject ch = channels.getJSONObject(i);
        JSONArray items = ch.getJSONArray("items");
        for (int j = 0; j < items.length(); j++) {
          JSONObject item = items.getJSONObject(j);
          Store.put(item, "channel", ch.optString("title"));
          lessons.put(item);
        }
      }
      museum = new JSONArray(asset("museum.json"));
      atlas = new JSONObject(asset("atlas.json"));
    } catch (Exception e) {
      Toast.makeText(this, "No se pudo cargar parte del catálogo: " + e.getMessage(), 1).show();
    }
    minutes = Integer.parseInt(store.setting("minutes", "10"));
    mode = store.setting("mode", mode);
    if (b != null) {
      intent = b.getString("intent", "Explorar");
      minutes = b.getInt("minutes", minutes);
      mode = b.getString("mode", mode);
      energy = b.getString("energy", energy);
      screen = b.getString("screen", "Inicio");
      boot = false;
    }
    render();
  }

  protected void onSaveInstanceState(Bundle b) {
    super.onSaveInstanceState(b);
    b.putString("intent", intent);
    b.putString("energy", energy);
    b.putString("mode", mode);
    b.putInt("minutes", minutes);
    b.putString("screen", screen);
  }

  protected void onResume() {
    super.onResume();
    if ((boot || background > 0 && System.currentTimeMillis() - background >= 30 * 60 * 1000)
        && !moodOpen) {
      boot = false;
      if (store.setting("ask", "Sí").equals("Sí")) new Handler().post(this::mood);
    }
    background = 0;
  }

  protected void onStop() {
    super.onStop();
    if (!isChangingConfigurations()) background = System.currentTimeMillis();
  }

  String asset(String name) throws Exception {
    try (InputStream in = getAssets().open(name);
        ByteArrayOutputStream out = new ByteArrayOutputStream()) {
      byte[] b = new byte[8192];
      int n;
      while ((n = in.read(b)) != -1) out.write(b, 0, n);
      return out.toString("UTF-8");
    }
  }

  int dp(float n) {
    return Math.round(n * getResources().getDisplayMetrics().density);
  }

  void theme() {
    boolean dark = store.setting("theme", "Oscuro").equals("Oscuro");
    bg = Color.parseColor(dark ? "#101C29" : "#F5F2EA");
    panel = Color.parseColor(dark ? "#1B2B3C" : "#FFFFFF");
    fg = Color.parseColor(dark ? "#F5EFE4" : "#172B3A");
    muted = Color.parseColor(dark ? "#ADBDC7" : "#536575");
    font =
        store.setting("font", "Normal").equals("Grande")
            ? 1.15f
            : store.setting("font", "Normal").equals("Muy grande") ? 1.3f : 1;
    getWindow().setStatusBarColor(bg);
    getWindow().setNavigationBarColor(bg);
  }

  LinearLayout column() {
    LinearLayout l = new LinearLayout(this);
    l.setOrientation(1);
    return l;
  }

  TextView text(LinearLayout parent, String value, int size, int color) {
    TextView t = new TextView(this);
    t.setText(value);
    t.setTextSize(size * font);
    t.setTextColor(color);
    t.setPadding(0, dp(5), 0, dp(5));
    t.setLineSpacing(dp(3), 1);
    parent.addView(t);
    return t;
  }

  void title(LinearLayout p, String s) {
    TextView t = text(p, s, 25, fg);
    t.setTypeface(null, Typeface.BOLD);
  }

  void paragraph(LinearLayout p, String s) {
    text(p, s, 15, muted);
  }

  Button button(LinearLayout p, String label, Runnable action) {
    Button b = new Button(this);
    b.setText(label);
    b.setAllCaps(false);
    b.setTextColor(fg);
    b.setTextSize(14 * font);
    b.setMinHeight(dp(48));
    b.setBackgroundTintList(android.content.res.ColorStateList.valueOf(panel));
    p.addView(b, new LinearLayout.LayoutParams(-1, -2));
    b.setOnClickListener(v -> action.run());
    return b;
  }

  LinearLayout card(LinearLayout parent) {
    LinearLayout c = column();
    c.setPadding(dp(16), dp(12), dp(16), dp(12));
    GradientDrawable g = new GradientDrawable();
    g.setColor(panel);
    g.setCornerRadius(dp(18));
    c.setBackground(g);
    LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
    lp.setMargins(0, dp(8), 0, dp(8));
    parent.addView(c, lp);
    return c;
  }

  EditText input(LinearLayout p, String hint, String value) {
    EditText e = new EditText(this);
    e.setTextColor(fg);
    e.setHintTextColor(muted);
    e.setTextSize(16 * font);
    e.setHint(hint);
    e.setText(value);
    p.addView(e, new LinearLayout.LayoutParams(-1, -2));
    return e;
  }

  void open(String url) {
    try {
      Uri u = Uri.parse(url);
      if (!"https".equals(u.getScheme())) throw new Exception();
      startActivity(new Intent(Intent.ACTION_VIEW, u));
    } catch (Exception e) {
      toast("No se pudo abrir el enlace");
    }
  }

  void toast(String s) {
    Toast.makeText(this, s, Toast.LENGTH_LONG).show();
  }

  void render() {
    detail = false;
    placePanel = null;
    theme();
    root = column();
    root.setBackgroundColor(bg);
    root.setPadding(dp(16), dp(8), dp(16), 0);
    root.setOnApplyWindowInsetsListener(
        (v, insets) -> {
          v.setPadding(
              dp(16),
              insets.getSystemWindowInsetTop() + dp(8),
              dp(16),
              insets.getSystemWindowInsetBottom());
          return insets;
        });
    setContentView(root);
    LinearLayout header = new LinearLayout(this);
    header.setGravity(Gravity.CENTER_VERTICAL);
    TextView brand = new TextView(this);
    brand.setText("DNTL  /  ECONOMÍA");
    brand.setTextSize(13);
    brand.setTextColor(accent);
    brand.setTypeface(null, 1);
    header.addView(brand, new LinearLayout.LayoutParams(0, dp(48), 1));
    Button settings = new Button(this);
    settings.setText("Ajustes");
    settings.setAllCaps(false);
    header.addView(settings);
    settings.setOnClickListener(
        v -> {
          screen = "Ajustes";
          render();
        });
    root.addView(header);
    ScrollView scroll = new ScrollView(this);
    scroll.setFillViewport(true);
    body = column();
    body.setPadding(0, dp(8), 0, dp(16));
    scroll.addView(body);
    root.addView(scroll, new LinearLayout.LayoutParams(-1, 0, 1));
    HorizontalScrollView hs = new HorizontalScrollView(this);
    hs.setHorizontalScrollBarEnabled(false);
    nav = new LinearLayout(this);
    for (String tab : new String[] {"Inicio", "Aprender", "Museo", "Atlas", "Progreso", "Productos"}) {
      Button b = new Button(this);
      b.setAllCaps(false);
      b.setText(tab);
      b.setTextColor(tab.equals(screen) ? accent : fg);
      b.setBackgroundTintList(android.content.res.ColorStateList.valueOf(bg));
      nav.addView(b);
      b.setOnClickListener(
          v -> {
            if (tab.equals("Productos")) {
              startActivity(new Intent(this, AtlasProductsActivity.class));
              return;
            }
            screen = tab;
            selected = null;
            render();
          });
    }
    hs.addView(nav);
    root.addView(hs);
    switch (screen) {
      case "Aprender":
        catalog();
        break;
      case "Museo":
        museum();
        break;
      case "Atlas":
        atlas();
        break;
      case "Progreso":
        progress();
        break;
      case "Ajustes":
        settings();
        break;
      default:
        home();
    }
  }

  void home() {
    paragraph(body, "TU ESPACIO PARA ENTENDER Y DECIDIR");
    title(body, "La economía,\nmás cerca de ti.");
    paragraph(body, "Explora una idea. Conéctala con tu presente.");
    LinearLayout c = card(body);
    text(c, intent + " · " + minutes + " min", 20, fg);
    paragraph(c, mode + " · Energía: " + energy);
    button(c, "Cambiar mi intención", this::mood);
    if (intent.equals("Ponerme a prueba")) {
      challenge();
      return;
    }
    ArrayList<JSONObject> list = new ArrayList<>();
    for (int i = 0; i < lessons.length(); i++) {
      JSONObject x = lessons.optJSONObject(i);
      if (!store.obj("stages").optString(x.optString("id")).equals("Lo apliqué")) list.add(x);
    }
    if (intent.equals("Sorpréndeme")) Collections.shuffle(list);
    else list.sort((a, b) -> score(b) - score(a));
    text(body, "Una experiencia para este momento", 18, fg);
    for (int i = 0; i < Math.min(3, list.size()); i++) {
      JSONObject x = list.get(i);
      LinearLayout a = card(body);
      text(a, x.optString("title"), 18, fg);
      paragraph(
          a,
          (minutes <= 3 ? "Lectura breve y una pregunta" : "Lectura, reflexión y aplicación")
              + " · "
              + minutes
              + " min sugeridos");
      paragraph(
          a,
          "Por qué aparece: "
              + reason(x)
              + ". El tiempo corresponde a esta actividad; el recurso completo puede durar más.");
      button(a, "Empezar", () -> lesson(x));
    }
    button(
        body,
        "Explorar el Atlas",
        () -> {
          screen = "Atlas";
          render();
        });
    button(body, "Laboratorio de diferencias en diferencias", this::did);
    button(body, "Reto opcional de economía", this::challenge);
  }

  int score(JSONObject x) {
    String s =
        (x.optString("title") + " " + x.optString("application") + " " + x.optString("channel"))
            .toLowerCase(Locale.ROOT);
    int score = 0;
    String prefs = store.setting("interests", "Trabajo y carrera,Negocios,Vivienda");
    if (prefs.contains("Vivienda")
        && (s.contains("inmobili") || s.contains("pricing") || s.contains("absorción"))) score += 4;
    if (prefs.contains("Negocios")
        && (s.contains("precio") || s.contains("demanda") || s.contains("estrateg"))) score += 3;
    if (prefs.contains("Trabajo")
        && (s.contains("causal") || s.contains("datos") || s.contains("productividad"))) score += 3;
    if ((prefs.contains("Consumo") || prefs.contains("Costo"))
        && (s.contains("precio") || s.contains("riesgo"))) score += 3;
    if (mode.equals("Economía cotidiana") && (s.contains("precio") || s.contains("decisi")))
      score += 2;
    if (intent.equals("Entender algo") && x.optString("level").equals("Fundamental")) score += 3;
    if (energy.equals("Baja") && x.optString("level").equals("Fundamental")) score += 2;
    if (intent.equals("Aplicarlo a mi vida") && !x.optString("application").isEmpty()) score += 2;
    return score;
  }

  String reason(JSONObject x) {
    return intent.equals("Sorpréndeme")
        ? "selección al azar entre temas que aún no marcaste como aplicados"
        : "prioriza tus intereses, el modo «" + mode + "» y tu intención «" + intent + "»";
  }

  Spinner choose(LinearLayout p, String label, String[] values, String current) {
    paragraph(p, label);
    Spinner s = new Spinner(this);
    ArrayAdapter<String> a =
        new ArrayAdapter<String>(this, android.R.layout.simple_spinner_item, values) {
          public View getView(int n, View v, android.view.ViewGroup g) {
            TextView t = (TextView) super.getView(n, v, g);
            t.setTextColor(fg);
            t.setTextSize(16 * font);
            t.setPadding(dp(8), dp(12), dp(8), dp(12));
            return t;
          }
        };
    a.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
    s.setAdapter(a);
    s.setSelection(Math.max(0, Arrays.asList(values).indexOf(current)));
    p.addView(s);
    return s;
  }

  void mood() {
    if (moodOpen) return;
    moodOpen = true;
    LinearLayout c = column();
    c.setPadding(dp(22), dp(12), dp(22), dp(12));
    c.setBackgroundColor(bg);
    title(c, "¿Con qué intención vienes?");
    paragraph(c, "Una pausa para elegir qué necesitas hoy.");
    Spinner in = choose(c, "Hoy quiero…", intents, intent),
        time = choose(c, "Tiempo disponible", new String[] {"1", "3", "10", "20"}, "" + minutes),
        en =
            choose(
                c,
                "Energía · opcional",
                new String[] {"Sin indicar", "Baja", "Media", "Alta"},
                energy),
        mo =
            choose(c, "Enfoque", new String[] {"Aplicar a mi trabajo", "Economía cotidiana"}, mode);
    ScrollView scroll = new ScrollView(this);
    scroll.addView(c);
    AlertDialog dialog =
        new AlertDialog.Builder(this)
            .setView(scroll)
            .setPositiveButton(
                "Comenzar",
                (d, w) -> {
                  intent = in.getSelectedItem().toString();
                  energy = en.getSelectedItem().toString();
                  mode = mo.getSelectedItem().toString();
                  minutes = Integer.parseInt(time.getSelectedItem().toString());
                  JSONArray sessions = store.state.optJSONArray("sessions");
                  if (sessions == null) sessions = new JSONArray();
                  JSONObject event = new JSONObject();
                  Store.put(event, "at", System.currentTimeMillis());
                  Store.put(event, "intent", intent);
                  Store.put(event, "minutes", minutes);
                  sessions.put(event);
                  if (sessions.length() > 100) {
                    JSONArray last = new JSONArray();
                    for (int i = sessions.length() - 100; i < sessions.length(); i++)
                      last.put(sessions.opt(i));
                    sessions = last;
                  }
                  Store.put(store.state, "sessions", sessions);
                  store.save();
                  screen = "Inicio";
                  render();
                })
            .setNegativeButton("Saltar", (d, w) -> {})
            .create();
    dialog.setOnDismissListener(d -> moodOpen = false);
    dialog.show();
  }

  void catalog() {
    title(body, "Aprender");
    paragraph(body, "Ideas para tu trabajo y tu economía cotidiana. Contenido educativo.");
    EditText search = input(body, "Buscar tema…", "");
    LinearLayout results = column();
    body.addView(results);
    Runnable draw =
        () -> {
          results.removeAllViews();
          String query = search.getText().toString().toLowerCase(Locale.ROOT);
          for (int i = 0; i < lessons.length(); i++) {
            JSONObject x = lessons.optJSONObject(i);
            if (!(x.optString("title") + x.optString("channel"))
                .toLowerCase(Locale.ROOT)
                .contains(query)) continue;
            LinearLayout c = card(results);
            text(c, x.optString("title"), 18, fg);
            paragraph(
                c, x.optString("channel") + " · Recurso completo: " + x.optString("duration"));
            button(c, "Abrir idea", () -> lesson(x));
          }
        };
    watch(search, draw);
    draw.run();
  }

  void watch(EditText e, Runnable r) {
    e.addTextChangedListener(
        new TextWatcher() {
          public void beforeTextChanged(CharSequence s, int a, int c, int f) {}

          public void onTextChanged(CharSequence s, int st, int b, int c) {
            r.run();
          }

          public void afterTextChanged(Editable e) {}
        });
  }

  void detailBase(String title) {
    detail = true;
    body.removeAllViews();
    button(body, "← Volver", this::render);
    title(body, title);
  }

  void lesson(JSONObject x) {
    String id = x.optString("id");
    store.visit(id);
    detailBase(x.optString("title"));
    paragraph(body, "EDUCACIÓN · " + x.optString("level") + " · " + x.optString("author"));
    paragraph(body, x.optString("summary"));
    JSONArray paras = x.optJSONArray("body");
    if (paras != null) for (int i = 0; i < paras.length(); i++) paragraph(body, paras.optString(i));
    LinearLayout c = card(body);
    text(c, mode, 18, fg);
    paragraph(
        c,
        mode.equals("Aplicar a mi trabajo")
            ? x.optString("application")
            : "Relaciona esta idea con una compra, tu presupuesto, vivienda o una decisión sobre tu"
                + " tiempo.");
    paragraph(
        c,
        "Tu actividad de "
            + minutes
            + " min: "
            + (minutes == 1
                ? "escribe la idea en una frase."
                : minutes == 3
                    ? "explica la idea con un ejemplo cercano."
                    : minutes == 10
                        ? "propón una aplicación y qué evidencia necesitarías."
                        : "compara dos decisiones, sus costos y la evidencia que podría cambiar tu"
                            + " elección."));
    paragraph(c, x.optString("challenge"));
    String url = x.optString("sourceUrl");
    if (url.startsWith("https://"))
      button(body, "Fuente / recurso completo (" + x.optString("duration") + ")", () -> open(url));
    evidence(id);
  }

  void evidence(String id) {
    text(body, "Tu evidencia", 18, fg);
    paragraph(
        body,
        "Explorar no equivale a dominar. Explicar y aplicar requieren que guardes tu propia nota;"
            + " son una autoevaluación.");
    EditText note =
        input(
            body,
            "Explica con tus palabras o registra lo que aplicaste…",
            store.obj("notes").optString(id));
    note.setMinLines(3);
    note.setGravity(Gravity.TOP);
    note.setFilters(new InputFilter[] {new InputFilter.LengthFilter(50000)});
    button(
        body,
        "Guardar nota",
        () -> {
          store.note(id, note.getText().toString());
          toast("Nota guardada en este dispositivo");
        });
    paragraph(body, "Estado: " + store.obj("stages").optString(id, "Explorado"));
    for (String st : new String[] {"Guardado", "Puedo explicarlo", "Lo apliqué"})
      button(
          body,
          st,
          () -> {
            String n = note.getText().toString().trim();
            if (!st.equals("Guardado") && n.isEmpty()) {
              toast("Añade una explicación o evidencia antes de marcar esta etapa");
              return;
            }
            store.note(id, n);
            store.stage(id, st);
            toast("Registrado: " + st);
          });
  }

  void museum() {
    title(body, "Museo Nobel");
    paragraph(body, "Catálogo 1995–2025 · conexiones entre disciplinas.");
    EditText query = input(body, "Buscar nombre, área o año…", "");
    LinearLayout list = column();
    body.addView(list);
    Runnable draw =
        () -> {
          list.removeAllViews();
          String q = query.getText().toString().toLowerCase(Locale.ROOT);
          for (int i = 0; i < museum.length(); i++) {
            JSONObject x = museum.optJSONObject(i);
            if (!(x.optString("area") + x.optString("year") + x.optString("laureates"))
                .toLowerCase(Locale.ROOT)
                .contains(q)) continue;
            button(
                list,
                x.optString("year") + " · " + x.optString("area") + "\n" + x.optString("laureates"),
                () -> {
                  String id = "nobel:" + x.optString("area") + ":" + x.optString("year");
                  store.visit(id);
                  detailBase(x.optString("laureates"));
                  paragraph(body, x.optString("area") + " · " + x.optString("year"));
                  paragraph(body, x.optString("model_lens"));
                  paragraph(
                      body,
                      "Motivación oficial (idioma original): "
                          + x.optString("official_motivation_en"));
                  button(body, "Fuente oficial", () -> open(x.optString("official_source")));
                  evidence(id);
                });
          }
        };
    watch(query, draw);
    draw.run();
  }

  void challenge() {
    detailBase("Pon una idea a prueba");
    paragraph(
        body,
        "Ejemplo hipotético: subes el precio 10 % y la cantidad vendida cae 5 %. ¿Cómo cambia el"
            + " ingreso total?");
    for (String choice : new String[] {"Sube 5 %", "Sube 4,5 %", "Baja 5 %"})
      button(
          body,
          choice,
          () ->
              new AlertDialog.Builder(this)
                  .setTitle(choice.equals("Sube 4,5 %") ? "Correcto" : "Prueba este razonamiento")
                  .setMessage(
                      "Ingreso = precio × cantidad. 1,10 × 0,95 = 1,045: sube 4,5 %. Eso no"
                          + " determina el beneficio; faltan los costos.\n\n"
                          + "Este reto no marca automáticamente un tema como dominado.")
                  .setPositiveButton("Entendido", null)
                  .show());
    evidence("challenge:elasticity");
  }

  void did() {
    detailBase("Laboratorio causal · DiD");
    paragraph(
        body,
        "Ejemplo educativo. Compara cambios en un grupo tratado y uno de control. No demuestra"
            + " causalidad sin supuestos, como tendencias paralelas y ausencia de shocks"
            + " diferenciales.");
    EditText ta = input(body, "Tratado antes", "20"),
        tb = input(body, "Tratado después", "30"),
        ca = input(body, "Control antes", "18"),
        cb = input(body, "Control después", "23");
    for (EditText e : new EditText[] {ta, tb, ca, cb}) e.setInputType(8194 | 4096);
    TextView out = text(body, "", 20, fg);
    button(
        body,
        "Calcular",
        () -> {
          try {
            double a = Double.parseDouble(ta.getText().toString()),
                b = Double.parseDouble(tb.getText().toString()),
                c = Double.parseDouble(ca.getText().toString()),
                d = Double.parseDouble(cb.getText().toString());
            double effect = (b - a) - (d - c);
            if (!Double.isFinite(effect)) throw new Exception();
            out.setText(
                String.format(
                    Locale.getDefault(),
                    "DiD = %.2f\n(Tratado después − antes) − (Control después − antes)",
                    effect));
          } catch (Exception e) {
            toast("Introduce cuatro números válidos");
          }
        });
    evidence("lab:did");
  }

  void settings() {
    title(body, "Ajustes");
    paragraph(body, "Tus preferencias se guardan solo en este dispositivo.");
    Spinner
        th =
            choose(
                body,
                "Apariencia",
                new String[] {"Oscuro", "Claro"},
                store.setting("theme", "Oscuro")),
        fo =
            choose(
                body,
                "Tamaño de letra",
                new String[] {"Normal", "Grande", "Muy grande"},
                store.setting("font", "Normal")),
        ask =
            choose(
                body,
                "Preguntar intención al iniciar sesión",
                new String[] {"Sí", "No"},
                store.setting("ask", "Sí")),
        ti =
            choose(
                body,
                "Tiempo habitual (minutos)",
                new String[] {"1", "3", "10", "20"},
                store.setting("minutes", "10")),
        mo =
            choose(
                body,
                "Modo habitual",
                new String[] {"Aplicar a mi trabajo", "Economía cotidiana"},
                store.setting("mode", mode));
    paragraph(
        body,
        "Una sesión nueva comienza al abrir la app o después de 30 minutos en segundo plano."
            + " Navegar entre pantallas no repite la pregunta.");
    text(body, "Intereses", 18, fg);
    ArrayList<CheckBox> checks = new ArrayList<>();
    for (String interest : interests) {
      CheckBox c = new CheckBox(this);
      c.setText(interest);
      c.setTextColor(fg);
      c.setChecked(
          store.setting("interests", "Trabajo y carrera,Negocios,Vivienda").contains(interest));
      body.addView(c);
      checks.add(c);
    }
    button(
        body,
        "Guardar preferencias",
        () -> {
          store.setSetting("theme", th.getSelectedItem().toString());
          store.setSetting("font", fo.getSelectedItem().toString());
          store.setSetting("ask", ask.getSelectedItem().toString());
          store.setSetting("minutes", ti.getSelectedItem().toString());
          mode = mo.getSelectedItem().toString();
          store.setSetting("mode", mode);
          StringJoiner sj = new StringJoiner(",");
          for (CheckBox c : checks) if (c.isChecked()) sj.add(c.getText());
          store.setSetting("interests", sj.toString());
          render();
          toast("Preferencias guardadas");
        });
    text(body, "Tus datos", 20, fg);
    paragraph(
        body,
        "Exporta notas, etapas, historial y preferencias. Al importar se agregan los registros que"
            + " faltan; tus notas y etapas existentes tienen prioridad. Las preferencias se"
            + " restauran desde el archivo.");
    button(
        body,
        "Exportar respaldo JSON",
        () -> {
          try {
            pendingExport = store.backup();
            Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            i.setType("application/json");
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.putExtra(Intent.EXTRA_TITLE, "dntl-atlas-respaldo.json");
            startActivityForResult(i, 10);
          } catch (Exception e) {
            toast(e.getMessage());
          }
        });
    button(
        body,
        "Importar respaldo JSON",
        () -> {
          Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
          i.setType("*/*");
          i.addCategory(Intent.CATEGORY_OPENABLE);
          startActivityForResult(i, 11);
        });
    button(
        body,
        "Borrar historial de exploración",
        () ->
            new AlertDialog.Builder(this)
                .setTitle("¿Borrar historial?")
                .setMessage(
                    "Se borrarán las visitas y sesiones. Se conservarán notas, etapas y"
                        + " preferencias.")
                .setNegativeButton("Cancelar", null)
                .setPositiveButton(
                    "Borrar historial",
                    (d, w) -> {
                      store.clearHistory();
                      toast("Historial borrado");
                    })
                .show());
    paragraph(
        body,
        "DNTL Economía · Atlas 0.3.0\n"
            + "Edición independiente de la app 0.1.0. Las notas de aquella app no se migran"
            + " automáticamente.\n"
            + "Contenido y mapas disponibles sin conexión. Los enlaces externos requieren internet."
            + " Los datos no son una transmisión en vivo.");
  }

  protected void onActivityResult(int req, int result, Intent data) {
    super.onActivityResult(req, result, data);
    if (result != RESULT_OK || data == null || data.getData() == null) return;
    try {
      if (req == 10) {
        if (pendingExport == null) throw new Exception("Repite la exportación");
        try (OutputStream out = getContentResolver().openOutputStream(data.getData(), "wt")) {
          if (out == null) throw new Exception("No se pudo escribir");
          out.write(pendingExport);
        }
        pendingExport = null;
        toast("Respaldo exportado");
      } else if (req == 11) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (InputStream in = getContentResolver().openInputStream(data.getData())) {
          if (in == null) throw new Exception("Archivo no disponible");
          byte[] b = new byte[8192];
          int n;
          while ((n = in.read(b)) != -1) {
            out.write(b, 0, n);
            if (out.size() > Store.MAX_BYTES) throw new Exception("Máximo 2 MB");
          }
        }
        JSONObject imported = Store.validate(out.toByteArray());
        JSONObject notes = imported.optJSONObject("notes");
        new AlertDialog.Builder(this)
            .setTitle("Confirmar importación")
            .setMessage(
                "Notas en el respaldo: "
                    + (notes == null ? 0 : notes.length())
                    + ". Se conservarán tus notas y etapas actuales si hay coincidencias. Las"
                    + " preferencias se restaurarán.")
            .setNegativeButton("Cancelar", null)
            .setPositiveButton(
                "Importar",
                (d, w) -> {
                  store.merge(imported);
                  mode = store.setting("mode", mode);
                  minutes = Integer.parseInt(store.setting("minutes", "10"));
                  render();
                  toast("Respaldo importado");
                })
            .show();
      }
    } catch (Exception e) {
      toast("No se pudo completar: " + e.getMessage());
    }
  }

  String name(String id) {
    for (int i = 0; i < lessons.length(); i++) {
      JSONObject x = lessons.optJSONObject(i);
      if (id.equals(x.optString("id"))) return x.optString("title");
    }
    for (String lvl : new String[] {"Mundo", "Perú", "Lima"}) {
      JSONArray a = atlas.optJSONArray(lvl);
      if (a != null)
        for (int i = 0; i < a.length(); i++) {
          JSONObject p = a.optJSONObject(i);
          if (id.equals("place:" + p.optString("id"))) return p.optString("name");
        }
    }
    return id;
  }

  void progress() {
    title(body, "Tu progreso real");
    JSONObject stages = store.obj("stages"),
        visited = store.obj("explored"),
        notes = store.obj("notes");
    int explained = 0, applied = 0;
    Iterator<String> it = stages.keys();
    while (it.hasNext()) {
      String st = stages.optString(it.next());
      if (st.equals("Puedo explicarlo")) explained++;
      if (st.equals("Lo apliqué")) applied++;
    }
    text(
        body,
        visited.length()
            + " explorados  ·  "
            + explained
            + " explicados  ·  "
            + applied
            + " aplicados",
        18,
        fg);
    paragraph(
        body,
        "Las etapas reflejan tu autoevaluación acompañada de notas. Abrir una pantalla solo"
            + " registra exploración.");
    TreeSet<String> all = new TreeSet<>();
    for (JSONObject obj : new JSONObject[] {stages, visited, notes}) {
      Iterator<String> k = obj.keys();
      while (k.hasNext()) all.add(k.next());
    }
    if (all.isEmpty())
      paragraph(
          body,
          "Tu recorrido empieza con una idea. Explora un tema y guarda lo que te resulte útil.");
    for (String id : all) {
      LinearLayout c = card(body);
      text(c, name(id), 17, fg);
      paragraph(c, stages.optString(id, "Explorado"));
      String n = notes.optString(id);
      if (!n.isEmpty()) paragraph(c, n.length() > 180 ? n.substring(0, 180) + "…" : n);
      button(
          c,
          "Abrir / editar nota",
          () -> {
            for (int i = 0; i < lessons.length(); i++) {
              JSONObject x = lessons.optJSONObject(i);
              if (id.equals(x.optString("id"))) {
                lesson(x);
                return;
              }
            }
            detailBase(name(id));
            evidence(id);
          });
    }
  }

  void atlas() {
    title(body, "Atlas económico");
    paragraph(
        body, "Del mundo a tu distrito. Aprende a formular mejores preguntas sobre tu entorno.");
    LinearLayout row = new LinearLayout(this);
    body.addView(row);
    for (String l : new String[] {"Mundo", "Perú", "Lima"}) {
      Button b = new Button(this);
      b.setText(l);
      b.setAllCaps(false);
      row.addView(b, new LinearLayout.LayoutParams(0, -2, 1));
      b.setOnClickListener(
          v -> {
            level = l;
            selected = null;
            render();
          });
    }
    JSONArray places = atlas.optJSONArray(level);
    if (places == null) {
      paragraph(body, "Mapa no disponible");
      return;
    }
    paragraph(
        body,
        level.equals("Lima")
            ? "Lima Metropolitana y Callao · distritos"
            : level.equals("Perú")
                ? "Perú · departamentos y Callao"
                : "Mundo · países y territorios");
    map =
        new MapView(
            this,
            places,
            p -> {
              selected = p;
              showPlace(p);
            });
    body.addView(map, new LinearLayout.LayoutParams(-1, dp(270)));
    LinearLayout controls = new LinearLayout(this);
    body.addView(controls);
    for (String op : new String[] {"−", "+", "Restablecer"}) {
      Button b = new Button(this);
      b.setText(op);
      b.setContentDescription(
          op.equals("+") ? "Acercar mapa" : op.equals("−") ? "Alejar mapa" : "Restablecer mapa");
      controls.addView(b, new LinearLayout.LayoutParams(0, -2, 1));
      b.setOnClickListener(
          v -> {
            if (op.equals("Restablecer")) map.bounds(null);
            else {
              map.zoom = Math.max(1, Math.min(45, map.zoom * (op.equals("+") ? 1.5f : 1 / 1.5f)));
              map.invalidate();
            }
          });
    }
    if (level.equals("Lima")) {
      for (String district : new String[] {"Jesús María", "Miraflores", "San Isidro", "Surquillo"})
        button(
            body,
            "⌖ " + district,
            () -> {
              for (int i = 0; i < places.length(); i++) {
                JSONObject p = places.optJSONObject(i);
                if (normalize(p.optString("name")).equals(normalize(district))) {
                  selected = p;
                  map.selected = p.optString("id");
                  map.bounds(p);
                  showPlace(p);
                  break;
                }
              }
            });
    }
    EditText query = input(body, "Buscar y seleccionar lugar…", "");
    Spinner picker = new Spinner(this);
    body.addView(picker);
    ArrayList<JSONObject> matches = new ArrayList<>();
    Runnable filter =
        () -> {
          matches.clear();
          ArrayList<String> names = new ArrayList<>();
          names.add("Selecciona un lugar");
          for (int i = 0; i < places.length(); i++) {
            JSONObject p = places.optJSONObject(i);
            if (normalize(p.optString("name")).contains(normalize(query.getText().toString()))) {
              matches.add(p);
              names.add(p.optString("name"));
            }
          }
          ArrayAdapter<String> adapter =
              new ArrayAdapter<String>(this, android.R.layout.simple_spinner_item, names) {
                public View getView(int n, View v, android.view.ViewGroup g) {
                  TextView t = (TextView) super.getView(n, v, g);
                  t.setTextColor(fg);
                  t.setPadding(0, dp(14), 0, dp(14));
                  return t;
                }
              };
          adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
          picker.setAdapter(adapter);
        };
    filter.run();
    watch(query, filter);
    picker.setOnItemSelectedListener(
        new android.widget.AdapterView.OnItemSelectedListener() {
          public void onNothingSelected(android.widget.AdapterView<?> a) {}

          public void onItemSelected(android.widget.AdapterView<?> a, View v, int pos, long id) {
            if (pos > 0 && pos <= matches.size()) {
              selected = matches.get(pos - 1);
              map.selected = selected.optString("id");
              map.bounds(selected);
              showPlace(selected);
            }
          }
        });
    placePanel = column();
    body.addView(placePanel);
    if (selected != null) showPlace(selected);
    else
      paragraph(
          placePanel,
          "Toca una región o selecciónala en la lista. Puedes ampliar y desplazar el mapa.");
    paragraph(
        body,
        "Cartografía de referencia: Natural Earth (mundo); copia comunitaria de límites INEI 2023"
            + " (Perú/Lima). Simplificada, no catastral. Consulta: 9 oct 2026.");
    button(
        body,
        "Fuente cartográfica Perú",
        () -> open("https://github.com/axelrogg/peru-maps-geojson"));
  }

  String normalize(String s) {
    return java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD)
        .replaceAll("\\p{M}", "")
        .toLowerCase(Locale.ROOT);
  }

  void showPlace(JSONObject p) {
    if (placePanel == null) return;
    placePanel.removeAllViews();
    String id = "place:" + p.optString("id");
    store.visit(id);
    title(placePanel, p.optString("name"));
    LinearLayout edu = card(placePanel);
    text(edu, "APRENDER · contenido educativo", 17, accent);
    paragraph(
        edu,
        level.equals("Mundo")
            ? "El comercio, las tasas de interés y los precios internacionales pueden transmitirse"
                + " a costos, empleo y poder de compra. La exposición depende del sector y del"
                + " hogar."
            : level.equals("Perú")
                ? "La especialización productiva, conectividad y empleo ayudan a entender por qué"
                    + " los cambios nacionales se sienten de forma distinta en cada departamento."
                : "La vivienda se relaciona con acceso al empleo, transporte, servicios y oferta de"
                    + " suelo. Un precio promedio no describe todos los inmuebles ni todos los"
                    + " hogares.");
    paragraph(
        edu,
        mode.equals("Aplicar a mi trabajo")
            ? "Aplicar a mi trabajo: ¿qué indicador de esta zona podría anticipar cambios en"
                + " demanda, absorción o costos? Define unidad, período y una comparación válida."
            : "Economía cotidiana: compara vivienda, transporte, alimentación y tiempo de viaje."
                + " ¿Qué cambiaría en tu presupuesto y qué datos te faltan?");
    LinearLayout data = card(placePanel);
    text(data, "DATOS · período y fuente", 17, accent);
    JSONArray indicators = p.optJSONArray("indicators");
    if (indicators == null || indicators.length() == 0)
      paragraph(
          data,
          "Sin indicadores locales incorporados para este lugar. No se sustituyen con cifras"
              + " nacionales ni se inventan valores.");
    else
      for (int i = 0; i < indicators.length(); i++) {
        JSONObject d = indicators.optJSONObject(i);
        paragraph(
            data,
            d.optString("label")
                + ": "
                + d.optString("value")
                + " % · "
                + d.optString("year")
                + "\nBanco Mundial / WDI · descargado 9 oct 2026. Serie revisable.");
        button(data, "Fuente: " + d.optString("code"), () -> open(d.optString("url")));
      }
    button(data, "Consultar INEI", () -> open("https://www.inei.gob.pe/"));
    button(
        data,
        "Consultar BCRP",
        () -> open("https://estadisticas.bcrp.gob.pe/estadisticas/series/"));
    LinearLayout news = card(placePanel);
    text(news, "ACTUALIDAD · selección fechada", 17, accent);
    paragraph(
        news,
        "Perú · 26 enero 2026 · Banco Mundial\n"
            + "El organismo anunció respaldo a reformas de gestión fiscal y productividad."
            + " Pregunta: ¿por qué mejores servicios públicos o mayor competencia podrían importar"
            + " para hogares y empresas?\n"
            + "Alcance nacional; no constituye una medición del distrito seleccionado. Selección"
            + " editorial, no noticias en vivo.");
    button(
        news,
        "Leer noticia y fuente",
        () ->
            open(
                "https://www.bancomundial.org/es/news/press-release/2026/01/26/banco-mundial-respalda-reformas-fortalecer-la-gestion-fiscal-y-construir-una-economia-mas-productiva-peru"));
    button(
        placePanel,
        "Anotar sobre este lugar",
        () -> {
          detailBase(p.optString("name"));
          evidence(id);
        });
  }

  public void onBackPressed() {
    if (detail) {
      render();
      return;
    }
    if (!screen.equals("Inicio")) {
      screen = "Inicio";
      render();
    } else super.onBackPressed();
  }
}
