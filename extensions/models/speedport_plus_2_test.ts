import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "jsr:@std/assert@1.0.19";
import { model } from "./speedport_plus_2.ts";

Deno.test("exports the expected model identity and version", () => {
  assertEquals(model.type, "@dieter/speedport-plus-2");
  assertEquals(model.version, "2026.08.25.1");
});

Deno.test("separates read-only discovery from explicit session action", () => {
  assertEquals("snapshot" in model.methods, true);
  assertEquals("discoverPages" in model.methods, true);
  assertEquals("discoverStatusFields" in model.methods, true);
  assertEquals("inspectPage" in model.methods, true);
  assertEquals("inspectLogContract" in model.methods, true);
  assertEquals("collectLogs" in model.methods, true);
  assertEquals("status" in model.methods, true);
  assertEquals("inspectDeviceContract" in model.methods, true);
  assertEquals("listDevices" in model.methods, true);
  assertEquals("action" in model.methods, true);
});

Deno.test("accepts every supported all-log collection window", () => {
  for (
    const timeFrame of [
      "Today",
      "Yesterday",
      "Last week",
      "Last month",
      "Last 90 days",
    ]
  ) {
    assertEquals(
      model.methods.collectLogs.arguments.parse({ timeFrame }).timeFrame,
      timeFrame,
    );
  }
});

Deno.test("accepts optional contextual names for status and logs", () => {
  const statusName = "incident_router-reboot_post_status";
  const logsName = "incident_router-reboot_post_logs";
  assertEquals(
    model.methods.status.arguments.parse({ name: statusName }).name,
    statusName,
  );
  assertEquals(
    model.methods.collectLogs.arguments.parse({
      timeFrame: "Last week",
      name: logsName,
    }).name,
    logsName,
  );
  assertEquals(model.methods.status.arguments.parse({}).name, undefined);
  assertThrows(() =>
    model.methods.collectLogs.arguments.parse({
      timeFrame: "Last week",
      name: "Invalid name",
    })
  );
});

Deno.test("requires valid global arguments", () => {
  const parsed = model.globalArguments.parse({
    baseUrl: "https://192.168.1.1/",
    expectedHost: "192.168.1.1",
    username: "test-user",
    password: "test-password",
    allowInsecureTls: true,
    pinnedPublicKey: "sha256//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  });
  assertEquals(parsed.baseUrl, "https://192.168.1.1/");
  assertEquals(parsed.allowInsecureTls, true);
});

Deno.test("rejects unsafe router URL schemes and embedded credentials", () => {
  const argumentsFor = (baseUrl: string) => ({
    baseUrl,
    expectedHost: "192.168.1.1",
    username: "test-user",
    password: "test-password",
    allowInsecureTls: false,
  });
  assertThrows(() =>
    model.globalArguments.parse(argumentsFor("file:///etc/passwd"))
  );
  assertThrows(() =>
    model.globalArguments.parse(argumentsFor("http://192.168.1.1/"))
  );
  assertThrows(() =>
    model.globalArguments.parse(
      argumentsFor("https://embedded:secret@192.168.1.1/"),
    )
  );
});

Deno.test("requires exact host matching and a pin for insecure TLS", async () => {
  const valid = {
    baseUrl: "https://192.168.1.1/",
    expectedHost: "192.168.1.1",
    username: "test-user",
    password: "test-password",
    allowInsecureTls: true,
    pinnedPublicKey: "sha256//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  };
  assertEquals(model.globalArguments.parse(valid).expectedHost, "192.168.1.1");
  const mismatchedHost = model.globalArguments.parse({
    ...valid,
    expectedHost: "router.attacker.invalid",
  });
  await assertRejects(
    () =>
      model.methods.status.execute({}, {
        globalArgs: mismatchedHost,
        logger: { info: () => {} },
      } as never),
    Error,
    "Configured expected host does not match the router base URL",
  );
  const { pinnedPublicKey: _pin, ...withoutPin } = valid;
  const insecureWithoutPin = model.globalArguments.parse(withoutPin);
  await assertRejects(
    () =>
      model.methods.status.execute({}, {
        globalArgs: insecureWithoutPin,
        logger: { info: () => {} },
      } as never),
    Error,
    "A pinned public key is required when insecure TLS is enabled",
  );
});
