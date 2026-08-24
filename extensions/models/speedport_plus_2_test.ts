import { assertEquals } from "jsr:@std/assert@1.0.19";
import { model } from "./speedport_plus_2.ts";

Deno.test("exports the expected model identity and version", () => {
  assertEquals(model.type, "@dieter/speedport-plus-2");
  assertEquals(model.version, "2026.08.24.12");
});

Deno.test("separates read-only discovery from explicit session action", () => {
  assertEquals("snapshot" in model.methods, true);
  assertEquals("discoverPages" in model.methods, true);
  assertEquals("discoverStatusFields" in model.methods, true);
  assertEquals("inspectPage" in model.methods, true);
  assertEquals("inspectLogContract" in model.methods, true);
  assertEquals("status" in model.methods, true);
  assertEquals("inspectDeviceContract" in model.methods, true);
  assertEquals("listDevices" in model.methods, true);
  assertEquals("action" in model.methods, true);
});

Deno.test("requires valid global arguments", () => {
  const parsed = model.globalArguments.parse({
    baseUrl: "https://192.168.1.1/",
    username: "test-user",
    password: "test-password",
    allowInsecureTls: true,
  });
  assertEquals(parsed.baseUrl, "https://192.168.1.1/");
  assertEquals(parsed.allowInsecureTls, true);
});
