/**
 * Read-only observations from an Arcadyan Speedport Plus 2 router.
 *
 * @module
 */
import { z } from "npm:zod@4";

const GlobalArgsSchema = z.object({
  baseUrl: z.string().url(),
  username: z.string().min(1).meta({ sensitive: true }),
  password: z.string().min(1).meta({ sensitive: true }),
  allowInsecureTls: z.boolean().default(false),
});

type GlobalArgs = z.infer<typeof GlobalArgsSchema>;

const SnapshotSchema = z.object({
  observedAt: z.iso.datetime(),
  baseUrl: z.string().url(),
  firmwareUiVersion: z.string().nullable(),
  firmwareGeneration: z.string().nullable(),
  pagePath: z.string(),
  pageTitle: z.string().nullable(),
  pageHeading: z.string().nullable(),
  sessionState: z.enum(["authenticated", "session-conflict"]),
  links: z.array(z.string()),
  scripts: z.array(z.string()),
  formActions: z.array(z.string()),
  endpointShapes: z.array(z.string()),
  ajaxCalls: z.array(z.object({
    path: z.string(),
    method: z.enum(["GET", "POST", "UNKNOWN"]),
    dataKeys: z.array(z.string()),
    takeoverOutExpression: z.string().nullable(),
    takeoverOutLiteral: z.string().nullable(),
    takeoverOutRestrictedSource: z.string().nullable(),
    takeoverOutSyntax: z.string().nullable(),
  })),
  takeoverControl: z.object({
    id: z.literal("kick-out"),
    tag: z.string(),
    type: z.string().nullable(),
    name: z.string().nullable(),
    value: z.string().nullable(),
  }).nullable(),
  sessionReleased: z.boolean().nullable(),
  sessionReleaseError: z.string().nullable(),
});

const SessionActionSchema = z.object({
  performedAt: z.iso.datetime(),
  operation: z.literal("take-over-session"),
  conflictDetected: z.boolean(),
  handlerStatus: z.number().int(),
  verified: z.boolean(),
  finalPagePath: z.string().nullable(),
  verificationError: z.string().nullable(),
  authenticatedLinks: z.array(z.string()).nullable(),
  authenticatedEndpointShapes: z.array(z.string()).nullable(),
  sessionReleased: z.boolean(),
  sessionReleaseError: z.string().nullable(),
});

const PageCatalogSchema = z.object({
  observedAt: z.iso.datetime(),
  sources: z.array(z.string()),
  pagePaths: z.array(z.string()),
  sessionReleased: z.boolean(),
  sessionReleaseError: z.string().nullable(),
});

const InspectablePageSchema = z.enum([
  "/at_a_glance.php",
  "/connection_status.php",
  "/arc_wan_config.php",
  "/arc_physical_config.php",
  "/arc_xdsl_statistic.php",
  "/connected_devices_computers.php",
  "/arc_routing_table.php",
  "/hardware.php",
  "/software.php",
  "/troubleshooting_logs.php",
]);

const PageInspectionSchema = z.object({
  observedAt: z.iso.datetime(),
  pagePath: InspectablePageSchema,
  pageTitle: z.string().nullable(),
  pageHeading: z.string().nullable(),
  scriptPaths: z.array(z.string()),
  formActions: z.array(z.string()),
  endpointShapes: z.array(z.string()),
  ajaxCalls: SnapshotSchema.shape.ajaxCalls,
  sessionReleased: z.boolean(),
  sessionReleaseError: z.string().nullable(),
});

const StatusFieldCatalogSchema = z.object({
  observedAt: z.iso.datetime(),
  pages: z.array(z.object({
    pagePath: InspectablePageSchema,
    elementIds: z.array(z.string()),
    fieldNames: z.array(z.string()),
    labels: z.array(z.string()),
    tableHeaders: z.array(z.string()),
    selectControls: z.array(z.object({
      id: z.string().nullable(),
      name: z.string().nullable(),
      options: z.array(z.object({
        value: z.string(),
        label: z.string(),
      })),
    })),
    statusBindings: z.array(z.object({
      text: z.string(),
      tag: z.string(),
      elementId: z.string().nullable(),
      fieldName: z.string().nullable(),
      forId: z.string().nullable(),
      classNames: z.array(z.string()),
    })),
    logContainers: z.array(z.object({
      id: z.string(),
      byteLength: z.number().int().nonnegative(),
      rowCount: z.number().int().nonnegative(),
      cellCount: z.number().int().nonnegative(),
      timestampLikeCount: z.number().int().nonnegative(),
      bootKeywordCount: z.number().int().nonnegative(),
    })),
  })),
  sessionReleased: z.boolean(),
  sessionReleaseError: z.string().nullable(),
});

const LogCategorySchema = z.enum(["system", "event", "firewall"]);
const LogTimeFrameSchema = z.enum([
  "Today",
  "Yesterday",
  "Last week",
  "Last month",
  "Last 90 days",
]);

const LogContractSchema = z.object({
  observedAt: z.iso.datetime(),
  category: LogCategorySchema,
  timeFrame: LogTimeFrameSchema,
  handlerPath: z.literal("/actionHandler/ajax_troubleshooting_logs.php"),
  httpStatus: z.number().int(),
  contentType: z.string().nullable(),
  bodyKind: z.enum(["json", "html", "text"]),
  byteLength: z.number().int().nonnegative(),
  topLevelKeys: z.array(z.string()),
  tableHeaders: z.array(z.string()),
  endpointShapes: z.array(z.string()),
  refreshedPageStatus: z.number().int(),
  selectedContainer: z.object({
    id: z.string(),
    byteLength: z.number().int().nonnegative(),
    rowCount: z.number().int().nonnegative(),
    cellCount: z.number().int().nonnegative(),
    timestampLikeCount: z.number().int().nonnegative(),
    bootKeywordCount: z.number().int().nonnegative(),
  }).nullable(),
  sessionReleased: z.boolean(),
  sessionReleaseError: z.string().nullable(),
});

const RouterStatusSchema = z.object({
  observedAt: z.iso.datetime(),
  internetState: z.string().nullable(),
  wanProtocol: z.string().nullable(),
  wanIpAddress: z.string().nullable(),
  workingStatus: z.string().nullable(),
  dslLinkStatus: z.string().nullable(),
  downstreamSyncRate: z.string().nullable(),
  upstreamSyncRate: z.string().nullable(),
  downstreamSnrMargin: z.string().nullable(),
  upstreamSnrMargin: z.string().nullable(),
  attenuationDown: z.string().nullable(),
  attenuationUp: z.string().nullable(),
  crcErrors: z.string().nullable(),
  fecErrors: z.string().nullable(),
  routerUptime: z.null(),
  uptimeUnavailableReason: z.literal(
    "not-exposed-by-observed-router-pages-or-logs",
  ),
  sourcePages: z.array(z.string()),
  sessionReleased: z.boolean(),
  sessionReleaseError: z.string().nullable(),
});

const DeviceContractSchema = z.object({
  observedAt: z.iso.datetime(),
  pagePath: z.literal("/connected_devices_computers.php"),
  ipv4OccurrenceCount: z.number().int().nonnegative(),
  macOccurrenceCount: z.number().int().nonnegative(),
  contexts: z.array(z.object({
    valueKind: z.enum(["ipv4", "mac"]),
    enclosingTag: z.string().nullable(),
    attributeNames: z.array(z.string()),
    nearbyIdentifiers: z.array(z.string()),
    nearbyJsonKeys: z.array(z.string()),
  })),
  assignments: z.array(z.object({
    identifier: z.string(),
    expressionKind: z.enum(["array", "string", "split", "json", "other"]),
    stringLiteralCount: z.number().int().nonnegative(),
    ipv4OccurrenceCount: z.number().int().nonnegative(),
    macOccurrenceCount: z.number().int().nonnegative(),
  })),
  sessionReleased: z.boolean(),
  sessionReleaseError: z.string().nullable(),
});

const DeviceInventorySchema = z.object({
  observedAt: z.iso.datetime(),
  devices: z.array(z.object({
    index: z.number().int().nonnegative(),
    hostname: z.string().max(255).nullable(),
    macAddress: z.string().regex(/^[0-9a-f]{2}(?::[0-9a-f]{2}){5}$/),
    instance: z.string().regex(/^\d+$/).nullable(),
    online: z.literal(true),
  })),
  sourcePage: z.literal("/connected_devices_computers.php"),
  sessionReleased: z.boolean(),
  sessionReleaseError: z.string().nullable(),
});

