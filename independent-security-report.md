# Security and publication-readiness review

Reviewed: 2026-09-07

## Conclusion

No unresolved code-level security finding was identified. The earlier
redaction, curl configuration, response limiting, takeover cleanup,
documentation, and versioning findings have been addressed and covered by
focused tests.

Do not publish to the Swamp registry yet because the successful dry run exposes
one remaining metadata issue: its generated model description omits required
`baseUrl` and optional `pinnedPublicKey` from the global arguments.

## Remaining issue

### Medium: registry metadata omits connection arguments

The model declares `baseUrl` and `pinnedPublicKey` in its global argument schema:

- [`extensions/models/speedport_plus_2.ts`](extensions/models/speedport_plus_2.ts#L30)

The README also requires `baseUrl` and conditionally requires
`pinnedPublicKey` when insecure TLS is enabled:

- [`README.md`](README.md#L21)
- [`README.md`](README.md#L121)

However, `swamp extension push manifest.yaml --dry-run` listed only these global
arguments:

- `expectedHost`
- `username`
- `password`
- `allowInsecureTls`

The omission is concerning because `baseUrl` is mandatory at runtime and
`pinnedPublicKey` is mandatory whenever `allowInsecureTls` is true. Registry
users relying on generated extension metadata would receive an incomplete
configuration contract.

Determine why the Swamp metadata extractor does not recognize these schemas and
adjust their declaration without weakening validation. Re-run the dry run and
confirm that both argument names appear before publishing. Removing the runtime
checks is not an acceptable alternative because those checks protect endpoint
identity and credential confidentiality.

The dry run's `Deno.Command()` safety warning is expected: the extension
intentionally uses system curl and OpenSSL for firmware-compatible networking
and encryption. The version-drift warning is also expected because no prior
registry publication was found.

## Validation results

The following checks passed:

- Deno type checking for the model and tests.
- All 18 Deno tests.
- `swamp extension fmt manifest.yaml --check --json`.
- `swamp extension quality manifest.yaml --json`, including dependency trust.
- `git diff --check`.
- Registry dry run for version `2026.09.07.3`.
- Current-tree checks for common private keys, access tokens, dynamic
  evaluation, environment-secret access, and unfinished-work markers.

The installed curl was version 8.21.0. The extension also enforces curl 8.4.0
or newer at runtime, ensuring that `--max-filesize` can stop an in-progress
response whose size was not declared in advance.

## Publication recommendation

Confirm that the dry-run metadata includes `baseUrl` and `pinnedPublicKey`.
After that check passes, no known issue from this review prevents public
release.
