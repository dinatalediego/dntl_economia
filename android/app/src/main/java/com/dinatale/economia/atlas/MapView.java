package com.dinatale.economia.atlas;

import android.content.*;
import android.graphics.*;
import android.view.*;
import java.util.*;
import org.json.*;

/** Offline geographic polygon viewer; reference boundaries, not cadastral. */
final class MapView extends View {
  interface Selection {
    void select(JSONObject place);
  }

  JSONArray places;
  Selection listener;
  Paint paint = new Paint(3);
  float minX, maxX, minY, maxY, zoom = 1, panX = 0, panY = 0, lastX, lastY, downX, downY;
  boolean pinched = false;
  String selected = "";
  ScaleGestureDetector scale;

  MapView(Context c, JSONArray list, Selection l) {
    super(c);
    places = list;
    listener = l;
    setContentDescription("Mapa. Usa la lista de lugares para una alternativa accesible.");
    bounds(null);
    scale =
        new ScaleGestureDetector(
            c,
            new ScaleGestureDetector.SimpleOnScaleGestureListener() {
              public boolean onScale(ScaleGestureDetector d) {
                zoom = Math.max(1, Math.min(45, zoom * d.getScaleFactor()));
                pinched = true;
                invalidate();
                return true;
              }
            });
  }

  void bounds(JSONObject p) {
    minX = minY = Float.MAX_VALUE;
    maxX = maxY = -Float.MAX_VALUE;
    for (int i = 0; i < places.length(); i++) {
      JSONObject q = places.optJSONObject(i);
      if (p != null && q != p) continue;
      JSONArray rings = q.optJSONArray("rings");
      for (int r = 0; r < rings.length(); r++) {
        JSONArray ring = rings.optJSONArray(r);
        for (int j = 0; j < ring.length(); j++) {
          JSONArray pt = ring.optJSONArray(j);
          float x = (float) pt.optDouble(0), y = -(float) pt.optDouble(1);
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    zoom = 1;
    panX = panY = 0;
    invalidate();
  }

  float unit() {
    return Math.min(
            (getWidth() - 24) / Math.max(.001f, maxX - minX),
            (getHeight() - 24) / Math.max(.001f, maxY - minY))
        * zoom;
  }

  float x(float v) {
    return getWidth() / 2f + (v - (minX + maxX) / 2) * unit() + panX;
  }

  float y(float v) {
    return getHeight() / 2f + (v - (minY + maxY) / 2) * unit() + panY;
  }

  Path path(JSONObject q) {
    Path path = new Path();
    path.setFillType(Path.FillType.EVEN_ODD);
    JSONArray rings = q.optJSONArray("rings");
    for (int r = 0; r < rings.length(); r++) {
      JSONArray ring = rings.optJSONArray(r);
      for (int j = 0; j < ring.length(); j++) {
        JSONArray pt = ring.optJSONArray(j);
        float a = x((float) pt.optDouble(0)), b = y(-(float) pt.optDouble(1));
        if (j == 0) path.moveTo(a, b);
        else path.lineTo(a, b);
      }
      path.close();
    }
    return path;
  }

  protected void onDraw(Canvas canvas) {
    canvas.drawColor(Color.rgb(15, 30, 43));
    for (int i = 0; i < places.length(); i++) {
      JSONObject q = places.optJSONObject(i);
      Path p = path(q);
      paint.setStyle(Paint.Style.FILL);
      paint.setColor(
          q.optString("id").equals(selected) ? Color.rgb(239, 186, 100) : Color.rgb(48, 100, 107));
      canvas.drawPath(p, paint);
      paint.setStyle(Paint.Style.STROKE);
      paint.setColor(Color.rgb(146, 188, 189));
      paint.setStrokeWidth(1);
      canvas.drawPath(p, paint);
    }
  }

  public boolean onTouchEvent(android.view.MotionEvent e) {
    scale.onTouchEvent(e);
    getParent().requestDisallowInterceptTouchEvent(true);
    if (e.getActionMasked() == 0) {
      lastX = downX = e.getX();
      lastY = downY = e.getY();
      pinched = false;
    } else if (e.getActionMasked() == 2 && !scale.isInProgress()) {
      panX += e.getX() - lastX;
      panY += e.getY() - lastY;
      lastX = e.getX();
      lastY = e.getY();
      invalidate();
    } else if (e.getActionMasked() == 1) {
      if (!pinched && Math.hypot(e.getX() - downX, e.getY() - downY) < 12) {
        Region clip = new Region(0, 0, getWidth(), getHeight());
        for (int i = places.length() - 1; i >= 0; i--) {
          JSONObject q = places.optJSONObject(i);
          Region reg = new Region();
          reg.setPath(path(q), clip);
          if (reg.contains((int) e.getX(), (int) e.getY())) {
            selected = q.optString("id");
            listener.select(q);
            invalidate();
            performClick();
            break;
          }
        }
      }
      getParent().requestDisallowInterceptTouchEvent(false);
    }
    return true;
  }

  public boolean performClick() {
    super.performClick();
    return true;
  }
}
