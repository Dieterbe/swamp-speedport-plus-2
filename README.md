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

Read-only discovery methods log out after every authenticated session. Session
takeover is kept in a separate action that requires explicit confirmation
because it changes router session state.

## Diagnostics

`status` stores current Internet, WAN, and xDSL state, including sync rates, SNR
margins, attenuation, and CRC/FEC error counters:

```sh
swamp model method run home-router status
```

`listDevices` stores the online hostname, MAC address, and router instance for
each device. These values remain in the consuming repository's Swamp data; they
are not logged by the extension:

```sh
swamp model method run home-router listDevices
```

The router UI exposes system, event, and firewall log filters for Today,
Yesterday, Last week, Last month, and Last 90 days. On the verified firmware,
the observed log query returned no entries. `inspectLogContract` records
response metadata without log content while this interface remains undetermined.

Router uptime, connected-device IP addresses, and physical LAN-port attachment
are not exposed by the verified UI structures. The extension reports uptime as
unavailable instead of inferring it.

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
  --global-arg 'username=${{ vault.get(router-secrets, ROUTER_USERNAME) }}' \
  --global-arg 'password=${{ vault.get(router-secrets, ROUTER_PASSWORD) }}' \
  --global-arg allowInsecureTls=true
```

## License

MIT. See `LICENSE`.
