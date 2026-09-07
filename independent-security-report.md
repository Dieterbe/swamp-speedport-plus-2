# Security and publication-readiness review

Reviewed: 2026-09-07

## Conclusion

The changes substantially improve the extension and resolve the original curl
configuration, response-allocation, takeover-cleanup, documentation, and most
redaction concerns. The current working tree should not yet be published to the
Swamp registry because one redaction bypass remains and the manifest version has
not been advanced for these changes.

The GitHub repository is already public at
<https://github.com/Dieterbe/swamp-speedport-plus-2>. At review time,
`origin/main` ended at `04fc4e7`, local `HEAD` was `0d2dabf`, and the security
improvements reviewed here were uncommitted working-tree changes.

## Current findings

### High: mixed safe and unsafe identifiers bypass redaction

Input and select controls are now retained only when an identifier appears in a
safe-field allowlist. This is the correct general design because unknown fields
fail closed. However, the implementation accepts a control when **any** present
identifier is safe:

- [`extensions/models/speedport_plus_2.ts`](extensions/models/speedport_plus_2.ts#L456)
- [`extensions/models/speedport_plus_2.ts`](extensions/models/speedport_plus_2.ts#L498)

Consequently, a control such as an input with `id="ssid"` and
`name="preSharedKey"` retains its value because `ssid` is allowlisted. A select
with one safe and one unsafe identifier has the same problem. The resulting
control state is written to a persistent resource by
`inspectNetworkConfiguration`.

Require at least one identifier and require **every** present identifier to be
allowlisted. Add regression tests containing conflicting safe and unsafe `id`
and `name` values for both input and select controls.

The reason for using `some` cannot be determined from the code or
documentation. It is inferior here because a false negative can persist a
credential, while a false positive merely withholds diagnostic data.

### Medium: response limiting is incomplete on curl before 8.4.0

The common request layer now places `--max-filesize` on curl and checks the
downloaded file size before loading it into memory:

- [`extensions/models/speedport_plus_2.ts`](extensions/models/speedport_plus_2.ts#L586)
- [`extensions/models/speedport_plus_2.ts`](extensions/models/speedport_plus_2.ts#L1257)

This protects memory and, with curl 8.4.0 or newer, aborts an in-progress
transfer at the threshold. Before curl 8.4.0, `--max-filesize` has no effect when
the server does not declare the size before transfer. The post-download file
check still protects memory, but temporary disk consumption remains bounded
only by the 30-second timeout.

Require curl 8.4.0 or newer at runtime and document that minimum. An alternative
is to enforce the limit while consuming curl stdout in the extension, but that
is more complex than relying on the corrected curl behavior.

### Low: release metadata has not been advanced

The model and manifest still identify version `2026.09.07.2`, although the
working tree changes runtime behavior and schemas. Advance the version using
the Swamp version command before a registry dry run. Reusing an existing version
was rejected because consumers and the registry need an immutable identity for
the changed artifact.

## Resolved findings

### Configuration values now fail closed by default

Unknown and camelCase credential-like input names, all hidden inputs, and input
values outside approved diagnostic pages are now redacted. Select controls now
carry a sensitivity flag and redact both option values and labels unless their
identifier is explicitly allowlisted. Tests cover these cases.

This resolves the original denylist weakness except for the mixed-identifier
bypass described above.

### Curl no longer loads `.curlrc`

`--disable` is now the first curl argument, preventing user curl configuration
from silently changing TLS, proxy, redirect, URL, or request behavior:

- [`extensions/models/speedport_plus_2.ts`](extensions/models/speedport_plus_2.ts#L592)

### Bodies are checked before memory allocation

Normal responses default to 2 MiB and log responses to 5 MiB. Curl receives the
limit, exit code 63 is translated into a clear error, and the temporary file is
checked before `readTextFile`. This resolves the previous unbounded-memory
finding. The older-curl disk limitation is tracked separately above.

### Takeover logout is unconditional after the POST

After a completed takeover request, logout is now attempted regardless of
verification success:

- [`extensions/models/speedport_plus_2.ts`](extensions/models/speedport_plus_2.ts#L2792)

Verification and logout results remain separately recorded.

### README publication details are corrected

The first Swamp mention now links to <https://swamp-club.com>, and the setup text
explicitly tells readers to replace both documentation address values with
their router's address.

## Positive observations

- Router URLs require HTTPS and cannot contain embedded credentials.
- Normal TLS validation remains enabled unless explicitly disabled.
- Insecure TLS requires a syntactically valid public-key pin.
- Redirects are restricted to the configured origin.
- Commands use argument arrays and stdin rather than shell interpolation.
- Wireless edit-page discovery permits only same-origin enumerated paths with
  numeric identifiers and caps discovery at 32 pages.
- Resource names are narrowly validated.
- No embedded secrets, dynamic evaluation, suspicious external destination, or
  environment-variable credential access was found in the current tree.
- The repository layout, dedicated GitHub repository, reachable manifest URL,
  and root MIT license follow the selected publication conventions.

## Validation results

The following checks passed after the improvements:

- Deno type checking for the model and tests.
- All 15 Deno tests.
- `swamp extension fmt manifest.yaml --check --json`.
- `swamp extension quality manifest.yaml --json`, including dependency trust.
- `git diff --check`.
- Current-tree checks for common private keys, access tokens, dynamic
  evaluation, environment-secret access, and unfinished-work markers.

The installed curl was version 8.21.0, so its in-progress size limiting has the
required modern behavior. Tests verify construction of the safety arguments but
do not execute curl against oversized or chunked responses. Tests also do not
yet cover conflicting safe and unsafe control identifiers.

## Publication recommendation

Do not publish the current working tree to the Swamp registry yet. Before
release:

1. Require every present input/select identifier to be allowlisted and add
   mixed-identifier regression tests.
2. Require and document curl 8.4.0 or newer, or implement a version-independent
   streaming download limit.
3. Advance the extension and manifest version.
4. Rerun type checking, tests, formatting, quality checks, and a registry dry
   run.

After those items pass, no known security issue in this review would prevent
public release.