type RouterResponse = {
  url: URL;
  status: number;
  headers: Headers;
  body: string;
};

function hex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function base64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function commandInput(
  command: string,
  args: string[],
  input: Uint8Array,
): Promise<Uint8Array> {
  const child = new Deno.Command(command, {
    args,
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  }).spawn();
  const writer = child.stdin.getWriter();
  await writer.write(input);
  await writer.close();
  const output = await child.output();
  if (!output.success) {
    throw new Error(
      `${command} failed: ${new TextDecoder().decode(output.stderr)}`,
    );
  }
  return output.stdout;
}

async function encrypt(value: string, keySeed: string): Promise<string> {
  const encoder = new TextEncoder();
  const digest = await commandInput(
    "openssl",
    ["dgst", "-md5", "-binary"],
    encoder.encode(keySeed),
  );
  const keyHex = hex(encoder.encode(hex(digest)));
  const random = crypto.getRandomValues(new Uint8Array(16));
  const iv = base64(random).slice(0, 16);
  const cipherText = await commandInput(
    "openssl",
    [
      "enc",
      "-aes-256-cbc",
      "-K",
      keyHex,
      "-iv",
      hex(encoder.encode(iv)),
      "-nosalt",
    ],
    encoder.encode(value),
  );
  return base64(encoder.encode(`${base64(cipherText)}::${iv}`));
}

function match(html: string, expression: RegExp): string | null {
  return expression.exec(html)?.[1] ?? null;
}

function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueTagText(html: string, tag: "label" | "th"): string[] {
  const values = [...html.matchAll(
    new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi"),
  )]
    .map((entry) => plainText(entry[1]))
    .filter((value) => value.length > 0 && value.length <= 120);
  return [...new Set(values)].sort();
}

function uniqueAttributeValues(
  html: string,
  attribute: "id" | "name",
): string[] {
  const values = [...html.matchAll(
    new RegExp(`\\b${attribute}=["']([A-Za-z][A-Za-z0-9_.:-]{0,79})["']`, "gi"),
  )].map((entry) => entry[1]);
  return [...new Set(values)].sort();
}

function selectControls(html: string): Array<{
  id: string | null;
  name: string | null;
  options: Array<{ value: string; label: string }>;
}> {
  return [...html.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/gi)].map(
    (select) => ({
      id: match(select[1], /\bid=["']([^"']+)["']/i),
      name: match(select[1], /\bname=["']([^"']+)["']/i),
      options: [...select[2].matchAll(
        /<option\b([^>]*)>([\s\S]*?)<\/option>/gi,
      )].map((option) => ({
        value: match(option[1], /\bvalue=["']([^"']*)["']/i) ?? "",
        label: plainText(option[2]).slice(0, 120),
      })),
    }),
  );
}

function statusBindings(html: string): Array<{
  text: string;
  tag: string;
  elementId: string | null;
  fieldName: string | null;
  forId: string | null;
  classNames: string[];
}> {
  const bindings = new Map<string, {
    text: string;
    tag: string;
    elementId: string | null;
    fieldName: string | null;
    forId: string | null;
    classNames: string[];
  }>();
  for (
    const entry of html.matchAll(
      /<([a-z][a-z0-9]*)\b([^>]*)>([^<>]{1,160})<\/\1>/gi,
    )
  ) {
    const text = plainText(entry[3]);
    const attributes = entry[2];
    const classNames = (match(attributes, /\bclass=["']([^"']+)["']/i) ?? "")
      .split(/\s+/)
      .filter((name) => /^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(name))
      .sort();
    const isReadonlyLabel = classNames.includes("readonlyLabel");
    if (
      (
        !isReadonlyLabel &&
        !/(?:up\s*time|uptime|system\s+time|running\s+time|duration|wan|internet|connection|session|x?dsl|logs?)/i
          .test(text)
      ) ||
      /\d/.test(text) || text.length > 120
    ) continue;
    const binding = {
      text,
      tag: entry[1].toLowerCase(),
      elementId: match(attributes, /\bid=["']([^"']+)["']/i),
      fieldName: match(attributes, /\bname=["']([^"']+)["']/i),
      forId: match(attributes, /\bfor=["']([^"']+)["']/i),
      classNames,
    };
    bindings.set(JSON.stringify(binding), binding);
  }
  return [...bindings.values()].sort((left, right) =>
    left.text.localeCompare(right.text)
  );
}

function logContainerMetadata(html: string): Array<{
  id: string;
  byteLength: number;
  rowCount: number;
  cellCount: number;
  timestampLikeCount: number;
  bootKeywordCount: number;
}> {
  const starts = [...html.matchAll(
    /\bid=["']((?:system|event|firewall)_logs_(?:today|yesterday|week|month|last))["']/gi,
  )].map((entry) => ({
    id: entry[1].toLowerCase(),
    index: entry.index ?? 0,
  })).sort((left, right) => left.index - right.index);
  return starts.map((start, index) => {
    const end = starts[index + 1]?.index ?? html.length;
    const segment = html.slice(start.index, end);
    return {
      id: start.id,
      byteLength: new TextEncoder().encode(segment).byteLength,
      rowCount: [...segment.matchAll(/<tr\b/gi)].length,
      cellCount: [...segment.matchAll(/<td\b/gi)].length,
      timestampLikeCount: [
        ...segment.matchAll(
          /\b(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})[ T]+\d{1,2}:\d{2}(?::\d{2})?\b/g,
        ),
      ].length,
      bootKeywordCount: [
        ...segment.matchAll(/\b(?:boot|reboot|restart|startup|started)\b/gi),
      ].length,
    };
  });
}

