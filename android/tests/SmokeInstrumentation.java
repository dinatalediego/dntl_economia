package com.dinatale.economia.atlas;

import android.app.*;
import android.content.*;
import android.os.*;
import android.view.KeyEvent;
import java.io.*;
import org.json.*;

/** Runs against installed Atlas on a disposable emulator. */
public class SmokeInstrumentation extends Instrumentation {
  public void onCreate(Bundle b) {
    super.onCreate(b);
    start();
  }

  void check(boolean ok, String why) {
    if (!ok) throw new AssertionError(why);
  }

  void shot(String name) throws Exception {
    waitForIdleSync();
    Thread.sleep(500);
    try (FileOutputStream out =
        new FileOutputStream(
            new File(getTargetContext().getExternalFilesDir(null), name + ".png"))) {
      getUiAutomation()
          .takeScreenshot()
          .compress(android.graphics.Bitmap.CompressFormat.PNG, 100, out);
    }
  }

  public void onStart() {
    Bundle result = new Bundle();
    try {
      Intent i = new Intent(getTargetContext(), MainActivity.class);
      i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      MainActivity a = (MainActivity) startActivitySync(i);
      waitForIdleSync();
      Thread.sleep(1000);
      shot("mood");
      sendKeyDownUpSync(KeyEvent.KEYCODE_BACK);
      waitForIdleSync();
      runOnMainSync(
          () -> {
            check(a.lessons.length() >= 30, "catalog");
            check(a.museum.length() >= 180, "museum");
            check(a.atlas.optJSONArray("Lima").length() == 50, "districts");
          });
      shot("home");
      runOnMainSync(
          () -> {
            a.screen = "Atlas";
            a.level = "Lima";
            a.render();
            JSONArray ps = a.atlas.optJSONArray("Lima");
            for (int n = 0; n < ps.length(); n++) {
              JSONObject p = ps.optJSONObject(n);
              if (p.optString("id").equals("lima:150113")) {
                a.map.selected = p.optString("id");
                a.map.bounds(p);
                a.showPlace(p);
              }
            }
          });
      shot("atlas");
      runOnMainSync(
          () -> {
            a.screen = "Ajustes";
            a.render();
          });
      shot("settings");
      runOnMainSync(
          () -> {
            try {
              Store s = a.store;
              String id = "test:backup";
              s.note(id, "local evidence");
              s.stage(id, "Lo apliqué");
              s.visit(id);
              byte[] backup = s.backup();
              JSONObject imported = Store.validate(backup);
              Store.put(imported.getJSONObject("notes"), id, "different");
              Store.put(imported.getJSONObject("notes"), "test:new", "imported");
              s.merge(imported);
              check(s.obj("notes").optString(id).equals("local evidence"), "non-destructive merge");
              check(s.obj("notes").optString("test:new").equals("imported"), "import insertion");
              s.clearHistory();
              check(s.obj("explored").length() == 0, "history clear");
              check(s.obj("stages").optString(id).equals("Lo apliqué"), "stage retained");
              check(s.obj("notes").has(id), "note retained");
              s.obj("notes").remove(id);
              s.obj("notes").remove("test:new");
              s.obj("stages").remove(id);
              s.save();
              a.screen = "Progreso";
              a.render();
            } catch (Exception e) {
              throw new RuntimeException(e);
            }
          });
      shot("progress");
      result.putString(
          "stream",
          "PASS: startup, catalogs, atlas, settings, backup merge, history preservation,"
              + " progress\n");
      finish(Activity.RESULT_OK, result);
    } catch (Throwable e) {
      result.putString("stream", "FAIL: " + e.toString());
      finish(Activity.RESULT_CANCELED, result);
    }
  }
}
