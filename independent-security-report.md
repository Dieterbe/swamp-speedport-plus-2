# Security and publication-readiness review

Reviewed: 2026-09-07

## Conclusion

Do not push local commit `1da2800` or publish extension version
`2026.09.07.2` as-is. The newly added configuration inspection can persist
credentials that its redaction heuristics fail to recognize. This conflicts
with the README's claim that password, key, PIN, token, and aggregate
configuration values are redacted.

The GitHub repository is already public at
<https://github.com/Dieterbe/swamp-speedport-plus-2>. At review time,
`origin/main` ended at `04fc4e7`; local commit `1da2800` had not been pushed.

## Findings

### High: configuration redaction can persist credentials

`configurationInputControls` decides whether to retain a value using the input
type and a regular expression over the field's `id` and `name`:

- [`extensions/models/speedport_plus_2.ts`](extensions/models/speedport_plus_2.ts#L446)
- [`extensions/models/speedport_plus_2.ts`](extensions/models/speedport_plus_2.ts#L456)

This heuristic misses plausible camelCase identifiers such as `preSharedKey`,
`wpaKey`, and `encryptionKey`. Unknown hidden fields are also retained unless
their names match the expression. A direct parser check confirmed that example
`preSharedKey` and `wpaKey` values were classified as non-sensitive and returned
with their values intact.

Select controls have no sensitivity classification. Their option values and
labels are always retained:

- [`extensions/models/speedport_plus_2.ts`](extensions/models/speedport_plus_2.ts#L476)

`inspectNetworkConfiguration` writes the resulting controls to a persistent
Swamp resource:

- [`extensions/models/speedport_plus_2.ts`](extensions/models/speedport_plus_2.ts#L1519)

This matters because router configuration pages are precisely where Wi-Fi
keys, administrative tokens, and opaque configuration values may appear. The
current behavior contradicts the documented redaction guarantee:

- [`README.md`](README.md#L31)

Recommended remediation:

- Retain values only for an explicit allowlist of known-safe fields.
- Redact all hidden inputs by default.
- Apply the same policy to select option values and labels.
- Store selected indexes or validated enum values where that provides enough
  diagnostic information.
- Add negative tests for camelCase key names, unknown hidden inputs, and
  sensitive select controls.

An expanding denylist was considered and rejected because router firmware can
introduce new identifiers and naming styles. A safe-field allowlist fails
closed and is therefore preferable when the output is persisted.

### Medium: curl loads user configuration

The curl argument list begins with `--silent` rather than `--disable`:

- [`extensions/models/speedport_plus_2.ts`](extensions/models/speedport_plus_2.ts#L1096)

Curl may therefore load the executing user's `.curlrc`. That file can alter
TLS, proxy, redirect, URL, and request behavior, weakening the extension's
explicit endpoint and TLS controls.

Add `--disable` as the first curl argument. Environment-dependent curl
configuration was not retained because deterministic request behavior is more
important for an extension that transmits router credentials.

### Medium: response limits are enforced after download and allocation

The common request method downloads the complete response and then loads the
body into memory:

- [`extensions/models/speedport_plus_2.ts`](extensions/models/speedport_plus_2.ts#L1166)

The 5 MiB log limit is checked only after that read. It prevents an oversized
Swamp resource from being created, but it does not protect temporary disk or
memory from a compromised or malfunctioning endpoint.

Enforce a size limit in the common request layer before reading the body. A
conservative default with an explicit larger allowance for log requests is
preferable to method-specific checks after allocation because every response
parser shares the same exposure.

### Medium: failed takeover verification can leave a session active

After the takeover POST, logout is attempted only when verification succeeds:

- [`extensions/models/speedport_plus_2.ts`](extensions/models/speedport_plus_2.ts#L2678)

The final cleanup removes only the local temporary directory:

- [`extensions/models/speedport_plus_2.ts`](extensions/models/speedport_plus_2.ts#L2709)

If takeover succeeds but verification fails, the newly acquired router session
may remain active. Attempt logout after any completed takeover POST, including
when verification fails, and record verification and logout outcomes
separately. Conditional cleanup was rejected because verification failure does
not establish that the takeover itself failed.

### Low: README publication and setup details

The first mention of Swamp in the README is plain text:

- [`README.md`](README.md#L3)

Repository convention requires that first mention to link to
<https://swamp-club.com>.

The installation example uses `192.0.2.1`, an address reserved for
documentation:

- [`README.md`](README.md#L116)

Using a documentation address avoids implying that a specific private address
is universal, but readers should be told explicitly to replace both `baseUrl`
and `expectedHost` with their router's address.

## Positive observations

- Router URLs require HTTPS and cannot contain embedded credentials.
- Normal TLS certificate verification remains enabled unless explicitly
  disabled.
- Insecure TLS requires a syntactically valid pinned public key.
- Redirects are restricted to the configured origin.
- Commands use argument arrays and stdin rather than shell interpolation.
- Wireless edit-page discovery permits only same-origin enumerated paths with
  numeric identifiers and caps discovery at 32 pages.
- Resource names are narrowly validated.
- No embedded secrets, dynamic evaluation, or suspicious external destination
  was found in the current tree.
- The repository uses the expected dedicated directory and GitHub repository.
- The manifest points to the reachable public repository.
- The root MIT license follows the selected publication convention.

## Validation results

The following checks passed during this review:

- Deno type checking for the model and tests.
- All 12 Deno tests.
- `swamp extension fmt manifest.yaml --check --json`.
- `swamp extension quality manifest.yaml --json`, including dependency trust.
- `git diff --check`.
- Current-tree checks for common private-key, access-token, dynamic-evaluation,
  and unfinished-work markers.

The automated checks do not exercise actual curl construction, enforce a
pre-download response limit, verify takeover cleanup, or detect the demonstrated
redaction bypass. Passing them does not remove the publication blocker.

## Publication recommendation

The source can be public after the high-severity redaction issue is fixed and
covered by regression tests. The three medium findings should also be resolved
before recommending the extension for general Swamp registry use.

Before release:

1. Replace heuristic value retention with a fail-closed safe-field policy.
2. Add `--disable` as curl's first argument.
3. Enforce response limits before loading bodies into memory.
4. Make post-takeover logout unconditional once the POST was completed.
5. Correct the README link and clarify placeholder router configuration.
6. Rerun type checking, tests, formatting, quality checks, and a registry dry
   run before publishing.