function readonlyValues(html: string): Map<string, string> {
  const values = new Map<string, string>();
  for (
    const label of html.matchAll(
      /<span\b[^>]*class=["'][^"']*\breadonlyLabel\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi,
    )
  ) {
    const key = plainText(label[1]).replace(/:\s*$/, "").toLowerCase();
    if (key.length === 0 || key.length > 120) continue;
    const afterLabel = html.slice(
      (label.index ?? 0) + label[0].length,
      (label.index ?? 0) + label[0].length + 1_000,
    );
    const nextLabelIndex = afterLabel.search(
      /<span\b[^>]*class=["'][^"']*\breadonlyLabel\b/i,
    );
    const valueScope = nextLabelIndex >= 0
      ? afterLabel.slice(0, nextLabelIndex)
      : afterLabel;
    const valueHtml =
      /<span\b[^>]*class=["'][^"']*\bvalue\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i
        .exec(valueScope)?.[1] ?? null;
    if (valueHtml === null) continue;
    const value = plainText(valueHtml);
    if (value.length > 0 && value.length <= 500) values.set(key, value);
  }
  return values;
}

function deviceContractContexts(html: string): {
  ipv4OccurrenceCount: number;
  macOccurrenceCount: number;
  contexts: Array<{
    valueKind: "ipv4" | "mac";
    enclosingTag: string | null;
    attributeNames: string[];
    nearbyIdentifiers: string[];
    nearbyJsonKeys: string[];
  }>;
  assignments: Array<{
    identifier: string;
    expressionKind: "array" | "string" | "split" | "json" | "other";
    stringLiteralCount: number;
    ipv4OccurrenceCount: number;
    macOccurrenceCount: number;
  }>;
} {
  const candidates = [
    ...[...html.matchAll(
      /\b(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}\b/g,
    )].map((entry) => ({
      valueKind: "ipv4" as const,
      index: entry.index ?? 0,
    })),
    ...[...html.matchAll(
      /\b[0-9a-f]{2}(?::[0-9a-f]{2}){5}\b/gi,
    )].map((entry) => ({
      valueKind: "mac" as const,
      index: entry.index ?? 0,
    })),
  ].sort((left, right) => left.index - right.index);
  const contexts = candidates.map((candidate) => {
    const before = html.slice(
      Math.max(0, candidate.index - 1_000),
      candidate.index,
    );
    const around = html.slice(
      Math.max(0, candidate.index - 300),
      Math.min(html.length, candidate.index + 300),
    );
    const openingTag = /<([a-z][a-z0-9]*)\b([^<>]*)>[^<>]*$/i.exec(before);
    return {
      valueKind: candidate.valueKind,
      enclosingTag: openingTag?.[1].toLowerCase() ?? null,
      attributeNames: openingTag === null
        ? []
        : [...openingTag[2].matchAll(/\b([A-Za-z_:][A-Za-z0-9_.:-]*)\s*=/g)]
          .map((entry) => entry[1].toLowerCase())
          .filter((name) => !/^on/i.test(name))
          .sort(),
      nearbyIdentifiers: [
        ...new Set([
          ...before.matchAll(
            /\b(?:var|let|const)\s+([A-Za-z_$][A-Za-z0-9_$]{0,79})/g,
          ),
        ].map((entry) => entry[1])),
      ].sort(),
      nearbyJsonKeys: [
        ...new Set([
          ...around.matchAll(
            /["']([A-Za-z][A-Za-z0-9_-]{0,79})["']\s*:/g,
          ),
        ].map((entry) => entry[1])),
      ].sort(),
    };
  });
  return {
    ipv4OccurrenceCount:
      candidates.filter((entry) => entry.valueKind === "ipv4").length,
    macOccurrenceCount:
      candidates.filter((entry) => entry.valueKind === "mac").length,
    contexts,
    assignments: [...html.matchAll(
      /\b(?:var|let|const)\s+([A-Za-z_$][A-Za-z0-9_$]{0,79})\s*=\s*([^;]{0,20000});/g,
    )].filter((entry) =>
      /(?:host|device|client|online|mac|ip|interface|connection)/i.test(
        entry[1],
      )
    ).map((entry) => {
      const expression = entry[2].trim();
      const expressionKind = /^\[/.test(expression)
        ? "array" as const
        : /\.split\s*\(/.test(expression)
        ? "split" as const
        : /^JSON\.parse\s*\(/.test(expression)
        ? "json" as const
        : /^["']/.test(expression)
        ? "string" as const
        : "other" as const;
      return {
        identifier: entry[1],
        expressionKind,
        stringLiteralCount: [
          ...expression.matchAll(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g),
        ].length,
        ipv4OccurrenceCount: [...expression.matchAll(
          /\b(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}\b/g,
        )].length,
        macOccurrenceCount: [...expression.matchAll(
          /\b[0-9a-f]{2}(?::[0-9a-f]{2}){5}\b/gi,
        )].length,
      };
    }).sort((left, right) => left.identifier.localeCompare(right.identifier)),
  };
}

function arrayExpression(html: string, identifier: string): string | null {
  if (!/^[A-Za-z_$][A-Za-z0-9_$]{0,79}$/.test(identifier)) {
    throw new Error("Invalid router JavaScript identifier");
  }
  return new RegExp(
    `\\b(?:var|let|const)\\s+${identifier}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*;`,
  ).exec(html)?.[1] ?? null;
}

function decodeJsString(literal: string): string {
  if (literal.startsWith('"')) {
    try {
      return JSON.parse(literal);
    } catch {
      return literal.slice(1, -1);
    }
  }
  return literal.slice(1, -1)
    .replace(
      /\\u([0-9a-f]{4})/gi,
      (_match, value) => String.fromCharCode(Number.parseInt(value, 16)),
    )
    .replace(
      /\\x([0-9a-f]{2})/gi,
      (_match, value) => String.fromCharCode(Number.parseInt(value, 16)),
    )
    .replace(/\\(['\\nrt])/g, (_match, value) => {
      if (value === "n") return "\n";
      if (value === "r") return "\r";
      if (value === "t") return "\t";
      return value;
    });
}

function stringArray(html: string, identifier: string): string[] {
  const expression = arrayExpression(html, identifier);
  if (expression === null) {
    throw new Error(`Router device array ${identifier} was not found`);
  }
  return [
    ...expression.matchAll(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g),
  ].map((entry) => decodeJsString(entry[0]));
}

function scalarArray(html: string, identifier: string): string[] {
  const expression = arrayExpression(html, identifier);
  if (expression === null) return [];
  return expression.split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map((value) => /^["']/.test(value) ? decodeJsString(value) : value);
}

function uniqueLocalPaths(
  html: string,
  attribute: "href" | "src" | "action",
  baseUrl: URL,
): string[] {
  const expression = new RegExp(`${attribute}=["']([^"'#]+)["']`, "gi");
  const links = [...html.matchAll(expression)]
    .map((entry) => {
      try {
        const url = new URL(entry[1], baseUrl);
        return url.origin === baseUrl.origin ? url.pathname : null;
      } catch {
        return null;
      }
    })
    .filter((href): href is string => href !== null);
  return [...new Set(links)].sort();
}

function uniqueEndpointShapes(html: string, baseUrl: URL): string[] {
  const endpoints = [...html.matchAll(/["']([^"']+\.php(?:\?[^"']*)?)["']/gi)]
    .map((entry) => {
      try {
        const url = new URL(entry[1], baseUrl);
        if (url.origin !== baseUrl.origin) return null;
        const keys = [...new Set(url.searchParams.keys())].sort();
        return keys.length > 0
          ? `${url.pathname}?${keys.join("&")}`
          : url.pathname;
      } catch {
        return null;
      }
    })
    .filter((endpoint): endpoint is string => endpoint !== null);
  return [...new Set(endpoints)].sort();
}

function ajaxCalls(
  html: string,
  baseUrl: URL,
): Array<
  {
    path: string;
    method: "GET" | "POST" | "UNKNOWN";
    dataKeys: string[];
    takeoverOutExpression: string | null;
    takeoverOutLiteral: string | null;
    takeoverOutRestrictedSource: string | null;
    takeoverOutSyntax: string | null;
  }
> {
  const calls = new Map<string, {
    path: string;
    method: "GET" | "POST" | "UNKNOWN";
    dataKeys: string[];
    takeoverOutExpression: string | null;
    takeoverOutLiteral: string | null;
    takeoverOutRestrictedSource: string | null;
    takeoverOutSyntax: string | null;
  }>();
  for (
    const endpoint of html.matchAll(/["']([^"']+\.php(?:\?[^"']*)?)["']/gi)
  ) {
    let url: URL;
    try {
      url = new URL(endpoint[1], baseUrl);
    } catch {
      continue;
    }
    if (url.origin !== baseUrl.origin) continue;

    const start = Math.max(0, (endpoint.index ?? 0) - 600);
    const end = Math.min(
      html.length,
      (endpoint.index ?? 0) + endpoint[0].length + 600,
    );
    const context = html.slice(start, end);
    const methodMatch = /(?:type|method)\s*:\s*["'](GET|POST)["']/i.exec(
      context,
    );
    const dataSource = /data\s*:\s*\{([^}]*)\}/i.exec(context)?.[1] ?? "";
    const dataKeys = [
      ...dataSource.matchAll(/(?:^|,)\s*([A-Za-z_$][\w$]*)\s*:/g),
    ]
      .map((match) => match[1])
      .sort();
    const method = methodMatch?.[1].toUpperCase() as "GET" | "POST" | undefined;
    const takeoverMatch = url.pathname.endsWith("/ajax_arc_one_user.php")
      ? /(?:^|,)\s*out\s*:\s*(?:["']([A-Za-z0-9_-]{1,16})["']|(encodeURIComponent\([A-Za-z_$][\w$]{0,31}\)|[A-Za-z_$][\w$]{0,31}|\d{1,8}|true|false))/i
        .exec(dataSource)
      : null;
    const takeoverOutExpression = takeoverMatch?.[1] ?? takeoverMatch?.[2] ??
      null;
    const wrappedIdentifier = takeoverOutExpression === null
      ? null
      : /^encodeURIComponent\(([A-Za-z_$][\w$]*)\)$/i.exec(
        takeoverOutExpression,
      )?.[1] ?? null;
    const plainIdentifier = takeoverOutExpression !== null &&
        /^[A-Za-z_$][\w$]*$/.test(takeoverOutExpression) &&
        !/^(?:true|false)$/i.test(takeoverOutExpression)
      ? takeoverOutExpression
      : null;
    const identifier = wrappedIdentifier ?? plainIdentifier;
    const escapedIdentifier = identifier !== null
      ? identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      : "";
    const assignedMatch = identifier !== null
      ? new RegExp(
        `(?:var|let|const)?\\s*${escapedIdentifier}\\s*=\\s*(?:'([A-Za-z0-9_$ "{}:,.-]{1,128})'|"([A-Za-z0-9_$ '{}:,.-]{1,128})")`,
      ).exec(html)
      : null;
    const assignedLiteral = assignedMatch?.[1] ?? assignedMatch?.[2] ?? null;
    const takeoverOutLiteral = takeoverMatch?.[1] ?? assignedLiteral ??
      (takeoverOutExpression !== null &&
          /^(?:\d{1,8}|true|false)$/i.test(takeoverOutExpression)
        ? takeoverOutExpression
        : null);
    const restrictedSourceMatch =
      url.pathname.endsWith("/ajax_arc_one_user.php")
        ? /(?:^|,)\s*out\s*:\s*([^\n]{1,128})/i.exec(dataSource)?.[1].trim() ??
          null
        : null;
    const takeoverOutRestrictedSource = restrictedSourceMatch !== null &&
        /^[A-Za-z0-9_$'"{}:,\[\]\s.-]+$/.test(restrictedSourceMatch)
      ? restrictedSourceMatch
      : null;
    const syntaxSource = url.pathname.endsWith("/ajax_arc_one_user.php")
      ? /(?:^|,)\s*out\s*:\s*([\s\S]{0,128}?)(?:,|$)/i.exec(dataSource)?.[1] ??
        null
      : null;
    const redactedSyntax = syntaxSource?.replace(
      /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
      (literal) => {
        const content = literal.slice(1, -1);
        return /^#[A-Za-z0-9_-]{1,64}$/.test(content)
          ? `<selector:${content}>`
          : "<literal>";
      },
    ).replace(/\s+/g, " ").trim() ?? null;
    const takeoverOutSyntax = redactedSyntax !== null &&
        /^[A-Za-z0-9_$<>:().,\[\]\s#-]*$/.test(redactedSyntax)
      ? redactedSyntax
      : null;
    const value = {
      path: url.pathname,
      method: method ?? "UNKNOWN" as const,
      dataKeys: [...new Set(dataKeys)],
      takeoverOutExpression,
      takeoverOutLiteral,
      takeoverOutRestrictedSource,
      takeoverOutSyntax,
    };
    calls.set(
      `${value.path}:${value.method}:${value.dataKeys.join(",")}`,
      value,
    );
  }
  return [...calls.values()].sort((left, right) =>
    left.path.localeCompare(right.path)
  );
}

function takeoverControl(html: string): {
  id: "kick-out";
  tag: string;
  type: string | null;
  name: string | null;
  value: string | null;
} | null {
  const element =
    /<([a-z][a-z0-9]*)\b([^>]{0,512}\bid=["']kick-out["'][^>]{0,512})>/i
      .exec(html);
  if (!element) return null;
  const attribute = (name: string): string | null => {
    const value = new RegExp(`\\b${name}=["']([A-Za-z0-9_-]{1,32})["']`, "i")
      .exec(element[2])?.[1] ?? null;
    return value;
  };
  return {
    id: "kick-out",
    tag: element[1].toLowerCase(),
    type: attribute("type"),
    name: attribute("name"),
    value: attribute("value"),
  };
}

function localRedirect(
  response: RouterResponse,
  fallback: string,
  baseUrl: URL,
): URL {
  const url = new URL(response.headers.get("location") ?? fallback, baseUrl);
  if (url.origin !== baseUrl.origin) {
    throw new Error(
      `Router returned an unexpected cross-origin redirect to ${url.origin}`,
    );
  }
  return url;
}

function requireStatus(
  response: RouterResponse,
  operation: string,
  allowed: number[],
): void {
  if (!allowed.includes(response.status)) {
    const summary = response.body.replace(/\s+/g, " ").trim().slice(0, 200);
    throw new Error(
      `${operation} returned HTTP ${response.status}: ${summary}`,
    );
  }
}

function requireReadOnlyLocation(url: URL): void {
  if (/(?:logout|reboot|actionHandler)/i.test(url.pathname)) {
    throw new Error(
      `Router redirected the read-only session to a rejected path: ${url.pathname}`,
    );
  }
}

async function followLocalRedirects(
  session: CurlSession,
  response: RouterResponse,
  baseUrl: URL,
): Promise<RouterResponse> {
  let current = response;
  for (let redirects = 0; redirects < 5; redirects++) {
    if (current.status < 300 || current.status >= 400) return current;
    const nextUrl = localRedirect(current, "index.php", baseUrl);
    requireReadOnlyLocation(nextUrl);
    current = await session.request(nextUrl, "GET");
    requireStatus(current, "Router redirect request", [200, 301, 302, 303]);
  }
  throw new Error("Router exceeded five same-origin authentication redirects");
}

class CurlSession {
  readonly #directory: string;
  readonly #cookiePath: string;
  readonly #allowInsecureTls: boolean;

  private constructor(directory: string, allowInsecureTls: boolean) {
    this.#directory = directory;
    this.#cookiePath = `${directory}/cookies.txt`;
    this.#allowInsecureTls = allowInsecureTls;
  }

  static async create(allowInsecureTls: boolean): Promise<CurlSession> {
    return new CurlSession(
      await Deno.makeTempDir({ prefix: "speedport-plus-2-" }),
      allowInsecureTls,
    );
  }

  async request(
    url: URL,
    method: "GET" | "POST",
    headers: Headers = new Headers(),
    body?: string,
  ): Promise<RouterResponse> {
    const headerPath = `${this.#directory}/headers.txt`;
    const bodyPath = `${this.#directory}/body.txt`;
    const commandArgs = [
      "--silent",
      "--show-error",
      "--max-time",
      "30",
      "--cookie",
      this.#cookiePath,
      "--cookie-jar",
      this.#cookiePath,
      "--dump-header",
      headerPath,
      "--output",
      bodyPath,
      "--write-out",
      "%{http_code}",
      "--request",
      method,
    ];
    if (this.#allowInsecureTls) commandArgs.push("--insecure");
    for (const [key, value] of headers.entries()) {
      commandArgs.push("--header", `${key}: ${value}`);
    }
    if (body !== undefined) commandArgs.push("--data-binary", "@-");
    commandArgs.push(url.toString());

    let output: Deno.CommandOutput | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const child = new Deno.Command("curl", {
        args: commandArgs,
        stdin: body === undefined ? "null" : "piped",
        stdout: "piped",
        stderr: "piped",
      }).spawn();
      if (body !== undefined) {
        const writer = child.stdin.getWriter();
        await writer.write(new TextEncoder().encode(body));
        await writer.close();
      }
      output = await child.output();
      if (output.success || output.code !== 7 || attempt === 1) break;
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
    if (output === null || !output.success) {
      throw new Error(
        `Router request failed: ${
          output === null
            ? "curl produced no result"
            : new TextDecoder().decode(output.stderr)
        }`,
      );
    }

    const rawHeaders = await Deno.readTextFile(headerPath);
    const responseHeaders = new Headers();
    for (const line of rawHeaders.trim().split(/\r?\n/).slice(1)) {
      const separator = line.indexOf(":");
      if (separator > 0) {
        responseHeaders.append(
          line.slice(0, separator).trim(),
          line.slice(separator + 1).trim(),
        );
      }
    }
    return {
      url,
      status: Number(new TextDecoder().decode(output.stdout)),
      headers: responseHeaders,
      body: await Deno.readTextFile(bodyPath),
    };
  }

  async cookie(name: string): Promise<string | null> {
    try {
      const cookieFile = await Deno.readTextFile(this.#cookiePath);
      for (const line of cookieFile.split(/\r?\n/)) {
        const normalized = line.startsWith("#HttpOnly_")
          ? line.slice("#HttpOnly_".length)
          : line;
        if (normalized.startsWith("#") || normalized.trim() === "") continue;
        const fields = normalized.split("\t");
        if (fields.length >= 7 && fields[5] === name) return fields[6];
      }
      return null;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return null;
      throw error;
    }
  }

  async close(): Promise<void> {
    await Deno.remove(this.#directory, { recursive: true });
  }
}

async function releaseOwnedSession(
  session: CurlSession,
  baseUrl: URL,
): Promise<{ released: boolean; error: string | null }> {
  try {
    const response = await session.request(
      new URL("home_loggedout.php", baseUrl),
      "GET",
    );
    if (![200, 301, 302, 303].includes(response.status)) {
      return {
        released: false,
        error: `Router logout returned HTTP ${response.status}`,
      };
    }
    return { released: true, error: null };
  } catch (error) {
    return {
      released: false,
      error: error instanceof Error
        ? error.message.slice(0, 200)
        : "Unknown router logout error",
    };
  }
}

async function openAuthenticatedSession(args: GlobalArgs): Promise<{
  session: CurlSession;
  baseUrl: URL;
  html: string;
  loginHtml: string;
  pageUrl: URL;
}> {
  const baseUrl = new URL(args.baseUrl);
  const session = await CurlSession.create(args.allowInsecureTls);

  try {
    const initial = await session.request(baseUrl, "GET");
    requireStatus(initial, "Router entry request", [200, 301, 302, 303]);
    const loginUrl = localRedirect(initial, "login.php", baseUrl);
    const loginResponse = await session.request(loginUrl, "GET");
    requireStatus(loginResponse, "Router login-page request", [200]);
    const loginHtml = loginResponse.body;
    const keySeed = match(loginHtml, /var\s+oNORy36t65\s*=\s*['"]([^'"]+)['"]/);
    if (!keySeed) throw new Error("Router login encryption key was not found");

    const inner = JSON.stringify({
      username: await encrypt(args.username, keySeed),
      password: await encrypt(args.password, keySeed),
    });
    const form = new URLSearchParams({
      enc_data: await encrypt(inner, keySeed),
    });
    const headers = new Headers({
      "content-type": "application/x-www-form-urlencoded",
      "referer": loginUrl.toString(),
    });

    const checkResponse = await session.request(
      new URL("check.php", baseUrl),
      "POST",
      headers,
      form.toString(),
    );
    requireStatus(checkResponse, "Router authentication request", [
      200,
      301,
      302,
      303,
    ]);
    const homeResponse = await followLocalRedirects(
      session,
      checkResponse,
      baseUrl,
    );
    requireStatus(homeResponse, "Router authenticated-page request", [200]);
    const html = homeResponse.body;

    if (/action=["']check\.php["']/i.test(html)) {
      throw new Error(
        "Router authentication failed or returned to the login page",
      );
    }
    return {
      session,
      baseUrl,
      html,
      loginHtml,
      pageUrl: homeResponse.url,
    };
  } catch (error) {
    await session.close();
    throw error;
  }
}

async function authenticatedHome(args: GlobalArgs): Promise<{
  html: string;
  loginHtml: string;
  pageUrl: URL;
  sessionReleased: boolean | null;
  sessionReleaseError: string | null;
}> {
  const authenticated = await openAuthenticatedSession(args);
  try {
    const conflict = /another user|already logged in|active session/i.test(
      authenticated.html,
    );
    const release = conflict
      ? null
      : await releaseOwnedSession(authenticated.session, authenticated.baseUrl);
    return {
      html: authenticated.html,
      loginHtml: authenticated.loginHtml,
      pageUrl: authenticated.pageUrl,
      sessionReleased: release?.released ?? null,
      sessionReleaseError: release?.error ?? null,
    };
  } finally {
    await authenticated.session.close();
  }
}

/** Read-only model for the Arcadyan Speedport Plus 2 web interface. */
export const model = {
  type: "@dieter/speedport-plus-2",
  version: "2026.08.24.12",
  globalArguments: GlobalArgsSchema,
  resources: {
    snapshot: {
      description: "Read-only router web-interface snapshot",
      schema: SnapshotSchema,
      lifetime: "infinite",
      garbageCollection: 30,
    },
    sessionAction: {
      description: "Audit result for an explicit router session action",
      schema: SessionActionSchema,
      lifetime: "infinite",
      garbageCollection: 30,
    },
    pageCatalog: {
      description:
        "Authenticated router page paths discovered from menu scripts",
      schema: PageCatalogSchema,
      lifetime: "infinite",
      garbageCollection: 10,
    },
    pageInspection: {
      description: "Structural metadata for one authenticated router page",
      schema: PageInspectionSchema,
      lifetime: "infinite",
      garbageCollection: 30,
    },
    statusFieldCatalog: {
      description: "Static field contract for router status pages",
      schema: StatusFieldCatalogSchema,
      lifetime: "infinite",
      garbageCollection: 10,
    },
    logContract: {
      description: "Non-content metadata for the router log-query response",
      schema: LogContractSchema,
      lifetime: "infinite",
      garbageCollection: 10,
    },
    routerStatus: {
      description: "Current read-only router connection status",
      schema: RouterStatusSchema,
      lifetime: "infinite",
      garbageCollection: 30,
    },
    deviceContract: {
      description: "Redacted structure of connected-device records",
      schema: DeviceContractSchema,
      lifetime: "infinite",
      garbageCollection: 10,
    },
    deviceInventory: {
      description: "Online devices reported by the router",
      schema: DeviceInventorySchema,
      lifetime: "infinite",
      garbageCollection: 30,
    },
  },
  checks: {
    "private-router-action": {
      description:
        "Restrict mutating actions to the configured private HTTPS router",
      labels: ["policy"],
      appliesTo: ["action"],
      execute: (context: { globalArgs: GlobalArgs }): {
        pass: boolean;
        errors?: string[];
      } => {
        const url = new URL(context.globalArgs.baseUrl);
        const pass = url.protocol === "https:" &&
          url.hostname === "192.168.1.1";
        return pass ? { pass: true } : {
          pass: false,
          errors: ["Session takeover is restricted to https://192.168.1.1/"],
        };
      },
    },
  },
  methods: {
    listDevices: {
      description: "List online devices reported by the router",
      arguments: z.object({}),
      execute: async (
        _methodArgs: Record<string, never>,
        context: {
          globalArgs: GlobalArgs;
          logger: {
            info: (
              message: string,
              properties?: Record<string, unknown>,
            ) => void;
          };
          writeResource: (
            specName: string,
            name: string,
            data: z.infer<typeof DeviceInventorySchema>,
          ) => Promise<{ name: string }>;
        },
      ): Promise<{ dataHandles: Array<{ name: string }> }> => {
        context.logger.info("Reading router online-device inventory");
        const authenticated = await openAuthenticatedSession(
          context.globalArgs,
        );
        const conflict = /another user|already logged in|active session/i.test(
          authenticated.html,
        );
        let releaseAttempted = false;
        try {
          if (conflict) {
            throw new Error(
              "Router presented a session conflict; run the explicit takeover action first",
            );
          }
          const sourcePage = "/connected_devices_computers.php" as const;
          const response = await authenticated.session.request(
            new URL(sourcePage, authenticated.baseUrl),
            "GET",
          );
          requireStatus(response, "Router connected-device page request", [
            200,
          ]);
          const hostnames = stringArray(response.body, "onlineHostNameArr");
          const macAddresses = stringArray(response.body, "onlineHostMAC");
          const instances = scalarArray(
            response.body,
            "onlineDeviceInstanceArr",
          );
          if (hostnames.length !== macAddresses.length) {
            throw new Error(
              `Router device arrays are misaligned: ${hostnames.length} hostnames and ${macAddresses.length} MAC addresses`,
            );
          }
          if (
            instances.length > 0 && instances.length !== macAddresses.length
          ) {
            throw new Error(
              `Router device instance array is misaligned: ${instances.length} instances and ${macAddresses.length} MAC addresses`,
            );
          }
          if (instances.some((instance) => !/^\d+$/.test(instance))) {
            throw new Error(
              "Router device instance array contains a non-numeric value",
            );
          }
          const devices = macAddresses.map((macAddress, index) => {
            if (!/^[0-9a-f]{2}(?::[0-9a-f]{2}){5}$/i.test(macAddress)) {
              throw new Error(
                `Router returned an invalid MAC address at device index ${index}`,
              );
            }
            return {
              index,
              hostname: hostnames[index].trim() || null,
              macAddress: macAddress.toLowerCase(),
              instance: instances[index] ?? null,
              online: true as const,
            };
          });
          const release = await releaseOwnedSession(
            authenticated.session,
            authenticated.baseUrl,
          );
          releaseAttempted = true;
          const result = {
            observedAt: new Date().toISOString(),
            devices,
            sourcePage,
            sessionReleased: release.released,
            sessionReleaseError: release.error,
          };
          const handle = await context.writeResource(
            "deviceInventory",
            "router-online-devices",
            result,
          );
          context.logger.info("Read router online-device inventory", {
            deviceCount: result.devices.length,
            sessionReleased: result.sessionReleased,
          });
          return { dataHandles: [handle] };
        } finally {
          if (!conflict && !releaseAttempted) {
            await releaseOwnedSession(
              authenticated.session,
              authenticated.baseUrl,
            );
          }
          await authenticated.session.close();
        }
      },
    },
    inspectDeviceContract: {
      description:
        "Inspect redacted structure of authenticated connected-device records",
      arguments: z.object({}),
      execute: async (
        _methodArgs: Record<string, never>,
        context: {
          globalArgs: GlobalArgs;
          logger: {
            info: (
              message: string,
              properties?: Record<string, unknown>,
            ) => void;
          };
          writeResource: (
            specName: string,
            name: string,
            data: z.infer<typeof DeviceContractSchema>,
          ) => Promise<{ name: string }>;
        },
      ): Promise<{ dataHandles: Array<{ name: string }> }> => {
        context.logger.info("Inspecting connected-device record structure");
        const authenticated = await openAuthenticatedSession(
          context.globalArgs,
        );
        const conflict = /another user|already logged in|active session/i.test(
          authenticated.html,
        );
        let releaseAttempted = false;
        try {
          if (conflict) {
            throw new Error(
              "Router presented a session conflict; run the explicit takeover action first",
            );
          }
          const pagePath = "/connected_devices_computers.php" as const;
          const response = await authenticated.session.request(
            new URL(pagePath, authenticated.baseUrl),
            "GET",
          );
          requireStatus(response, "Router connected-device page request", [
            200,
          ]);
          const contract = deviceContractContexts(response.body);
          const release = await releaseOwnedSession(
            authenticated.session,
            authenticated.baseUrl,
          );
          releaseAttempted = true;
          const result = {
            observedAt: new Date().toISOString(),
            pagePath,
            ...contract,
            sessionReleased: release.released,
            sessionReleaseError: release.error,
          };
          const handle = await context.writeResource(
            "deviceContract",
            "router-device-contract",
            result,
          );
          context.logger.info("Inspected connected-device record structure", {
            ipv4OccurrenceCount: result.ipv4OccurrenceCount,
            macOccurrenceCount: result.macOccurrenceCount,
            sessionReleased: result.sessionReleased,
          });
          return { dataHandles: [handle] };
        } finally {
          if (!conflict && !releaseAttempted) {
            await releaseOwnedSession(
              authenticated.session,
              authenticated.baseUrl,
            );
          }
          await authenticated.session.close();
        }
      },
    },
    status: {
      description: "Read current WAN and DSL connection status",
      arguments: z.object({}),
      execute: async (
        _methodArgs: Record<string, never>,
        context: {
          globalArgs: GlobalArgs;
          logger: {
            info: (
              message: string,
              properties?: Record<string, unknown>,
            ) => void;
          };
          writeResource: (
            specName: string,
            name: string,
            data: z.infer<typeof RouterStatusSchema>,
          ) => Promise<{ name: string }>;
        },
      ): Promise<{ dataHandles: Array<{ name: string }> }> => {
        context.logger.info("Reading router connection status");
        const authenticated = await openAuthenticatedSession(
          context.globalArgs,
        );
        const conflict = /another user|already logged in|active session/i.test(
          authenticated.html,
        );
        let releaseAttempted = false;
        try {
          if (conflict) {
            throw new Error(
              "Router presented a session conflict; run the explicit takeover action first",
            );
          }
          const sourcePages = [
            "/connection_status.php",
            "/arc_xdsl_statistic.php",
          ];
          const pages = [];
          for (const sourcePage of sourcePages) {
            const response = await authenticated.session.request(
              new URL(sourcePage, authenticated.baseUrl),
              "GET",
            );
            requireStatus(
              response,
              `Router status request for ${sourcePage}`,
              [200],
            );
            pages.push(response.body);
          }
          const connection = readonlyValues(pages[0]);
          const dsl = readonlyValues(pages[1]);
          const result: z.infer<typeof RouterStatusSchema> = {
            observedAt: new Date().toISOString(),
            internetState: connection.get("internet") ?? null,
            wanProtocol: connection.get("wan protocol") ?? null,
            wanIpAddress: connection.get("wan ip address") ?? null,
            workingStatus: connection.get("working status") ?? null,
            dslLinkStatus: dsl.get("dsl link status") ?? null,
            downstreamSyncRate: dsl.get("downstream sync rate") ?? null,
            upstreamSyncRate: dsl.get("upstream sync rate") ?? null,
            downstreamSnrMargin: dsl.get("downstream snr margin") ?? null,
            upstreamSnrMargin: dsl.get("upstream snr margin") ?? null,
            attenuationDown: dsl.get("attenuation down") ?? null,
            attenuationUp: dsl.get("attenuation up") ?? null,
            crcErrors: dsl.get("crc errors") ?? null,
            fecErrors: dsl.get("fec errors") ?? null,
            routerUptime: null,
            uptimeUnavailableReason:
              "not-exposed-by-observed-router-pages-or-logs" as const,
            sourcePages,
            sessionReleased: false,
            sessionReleaseError: null,
          };
          if (
            result.internetState === null &&
            result.workingStatus === null &&
            result.dslLinkStatus === null
          ) {
            throw new Error(
              "Router status pages no longer match the observed readonly-field structure",
            );
          }
          const release = await releaseOwnedSession(
            authenticated.session,
            authenticated.baseUrl,
          );
          releaseAttempted = true;
          result.sessionReleased = release.released;
          result.sessionReleaseError = release.error;
          const handle = await context.writeResource(
            "routerStatus",
            "router-status",
            result,
          );
          context.logger.info("Read router connection status", {
            hasInternetState: result.internetState !== null,
            hasWanProtocol: result.wanProtocol !== null,
            hasWorkingStatus: result.workingStatus !== null,
            hasDslLinkStatus: result.dslLinkStatus !== null,
            sessionReleased: result.sessionReleased,
          });
          return { dataHandles: [handle] };
        } finally {
          if (!conflict && !releaseAttempted) {
            await releaseOwnedSession(
              authenticated.session,
              authenticated.baseUrl,
            );
          }
          await authenticated.session.close();
        }
      },
    },
    inspectLogContract: {
      description:
        "Inspect response metadata for the router's read-only log query",
      arguments: z.object({
        category: LogCategorySchema,
        timeFrame: LogTimeFrameSchema,
      }),
      execute: async (
        methodArgs: {
          category: z.infer<typeof LogCategorySchema>;
          timeFrame: z.infer<typeof LogTimeFrameSchema>;
        },
        context: {
          globalArgs: GlobalArgs;
          logger: {
            info: (
              message: string,
              properties?: Record<string, unknown>,
            ) => void;
          };
          writeResource: (
            specName: string,
            name: string,
            data: z.infer<typeof LogContractSchema>,
          ) => Promise<{ name: string }>;
        },
      ): Promise<{ dataHandles: Array<{ name: string }> }> => {
        context.logger.info("Inspecting router log-query response contract", {
          category: methodArgs.category,
          timeFrame: methodArgs.timeFrame,
        });
        const authenticated = await openAuthenticatedSession(
          context.globalArgs,
        );
        const conflict = /another user|already logged in|active session/i.test(
          authenticated.html,
        );
        let releaseAttempted = false;
        try {
          if (conflict) {
            throw new Error(
              "Router presented a session conflict; run the explicit takeover action first",
            );
          }
          const pageUrl = new URL(
            "troubleshooting_logs.php",
            authenticated.baseUrl,
          );
          const page = await authenticated.session.request(pageUrl, "GET");
          requireStatus(page, "Router log-page request", [200]);
          const csrfToken = await authenticated.session.cookie("csrfp_token");
          if (!csrfToken) {
            throw new Error("Router CSRF cookie was not available");
          }
          const handlerPath =
            "/actionHandler/ajax_troubleshooting_logs.php" as const;
          const form = new URLSearchParams({
            mode: methodArgs.category,
            timef: methodArgs.timeFrame,
            csrfp_token: csrfToken,
          });
          const response = await authenticated.session.request(
            new URL(handlerPath, authenticated.baseUrl),
            "POST",
            new Headers({
              "content-type": "application/x-www-form-urlencoded",
              "referer": pageUrl.toString(),
            }),
            form.toString(),
          );
          requireStatus(response, "Router log-query request", [200]);
          let bodyKind: "json" | "html" | "text" = "text";
          let topLevelKeys: string[] = [];
          try {
            const parsed: unknown = JSON.parse(response.body);
            bodyKind = "json";
            if (
              parsed !== null && typeof parsed === "object" &&
              !Array.isArray(parsed)
            ) {
              topLevelKeys = Object.keys(parsed)
                .filter((key) => /^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(key))
                .sort();
            }
          } catch {
            if (/<[a-z][\s\S]*>/i.test(response.body)) bodyKind = "html";
          }
          const refreshedPage = await authenticated.session.request(
            pageUrl,
            "GET",
          );
          requireStatus(refreshedPage, "Router refreshed log-page request", [
            200,
          ]);
          const suffixByTimeFrame = {
            "Today": "today",
            "Yesterday": "yesterday",
            "Last week": "week",
            "Last month": "month",
            "Last 90 days": "last",
          } as const;
          const selectedContainerId = `${methodArgs.category}_logs_${
            suffixByTimeFrame[methodArgs.timeFrame]
          }`;
          const selectedContainer = logContainerMetadata(refreshedPage.body)
            .find((container) => container.id === selectedContainerId) ?? null;
          const release = await releaseOwnedSession(
            authenticated.session,
            authenticated.baseUrl,
          );
          releaseAttempted = true;
          const result = {
            observedAt: new Date().toISOString(),
            category: methodArgs.category,
            timeFrame: methodArgs.timeFrame,
            handlerPath,
            httpStatus: response.status,
            contentType: response.headers.get("content-type"),
            bodyKind,
            byteLength: new TextEncoder().encode(response.body).byteLength,
            topLevelKeys,
            tableHeaders: uniqueTagText(response.body, "th"),
            endpointShapes: uniqueEndpointShapes(
              response.body,
              authenticated.baseUrl,
            ),
            refreshedPageStatus: refreshedPage.status,
            selectedContainer,
            sessionReleased: release.released,
            sessionReleaseError: release.error,
          };
          const instanceName = `router-log-contract-${methodArgs.category}-${
            methodArgs.timeFrame.toLowerCase().replaceAll(" ", "-")
          }`;
          const handle = await context.writeResource(
            "logContract",
            instanceName,
            result,
          );
          context.logger.info("Inspected router log-query response contract", {
            category: result.category,
            timeFrame: result.timeFrame,
            bodyKind: result.bodyKind,
            byteLength: result.byteLength,
            sessionReleased: result.sessionReleased,
          });
          return { dataHandles: [handle] };
        } finally {
          if (!conflict && !releaseAttempted) {
            await releaseOwnedSession(
              authenticated.session,
              authenticated.baseUrl,
            );
          }
          await authenticated.session.close();
        }
      },
    },
    discoverStatusFields: {
      description: "Discover static fields used by router status pages",
      arguments: z.object({}),
      execute: async (
        _methodArgs: Record<string, never>,
        context: {
          globalArgs: GlobalArgs;
          logger: {
            info: (
              message: string,
              properties?: Record<string, unknown>,
            ) => void;
          };
          writeResource: (
            specName: string,
            name: string,
            data: z.infer<typeof StatusFieldCatalogSchema>,
          ) => Promise<{ name: string }>;
        },
      ): Promise<{ dataHandles: Array<{ name: string }> }> => {
        context.logger.info("Discovering router status-page field contracts");
        const authenticated = await openAuthenticatedSession(
          context.globalArgs,
        );
        const conflict = /another user|already logged in|active session/i.test(
          authenticated.html,
        );
        let releaseAttempted = false;
        try {
          if (conflict) {
            throw new Error(
              "Router presented a session conflict; run the explicit takeover action first",
            );
          }
          const pagePaths = [
            "/at_a_glance.php",
            "/connection_status.php",
            "/hardware.php",
            "/software.php",
            "/arc_xdsl_statistic.php",
            "/troubleshooting_logs.php",
          ] as const;
          const pages = [];
          for (const pagePath of pagePaths) {
            const response = await authenticated.session.request(
              new URL(pagePath, authenticated.baseUrl),
              "GET",
            );
            requireStatus(
              response,
              `Router status-field request for ${pagePath}`,
              [200],
            );
            pages.push({
              pagePath,
              elementIds: uniqueAttributeValues(response.body, "id"),
              fieldNames: uniqueAttributeValues(response.body, "name"),
              labels: uniqueTagText(response.body, "label"),
              tableHeaders: uniqueTagText(response.body, "th"),
              selectControls: pagePath === "/troubleshooting_logs.php"
                ? selectControls(response.body)
                : [],
              statusBindings: pagePath === "/at_a_glance.php"
                ? []
                : statusBindings(response.body),
              logContainers: pagePath === "/troubleshooting_logs.php"
                ? logContainerMetadata(response.body)
                : [],
            });
          }
          const release = await releaseOwnedSession(
            authenticated.session,
            authenticated.baseUrl,
          );
          releaseAttempted = true;
          const result = {
            observedAt: new Date().toISOString(),
            pages,
            sessionReleased: release.released,
            sessionReleaseError: release.error,
          };
          const handle = await context.writeResource(
            "statusFieldCatalog",
            "router-status-field-catalog",
            result,
          );
          context.logger.info("Discovered router status-page field contracts", {
            pageCount: result.pages.length,
            sessionReleased: result.sessionReleased,
          });
          return { dataHandles: [handle] };
        } finally {
          if (!conflict && !releaseAttempted) {
            await releaseOwnedSession(
              authenticated.session,
              authenticated.baseUrl,
            );
          }
          await authenticated.session.close();
        }
      },
    },
    inspectPage: {
      description:
        "Inspect non-sensitive structure of an authenticated status page",
      arguments: z.object({ pagePath: InspectablePageSchema }),
      execute: async (
        methodArgs: { pagePath: z.infer<typeof InspectablePageSchema> },
        context: {
          globalArgs: GlobalArgs;
          logger: {
            info: (
              message: string,
              properties?: Record<string, unknown>,
            ) => void;
          };
          writeResource: (
            specName: string,
            name: string,
            data: z.infer<typeof PageInspectionSchema>,
          ) => Promise<{ name: string }>;
        },
      ): Promise<{ dataHandles: Array<{ name: string }> }> => {
        context.logger.info("Inspecting authenticated router page", {
          pagePath: methodArgs.pagePath,
        });
        const authenticated = await openAuthenticatedSession(
          context.globalArgs,
        );
        const conflict = /another user|already logged in|active session/i.test(
          authenticated.html,
        );
        let releaseAttempted = false;
        try {
          if (conflict) {
            throw new Error(
              "Router presented a session conflict; run the explicit takeover action first",
            );
          }
          const response = await authenticated.session.request(
            new URL(methodArgs.pagePath, authenticated.baseUrl),
            "GET",
          );
          requireStatus(response, "Router page inspection request", [200]);
          const release = await releaseOwnedSession(
            authenticated.session,
            authenticated.baseUrl,
          );
          releaseAttempted = true;
          const result = {
            observedAt: new Date().toISOString(),
            pagePath: methodArgs.pagePath,
            pageTitle: match(response.body, /<title[^>]*>([^<]*)<\/title>/i),
            pageHeading: match(response.body, /<h1[^>]*>([^<]*)<\/h1>/i),
            scriptPaths: uniqueLocalPaths(
              response.body,
              "src",
              authenticated.baseUrl,
            ),
            formActions: uniqueLocalPaths(
              response.body,
              "action",
              authenticated.baseUrl,
            ),
            endpointShapes: uniqueEndpointShapes(
              response.body,
              authenticated.baseUrl,
            ),
            ajaxCalls: ajaxCalls(response.body, authenticated.baseUrl),
            sessionReleased: release.released,
            sessionReleaseError: release.error,
          };
          const instanceName = `router-page-${
            methodArgs.pagePath.slice(1, -4).replaceAll("_", "-")
          }`;
          const handle = await context.writeResource(
            "pageInspection",
            instanceName,
            result,
          );
          context.logger.info("Inspected authenticated router page", {
            pagePath: result.pagePath,
            endpointCount: result.endpointShapes.length,
            ajaxCallCount: result.ajaxCalls.length,
            sessionReleased: result.sessionReleased,
          });
          return { dataHandles: [handle] };
        } finally {
          if (!conflict && !releaseAttempted) {
            await releaseOwnedSession(
              authenticated.session,
              authenticated.baseUrl,
            );
          }
          await authenticated.session.close();
        }
      },
    },
    discoverPages: {
      description: "Discover authenticated router pages from its menu scripts",
      arguments: z.object({}),
      execute: async (
        _methodArgs: Record<string, never>,
        context: {
          globalArgs: GlobalArgs;
          logger: {
            info: (
              message: string,
              properties?: Record<string, unknown>,
            ) => void;
          };
          writeResource: (
            specName: string,
            name: string,
            data: z.infer<typeof PageCatalogSchema>,
          ) => Promise<{ name: string }>;
        },
      ): Promise<{ dataHandles: Array<{ name: string }> }> => {
        context.logger.info("Discovering authenticated router page catalog");
        const authenticated = await openAuthenticatedSession(
          context.globalArgs,
        );
        const conflict = /another user|already logged in|active session/i.test(
          authenticated.html,
        );
        let releaseAttempted = false;
        try {
          if (conflict) {
            throw new Error(
              "Router presented a session conflict; run the explicit takeover action first",
            );
          }
          const sources = ["/js/menu.js", "/lang/en/menulist.js"];
          const pagePaths = new Set<string>();
          for (const source of sources) {
            const response = await authenticated.session.request(
              new URL(source, authenticated.baseUrl),
              "GET",
            );
            requireStatus(
              response,
              `Router menu-script request for ${source}`,
              [
                200,
              ],
            );
            for (
              const path of uniqueEndpointShapes(
                response.body,
                authenticated.baseUrl,
              )
            ) {
              pagePaths.add(path);
            }
          }
          if (pagePaths.size === 0) {
            throw new Error(
              "Router menu scripts contained no discoverable PHP pages",
            );
          }
          const release = await releaseOwnedSession(
            authenticated.session,
            authenticated.baseUrl,
          );
          releaseAttempted = true;
          const result = {
            observedAt: new Date().toISOString(),
            sources,
            pagePaths: [...pagePaths].sort(),
            sessionReleased: release.released,
            sessionReleaseError: release.error,
          };
          const handle = await context.writeResource(
            "pageCatalog",
            "router-page-catalog",
            result,
          );
          context.logger.info("Discovered authenticated router page catalog", {
            pageCount: result.pagePaths.length,
            sessionReleased: result.sessionReleased,
          });
          return { dataHandles: [handle] };
        } finally {
          if (!conflict && !releaseAttempted) {
            await releaseOwnedSession(
              authenticated.session,
              authenticated.baseUrl,
            );
          }
          await authenticated.session.close();
        }
      },
    },
    snapshot: {
      description: "Authenticate and capture non-sensitive router UI metadata",
      arguments: z.object({}),
      execute: async (
        _methodArgs: Record<string, never>,
        context: {
          globalArgs: GlobalArgs;
          logger: {
            info: (
              message: string,
              properties?: Record<string, unknown>,
            ) => void;
          };
          writeResource: (
            specName: string,
            name: string,
            data: z.infer<typeof SnapshotSchema>,
          ) => Promise<{ name: string }>;
        },
      ): Promise<{ dataHandles: Array<{ name: string }> }> => {
        context.logger.info(
          "Capturing a read-only router snapshot from {baseUrl}",
          { baseUrl: context.globalArgs.baseUrl },
        );
        const {
          html,
          loginHtml,
          pageUrl,
          sessionReleased,
          sessionReleaseError,
        } = await authenticatedHome(
          context.globalArgs,
        );
        const baseUrl = new URL(context.globalArgs.baseUrl);
        const sessionConflict = /another user|already logged in|active session/i
          .test(html);
        const snapshot = {
          observedAt: new Date().toISOString(),
          baseUrl: context.globalArgs.baseUrl,
          firmwareUiVersion: match(
            loginHtml,
            /var\s+MP_Ver\s*=\s*['"]([^'"]+)['"]/,
          ),
          firmwareGeneration: match(
            loginHtml,
            /var\s+MP_FW\s*=\s*['"]([^'"]+)['"]/,
          ),
          pagePath: pageUrl.pathname,
          pageTitle: match(html, /<title[^>]*>\s*([^<]+?)\s*<\/title>/i),
          pageHeading: match(
            html,
            /<h[1-4][^>]*>\s*([^<]+?)\s*<\/h[1-4]>/i,
          ),
          sessionState: sessionConflict
            ? "session-conflict" as const
            : "authenticated" as const,
          links: uniqueLocalPaths(html, "href", baseUrl),
          scripts: uniqueLocalPaths(html, "src", baseUrl),
          formActions: uniqueLocalPaths(html, "action", baseUrl),
          endpointShapes: uniqueEndpointShapes(html, baseUrl),
          ajaxCalls: ajaxCalls(html, baseUrl),
          takeoverControl: takeoverControl(html),
          sessionReleased,
          sessionReleaseError,
        };
        const handle = await context.writeResource(
          "snapshot",
          "router-snapshot",
          snapshot,
        );
        context.logger.info("Captured read-only router snapshot", {
          linkCount: snapshot.links.length,
        });
        return { dataHandles: [handle] };
      },
    },
    action: {
      description: "Explicitly take over the router's stale web session",
      arguments: z.object({
        operation: z.literal("take-over-session"),
        confirm: z.literal(true),
      }),
      execute: async (
        _methodArgs: { operation: "take-over-session"; confirm: true },
        context: {
          globalArgs: GlobalArgs;
          logger: {
            info: (
              message: string,
              properties?: Record<string, unknown>,
            ) => void;
          };
          writeResource: (
            specName: string,
            name: string,
            data: z.infer<typeof SessionActionSchema>,
          ) => Promise<{ name: string }>;
        },
      ): Promise<{ dataHandles: Array<{ name: string }> }> => {
        context.logger.info("Opening router session for explicit takeover");
        const authenticated = await openAuthenticatedSession(
          context.globalArgs,
        );
        try {
          const conflictDetected =
            /another user|already logged in|active session/i
              .test(authenticated.html);
          if (
            !conflictDetected ||
            authenticated.pageUrl.pathname !== "/arc_one_user_login.php"
          ) {
            throw new Error(
              "Router did not present the verified stale-session page",
            );
          }

          const response = await authenticated.session.request(
            new URL(
              "actionHandler/ajax_arc_one_user.php",
              authenticated.baseUrl,
            ),
            "POST",
            new Headers({
              "content-type": "application/x-www-form-urlencoded",
              "referer": authenticated.pageUrl.toString(),
            }),
            new URLSearchParams({
              out: "1",
              csrfp_token: await authenticated.session.cookie("csrfp_token") ??
                (() => {
                  throw new Error("Router CSRF cookie was not available");
                })(),
            }).toString(),
          );

          let verified = false;
          let finalPagePath: string | null = null;
          let verificationError: string | null = null;
          let authenticatedLinks: string[] | null = null;
          let authenticatedEndpointShapes: string[] | null = null;
          let sessionReleased = false;
          let sessionReleaseError: string | null = null;
          if (response.status !== 200) {
            verificationError =
              `Router session handler returned HTTP ${response.status}`;
          } else {try {
              const finalResponse = await followLocalRedirects(
                authenticated.session,
                await authenticated.session.request(
                  new URL("index.php", authenticated.baseUrl),
                  "GET",
                ),
                authenticated.baseUrl,
              );
              requireStatus(
                finalResponse,
                "Router post-takeover verification",
                [
                  200,
                ],
              );
              finalPagePath = finalResponse.url.pathname;
              verified = !/another user|already logged in|active session/i
                .test(finalResponse.body) &&
                !/action=["']check\.php["']/i.test(finalResponse.body);
              authenticatedLinks = uniqueLocalPaths(
                finalResponse.body,
                "href",
                authenticated.baseUrl,
              );
              authenticatedEndpointShapes = uniqueEndpointShapes(
                finalResponse.body,
                authenticated.baseUrl,
              );
            } catch (error) {
              verificationError = error instanceof Error
                ? error.message.slice(0, 200)
                : "Unknown verification error";
            }}
          if (verified) {
            const release = await releaseOwnedSession(
              authenticated.session,
              authenticated.baseUrl,
            );
            sessionReleased = release.released;
            sessionReleaseError = release.error;
          }
          const result = {
            performedAt: new Date().toISOString(),
            operation: "take-over-session" as const,
            conflictDetected,
            handlerStatus: response.status,
            verified,
            finalPagePath,
            verificationError,
            authenticatedLinks,
            authenticatedEndpointShapes,
            sessionReleased,
            sessionReleaseError,
          };
          const handle = await context.writeResource(
            "sessionAction",
            "session-takeover",
            result,
          );
          context.logger.info("Router session takeover completed", {
            verified,
            finalPagePath: result.finalPagePath,
          });
          return { dataHandles: [handle] };
        } finally {
          await authenticated.session.close();
        }
      },
    },
  },
};
