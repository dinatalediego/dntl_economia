package com.dinatale.economia.atlas;

import java.nio.charset.StandardCharsets;
import org.json.*;

public class BackupValidationTest {
  static byte[] bytes(String s) {
    return s.getBytes(StandardCharsets.UTF_8);
  }

  static void reject(byte[] b) throws Exception {
    try {
      Store.validate(b);
    } catch (Exception expected) {
      return;
    }
    throw new AssertionError("Expected rejection");
  }

  public static void main(String[] args) throws Exception {
    String good =
        "{\"app\":\"dntl-economia-atlas\",\"schema\":1,\"data\":{\"notes\":{\"x\":\"evidencia\"},\"stages\":{\"x\":\"Lo"
            + " apliqué\"},\"settings\":{\"minutes\":\"3\"}}}";
    JSONObject result = Store.validate(bytes(good));
    if (!result.getJSONObject("notes").getString("x").equals("evidencia"))
      throw new AssertionError();
    reject(bytes(good.replace("\"schema\":1", "\"schema\":2")));
    reject(bytes(good.replace("Lo apliqué", "DOMINADO")));
    reject(bytes(good.replace("\"minutes\":\"3\"", "\"minutes\":\"999\"")));
    reject(new byte[Store.MAX_BYTES + 1]);
    reject(bytes("not JSON"));
    System.out.println("6 backup validation checks passed");
  }
}
