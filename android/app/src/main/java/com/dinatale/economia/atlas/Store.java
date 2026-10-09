package com.dinatale.economia.atlas;

import android.content.*;
import java.util.*;
import org.json.*;

/** Local state with versioned, bounded backup and non-destructive merge. */
final class Store {
  static final int MAX_BYTES = 2_000_000;
  final SharedPreferences prefs;
  JSONObject state;

  Store(Context c) {
    prefs = c.getSharedPreferences("atlas_v2", 0);
    try {
      state = new JSONObject(prefs.getString("state", "{}"));
    } catch (Exception e) {
      state = new JSONObject();
    }
  }

  JSONObject obj(String key) {
    JSONObject o = state.optJSONObject(key);
    if (o == null) {
      o = new JSONObject();
      put(state, key, o);
    }
    return o;
  }

  static void put(JSONObject o, String k, Object v) {
    try {
      o.put(k, v);
    } catch (JSONException e) {
      throw new IllegalArgumentException(e);
    }
  }

  void save() {
    prefs.edit().putString("state", state.toString()).apply();
  }

  String setting(String k, String fallback) {
    return obj("settings").optString(k, fallback);
  }

  void setSetting(String k, String v) {
    put(obj("settings"), k, v);
    save();
  }

  void visit(String id) {
    put(obj("explored"), id, System.currentTimeMillis());
    save();
  }

  void note(String id, String v) {
    put(obj("notes"), id, v);
    save();
  }

  void stage(String id, String v) {
    put(obj("stages"), id, v);
    save();
  }

  void clearHistory() {
    put(state, "explored", new JSONObject());
    put(state, "sessions", new JSONArray());
    save();
  }

  byte[] backup() throws Exception {
    JSONObject o = new JSONObject();
    put(o, "app", "dntl-economia-atlas");
    put(o, "schema", 1);
    put(
        o,
        "exportedAt",
        new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.ROOT).format(new Date()));
    put(o, "data", state);
    byte[] b = o.toString(2).getBytes("UTF-8");
    if (b.length > MAX_BYTES) throw new Exception("El respaldo supera 2 MB");
    return b;
  }

  static JSONObject validate(byte[] bytes) throws Exception {
    if (bytes.length > MAX_BYTES) throw new Exception("Máximo 2 MB");
    JSONObject root = new JSONObject(new String(bytes, "UTF-8"));
    if (!root.optString("app").equals("dntl-economia-atlas") || root.optInt("schema") != 1)
      throw new Exception("Formato o versión no compatible");
    JSONObject data = root.getJSONObject("data");
    for (String type : new String[] {"notes", "stages", "explored"}) {
      JSONObject map = data.optJSONObject(type);
      if (map == null) continue;
      if (map.length() > 5000) throw new Exception("Demasiados registros");
      Iterator<String> keys = map.keys();
      while (keys.hasNext()) {
        String k = keys.next();
        if (k.length() > 200) throw new Exception("Identificador inválido");
        Object v = map.get(k);
        if (type.equals("notes") && (!(v instanceof String) || ((String) v).length() > 50000))
          throw new Exception("Nota inválida");
        if (type.equals("stages")
            && !Arrays.asList("Guardado", "Puedo explicarlo", "Lo apliqué").contains(v))
          throw new Exception("Etapa inválida");
        if (type.equals("explored") && !(v instanceof Number))
          throw new Exception("Historial inválido");
      }
    }
    JSONObject s = data.optJSONObject("settings");
    if (s != null) {
      check(s, "theme", new String[] {"Oscuro", "Claro"});
      check(s, "font", new String[] {"Normal", "Grande", "Muy grande"});
      check(s, "minutes", new String[] {"1", "3", "10", "20"});
      check(s, "ask", new String[] {"Sí", "No"});
      check(s, "mode", new String[] {"Aplicar a mi trabajo", "Economía cotidiana"});
      if (s.optString("interests").length() > 500) throw new Exception("Intereses inválidos");
    }
    return data;
  }

  static void check(JSONObject o, String k, String[] allowed) throws Exception {
    if (o.has(k) && !Arrays.asList(allowed).contains(o.optString(k)))
      throw new Exception("Preferencia inválida: " + k);
  }

  void merge(JSONObject data) {
    for (String type : new String[] {"notes", "stages", "explored"}) {
      JSONObject src = data.optJSONObject(type);
      if (src == null) continue;
      JSONObject dst = obj(type);
      Iterator<String> keys = src.keys();
      while (keys.hasNext()) {
        String k = keys.next();
        if (!dst.has(k)) put(dst, k, src.opt(k));
      }
    }
    JSONObject settings = data.optJSONObject("settings");
    if (settings != null) put(state, "settings", settings);
    save();
  }
}
