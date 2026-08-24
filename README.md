# @dieter/speedport-plus-2

Observe an Arcadyan Speedport Plus 2 router through its web interface using
Swamp. Credentials are sensitive global arguments, allowing definitions to
reference a Swamp vault without embedding secrets in the extension or model
configuration.

The extension uses the router's native encrypted login protocol and system
`curl` because the router presents a self-signed TLS certificate. System
`openssl` performs the firmware-compatible AES operation. A browser automation
driver was considered, but it adds a large runtime dependency and is inferior
for typed, repeatable status collection. Disabling TLS verification globally was
rejected; insecure TLS is an explicit argument and mutating session action is
restricted to the expected private router address.

Router URLs must use HTTPS and cannot contain embedded credentials. Plain HTTP
was rejected even for private addresses because authentication data crosses the
connection; `allowInsecureTls` is the narrower option for a self-signed router
certificate.

`expectedHost` must exactly match the URL hostname. When `allowInsecureTls` is
enabled, `pinnedPublicKey` is also required in curl's `sha256//BASE64` format.
The pin preserves endpoint authentication even though normal certificate-chain
validation is disabled; hostname matching alone was considered insufficient
because another device could impersonate the same private address.

Read-only discovery methods log out after every authenticated session. Session
takeover is kept in a separate action that requires explicit confirmation
because it changes router session state.

## Diagnostics

`status` stores current Internet, WAN, and xDSL state, including sync rates, SNR
margins, attenuation, and CRC/FEC error counters:

```sh
swamp model method run home-router status
```

Pass an optional `name` to keep experiment-specific captures separate. Without
it, `status` retains the general `router-status` fallback:

```sh
swamp model method run home-router status \
  --input name=incident_router-reboot_post_status
```

`listDevices` stores the online hostname, MAC address, and router instance for
each device. These values remain in the consuming repository's Swamp data; they
are not logged by the extension:

```sh
swamp model method run home-router listDevices
```

The router UI exposes system, event, and firewall log filters for Today,
Yesterday, Last week, Last month, and Last 90 days. `collectLogs` fetches all
three categories in one authenticated session and stores each response body
exactly:

```sh
swamp model method run home-router collectLogs \
  --input 'timeFrame=Last 90 days' \
  --input name=incident_router-reboot_post_logs
```

When `name` is omitted, log collection retains the general fallback derived from
the time frame, such as `router-logs-last-90-days`.

Exact bodies were chosen because the firmware's undocumented category schemas
differ; prematurely normalizing them could discard timestamps, messages,
addresses, or counters. Each category is limited to 5 MiB so an unexpectedly
large router response fails without creating a partial resource.
`inspectLogContract` remains available for content-free interface discovery.

Router uptime, connected-device IP addresses, and physical LAN-port attachment
are not exposed by the verified UI structures. The extension reports uptime as
unavailable instead of inferring it; consumers may inspect retained event logs
for a boot record, but absence of such a record is not evidence of uptime.

The verified router sometimes refuses the first TCP connection while a fresh
Swamp invocation immediately afterward succeeds. The extension retries once for
curl connection error 7; callers may need to rerun the method if the refusal
persists.

## Requirements

- Linux x86-64
- `curl`
- `openssl`
- Network access to the router web interface

Only Linux x86-64 is declared because it is the platform currently verified.

## Install

```sh
swamp extension pull @dieter/speedport-plus-2
```

Create a model definition with vault-backed credentials:

```sh
swamp model create @dieter/speedport-plus-2 home-router \
  --global-arg baseUrl=https://192.168.1.1/ \
  --global-arg expectedHost=192.168.1.1 \
  --global-arg 'username=${{ vault.get(router-secrets, ROUTER_USERNAME) }}' \
  --global-arg 'password=${{ vault.get(router-secrets, ROUTER_PASSWORD) }}' \
  --global-arg allowInsecureTls=true \
  --global-arg pinnedPublicKey=sha256//REPLACE_WITH_ROUTER_PUBLIC_KEY_PIN
```

## License

MIT. See `LICENSE`.
