import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "jsr:@std/assert@1.0.19";
import { model, testHelpers } from "./speedport_plus_2.ts";

Deno.test("exports the expected model identity and version", () => {
  assertEquals(model.type, "@dieter/speedport-plus-2");
  assertEquals(model.version, "2026.09.07.2");
});

Deno.test("allows read-only inspection of Wi-Fi and LAN configuration pages", () => {
  for (
    const pagePath of [
      "/arc_static_dhcp.php",
      "/lan.php",
      "/wifi.php",
      "/wifi_spectrum_analyzer.php",
      "/wireless_network_configuration.php",
      "/wireless_network_configuration_generic.php",
      "/wireless_wisp.php",
    ]
  ) {
    assertEquals(
      model.methods.inspectPage.arguments.parse({ pagePath }).pagePath,
      pagePath,
    );
  }
});

Deno.test("redacts sensitive form values while retaining diagnostic state", () => {
  const controls = testHelpers.configurationInputControls(`
    <input id="ssid" name="ssid" value="angel">
    <input id="maximum_clients" name="maximum_clients" value="16">
    <input type="password" id="wifi_password" value="never-store-this">
    <input type="hidden" name="csrfp_token" value="never-store-token">
    <input type="hidden" name="configInfo" value="never-store-config">
    <input id="radius_server_key" value="never-store-radius-key">
    <input id="IGMP_Snooping" value="enabled">
    <input type="checkbox" id="band_steering" checked disabled value="1">
  `);
  assertEquals(controls, [
    {
      id: "ssid",
      name: "ssid",
      type: "text",
      checked: false,
      disabled: false,
      sensitive: false,
      value: "angel",
    },
    {
      id: "maximum_clients",
      name: "maximum_clients",
      type: "text",
      checked: false,
      disabled: false,
      sensitive: false,
      value: "16",
    },
    {
      id: "wifi_password",
      name: null,
      type: "password",
      checked: false,
      disabled: false,
      sensitive: true,
      value: null,
    },
    {
      id: null,
      name: "csrfp_token",
      type: "hidden",
      checked: false,
      disabled: false,
      sensitive: true,
      value: null,
    },
    {
      id: null,
      name: "configInfo",
      type: "hidden",
      checked: false,
      disabled: false,
      sensitive: true,
      value: null,
    },
    {
      id: "radius_server_key",
      name: null,
      type: "text",
      checked: false,
      disabled: false,
      sensitive: true,
      value: null,
    },
    {
      id: "IGMP_Snooping",
      name: null,
      type: "text",
      checked: false,
      disabled: false,
      sensitive: false,
      value: "enabled",
    },
    {
      id: "band_steering",
      name: null,
      type: "checkbox",
      checked: true,
      disabled: true,
      sensitive: true,
      value: null,
    },
  ]);
});

Deno.test("fails closed for unknown and camelCase input values", () => {
  const controls = testHelpers.configurationInputControls(`
    <input id="preSharedKey" value="never-store-pre-shared-key">
    <input name="wpaKey" value="never-store-wpa-key">
    <input id="encryptionKey" value="never-store-encryption-key">
    <input type="hidden" id="firmwareState" value="never-store-hidden-state">
    <input id="unexpectedField" value="never-store-unknown-value">
  `);
  assertEquals(
    controls.map(({ sensitive, value }) => ({ sensitive, value })),
    Array.from({ length: 5 }, () => ({ sensitive: true, value: null })),
  );
});

Deno.test("records selected options without retaining unrelated page content", () => {
  assertEquals(
    testHelpers.configurationSelectControls(`
      <select id="channel" name="channel">
        <option value="auto">Auto</option>
        <option value="2" selected>2</option>
      </select>
    `),
    [{
      id: "channel",
      name: "channel",
      disabled: false,
      sensitive: false,
      options: [
        { value: "auto", label: "Auto", selected: false },
        { value: "2", label: "2", selected: true },
      ],
    }],
  );
});

Deno.test("redacts values and labels for unknown select controls", () => {
  assertEquals(
    testHelpers.configurationSelectControls(`
      <select id="credentialMode">
        <option value="preSharedKey">Use key</option>
        <option value="never-store-select-secret" selected>Secret label</option>
      </select>
    `),
    [{
      id: "credentialMode",
      name: null,
      disabled: false,
      sensitive: true,
      options: [
        { value: null, label: null, selected: false },
        { value: null, label: null, selected: true },
      ],
    }],
  );
});

Deno.test("disables curl configuration and limits downloads", () => {
  const args = testHelpers.curlSafetyArguments(1024);
  assertEquals(args[0], "--disable");
  assertEquals(args.slice(1), [
    "--silent",
    "--show-error",
    "--max-filesize",
    "1024",
  ]);
  assertThrows(() => testHelpers.curlSafetyArguments(0));
});

Deno.test("redacts all input values outside approved diagnostic pages", () => {
  assertEquals(
    testHelpers.configurationInputControls(
      '<input id="pppoe_username" value="subscriber@example.test">',
      false,
    ),
    [{
      id: "pppoe_username",
      name: null,
      type: "text",
      checked: false,
      disabled: false,
      sensitive: true,
      value: null,
    }],
  );
});

Deno.test("follows only same-origin numeric wireless edit links", () => {
  const urls = testHelpers.discoveredWirelessEditUrls(
    `
    <a href="wireless_network_configuration_edit.php?id=1">main</a>
    <a href="/wireless_network_configuration_edit_guest_network.php?guest_id=4">guest</a>
    <a href="wireless_network_configuration_edit.php?id=1&amp;unsafe=yes">extra</a>
    <a href="wireless_network_configuration_edit.php?id=../../admin">path</a>
    <a href="https://example.test/wireless_network_configuration_edit.php?id=2">external</a>
  `,
    new URL("https://192.0.2.1/"),
  );
  assertEquals(
    urls.map((url) => `${url.pathname}${url.search}`),
    [
      "/wireless_network_configuration_edit_guest_network.php?guest_id=4",
      "/wireless_network_configuration_edit.php?id=1",
    ],
  );
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
  assertEquals("inspectNetworkConfiguration" in model.methods, true);
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
