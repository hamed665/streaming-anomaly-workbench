# Security boundary

The included demo processes data entirely in the browser and does not upload it.
Use synthetic or non-sensitive records. Exports are local files and should still
be reviewed before sharing. Do not commit personal data, tokens or customer
exports. There are no embedded secrets, telemetry or third-party scripts.

The Node library is not an authorization boundary. A hosted adapter needs its own
identity verification, tenant isolation, rate limits, size limits, retention
policy and audit controls. Report vulnerabilities privately through the
maintainer's GitHub profile rather than including exploit data in public issues.
