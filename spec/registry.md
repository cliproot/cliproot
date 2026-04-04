# CRP Registry Protocol

**Version:** 1.0.0
**Status:** Draft
**Depends on:** CRP v0.0.3 ([protocol.md](protocol.md)), cliproot-pack-v1 ([pack-format.md](pack-format.md))

---

## Overview

The CRP Registry Protocol defines how CRP provenance data is published, discovered, and retrieved over HTTP. It enables an open ecosystem of interoperable registry servers — any server implementing this protocol can serve as a remote for the ClipRoot CLI, browser extension, and playground.

The protocol is designed so that:

- A competent developer can implement a compatible registry server in days, not months.
- Public registries allow anonymous reads; all writes require authentication.
- Multiple registries can coexist. Clients configure named remotes and route operations to the appropriate registry.
- `.cliprootpack` archives (defined in [pack-format.md](pack-format.md)) are the primary transfer unit.

### Design Principles

1. **Content-addressed throughout.** Clips, bundles, and packs are identified by `sha256-*` hashes, the same identifiers used locally.
2. **HTTP + JSON.** No custom binary protocols or gRPC. Standard HTTP semantics, JSON request/response bodies, standard caching headers.
3. **Implementable in a weekend.** The core spec is small. A minimal conformant server needs fewer than a dozen endpoints.
4. **Multi-registry by default.** The CLI supports multiple named registries with per-operation routing.
5. **Auth-required for writes, optional for reads.** Public registries allow anonymous reads. All writes require authentication.
6. **Packs as the transfer unit.** `.cliprootpack` archives are already content-addressed and self-contained. The registry stores and serves them.

### Relationship to Other Specifications

This protocol operates on data structures defined elsewhere in the CRP specification:

- **Bundles** are defined in [protocol.md](protocol.md).
- **Content hashes** (`sha256-*`) are computed per [hashing.md](hashing.md).
- **Packs** (`.cliprootpack` archives) are defined in [pack-format.md](pack-format.md).
- **Conformance** requirements for registry servers and clients are in [conformance.md](conformance.md).

---

## Terminology

| Term | Definition |
|------|-----------|
| **Registry** | An HTTP server that implements the CRP Registry Protocol. |
| **Remote** | A named reference to a registry in the client's local configuration. |
| **Owner** | A namespace within a registry, typically a user or organization. |
| **Project** | A collection of related provenance data within an owner's namespace. The full identifier is `{owner}/{project}`. |
| **Index** | The discovery layer — CDN-friendly, cacheable metadata endpoints. |
| **Download** | The content retrieval layer — content-addressed blob downloads. |
| **API** | The write and search layer — authenticated mutations and queries. |
| **Pack** | A `.cliprootpack` archive, as defined in [pack-format.md](pack-format.md). |

---

## Registry Discovery

A registry declares its capabilities through a configuration document served at the well-known path `/v1/index/config.json`. Clients fetch this document before any other operation to learn how the registry's layers are distributed.

### `GET /v1/index/config.json`

Response:

```json
{
  "registryVersion": "1",
  "api": "https://registry.cliproot.com/v1/api",
  "download": "https://dl.cliproot.com/v1/download",
  "index": "https://registry.cliproot.com/v1/index",
  "authRequired": false,
  "authUrl": "https://registry.cliproot.com/auth"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `registryVersion` | string | Yes | Must be `"1"` for this version of the protocol. |
| `api` | string (URI) | Yes | Base URL for the API layer (write + search). |
| `download` | string (URI) | Yes | Base URL for the download layer (content retrieval). |
| `index` | string (URI) | No | Base URL for the index layer. If omitted, defaults to the URL from which `config.json` was fetched (minus `/config.json`). |
| `authRequired` | boolean | No | If `true`, reads also require authentication. Defaults to `false`. |
| `authUrl` | string (URI) | No | Base URL for OAuth endpoints. Required if the registry supports authentication. |

The three-layer separation allows each layer to be hosted independently. For example, the index can be served by a CDN, downloads by an object store, and the API by an application server.

The schema for this response is defined in `schema/crp-registry-config-v1.schema.json`.

---

## API Layers

### Layer 1: Index (Discovery)

The index layer serves provenance metadata as individual HTTP-fetchable JSON documents. All index responses are CDN-friendly and support standard HTTP caching (`ETag`, `If-None-Match`, `Cache-Control`).

#### `GET /v1/index/config.json`

Registry configuration (see [Registry Discovery](#registry-discovery)).

#### `GET /v1/index/projects`

List public projects.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `owner` | string | Filter by owner. |
| `cursor` | string | Pagination cursor from a previous response. |
| `limit` | integer | Maximum results per page. Default: 50. Maximum: 200. |

**Response:**

```json
{
  "projects": [
    {
      "owner": "jasonwhitwill",
      "name": "auth-refactor",
      "clipCount": 23,
      "lastPublishedAt": "2026-04-03T18:30:00Z"
    }
  ],
  "cursor": "eyJsYXN0IjoiYXV0aC1yZWZhY3RvciJ9"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `projects` | array | List of project summaries. |
| `projects[].owner` | string | Project owner. |
| `projects[].name` | string | Project name. |
| `projects[].clipCount` | integer | Total number of clips in the project. |
| `projects[].lastPublishedAt` | string (ISO 8601) | When the project was last updated. |
| `cursor` | string or null | Pagination cursor. `null` if no more results. |

#### `GET /v1/index/projects/{owner}/{name}`

Project metadata.

**Response:**

```json
{
  "owner": "jasonwhitwill",
  "name": "auth-refactor",
  "description": "Provenance from the auth middleware rewrite",
  "clipCount": 23,
  "edgeCount": 18,
  "artifactCount": 5,
  "lastPublishedAt": "2026-04-03T18:30:00Z",
  "latestPackHash": "sha256-Qm9uam91ci...",
  "createdAt": "2026-03-15T10:00:00Z"
}
```

Returns `404` if the project does not exist.

#### `GET /v1/index/clips/{hash}`

Clip metadata. The `{hash}` is the full `sha256-*` clip hash.

**Response:**

```json
{
  "clipHash": "sha256-abc123...",
  "textHash": "sha256-def456...",
  "content": "Provenance starts here.",
  "sourceRefs": ["src_01"],
  "project": {
    "owner": "jasonwhitwill",
    "name": "auth-refactor"
  },
  "edges": [
    {
      "type": "wasDerivedFrom",
      "subjectRef": "sha256-abc123...",
      "objectRef": "sha256-xyz789..."
    }
  ],
  "bundleHash": "sha256-bbb..."
}
```

Returns `404` if the clip is not found.

#### `GET /v1/index/clips/{hash}/lineage`

Full ancestor chain for a clip. Returns the derivation DAG rooted at the given clip, traversing `wasDerivedFrom` edges.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `depth` | integer | Maximum traversal depth. Default: unlimited. |

**Response:**

```json
{
  "root": "sha256-abc123...",
  "clips": [
    {
      "clipHash": "sha256-abc123...",
      "textHash": "sha256-def456...",
      "content": "Provenance starts here.",
      "sourceRefs": ["src_01"],
      "derivedFrom": ["sha256-xyz789..."]
    },
    {
      "clipHash": "sha256-xyz789...",
      "textHash": "sha256-ghi012...",
      "content": "Original source text.",
      "sourceRefs": ["src_02"],
      "derivedFrom": []
    }
  ]
}
```

#### Caching

Index responses support standard HTTP caching:

- **`ETag`** — returned on all index responses. Clients should send `If-None-Match` on subsequent requests.
- **`Cache-Control`** — registries should set appropriate `max-age` values. Project metadata changes on publish; clip metadata is immutable once published.
- **`304 Not Modified`** — returned when the client's `If-None-Match` matches the current `ETag`.

---

### Layer 2: Download (Content Retrieval)

The download layer serves content by hash. All content is immutable — the bytes at a given hash never change.

#### `GET /v1/download/packs/{hash}.cliprootpack`

Download a pack archive by its manifest hash.

**Response headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/x-cliprootpack` |
| `Content-Length` | Archive size in bytes |
| `ETag` | `"{hash}"` |
| `Cache-Control` | `public, max-age=31536000, immutable` |

Returns `404` if the pack is not found.

#### `GET /v1/download/clips/{hash}.json`

Download a CRP bundle by clip hash.

**Response headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `ETag` | `"{hash}"` |
| `Cache-Control` | `public, max-age=31536000, immutable` |

The response body is a valid CRP bundle as defined in [protocol.md](protocol.md).

#### `GET /v1/download/artifacts/{hash}`

Download an artifact blob by its artifact hash.

**Response headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | The artifact's MIME type (from metadata), or `application/octet-stream` if unknown |
| `ETag` | `"{hash}"` |
| `Cache-Control` | `public, max-age=31536000, immutable` |

#### Integrity Verification

Clients **must** verify that the SHA-256 hash of the downloaded bytes matches the requested hash. If the hash does not match, the client must reject the content and report an error. See [hashing.md](hashing.md) for hash computation details.

---

### Layer 3: API (Write Operations + Search)

The API layer handles authenticated write operations and search queries. All write endpoints require a valid `Authorization: Bearer <token>` header.

#### `POST /v1/api/packs`

Publish a pack to the registry.

**Request:**

```
POST /v1/api/packs
Authorization: Bearer <token>
Content-Type: application/x-cliprootpack

<binary pack data>
```

**Response (`201 Created`):**

```json
{
  "packHash": "sha256-Qm9uam91ci...",
  "owner": "jasonwhitwill",
  "project": "auth-refactor",
  "clips": 23,
  "artifacts": 5,
  "edges": 18,
  "url": "https://registry.cliproot.com/v1/index/projects/jasonwhitwill/auth-refactor"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `packHash` | string | Content hash of the published pack manifest. |
| `owner` | string | Owner namespace the pack was published to. |
| `project` | string | Project name extracted from the pack manifest. |
| `clips` | integer | Number of clips in the pack. |
| `artifacts` | integer | Number of artifacts in the pack. |
| `edges` | integer | Number of edges in the pack. |
| `url` | string (URI) | URL to the project's index page. |

**Error responses:**

| Status | Code | Description |
|--------|------|-------------|
| `401` | `unauthorized` | Missing or invalid bearer token. |
| `409` | `duplicate_pack` | A pack with this hash has already been published. |
| `413` | `pack_too_large` | Pack exceeds the registry's size limit. |
| `422` | `invalid_pack` | Pack fails validation (bad manifest, invalid bundles, hash mismatch). |

#### `POST /v1/api/clips`

Publish individual CRP bundles (without packing them first).

**Request:**

```
POST /v1/api/clips
Authorization: Bearer <token>
Content-Type: application/json

{
  "owner": "jasonwhitwill",
  "project": "auth-refactor",
  "bundles": [ <CRP bundle>, <CRP bundle>, ... ]
}
```

**Response (`201 Created`):**

```json
{
  "owner": "jasonwhitwill",
  "project": "auth-refactor",
  "accepted": 5,
  "clipHashes": ["sha256-abc...", "sha256-def..."]
}
```

**Error responses:**

| Status | Code | Description |
|--------|------|-------------|
| `401` | `unauthorized` | Missing or invalid bearer token. |
| `422` | `invalid_bundle` | One or more bundles fail schema validation or hash verification. |

#### `GET /v1/api/search`

Full-text search across published clips.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (required). |
| `owner` | string | Filter by owner. |
| `project` | string | Filter by project name. Must be used with `owner`. |
| `cursor` | string | Pagination cursor. |
| `limit` | integer | Maximum results per page. Default: 20. Maximum: 100. |

**Response:**

```json
{
  "results": [
    {
      "clipHash": "sha256-abc123...",
      "content": "...matched text snippet...",
      "project": {
        "owner": "jasonwhitwill",
        "name": "auth-refactor"
      },
      "score": 0.95
    }
  ],
  "cursor": "eyJvZmZzZXQiOjIwfQ",
  "total": 42
}
```

#### `POST /v1/api/negotiate`

**Reserved for future use.** This endpoint will support delta negotiation (computing the minimal set of data to transfer between client and server). Not specified in v1. Servers should return `501 Not Implemented`.

---

## Common Response Formats

### Error Envelope

All error responses use a consistent JSON envelope:

```json
{
  "error": {
    "code": "invalid_pack",
    "message": "Pack manifest references 3 bundles but archive contains 2."
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `error.code` | string | Machine-readable error code (snake_case). |
| `error.message` | string | Human-readable description. |

### Pagination

Paginated endpoints use cursor-based pagination:

- The response includes a `cursor` field. If `null`, there are no more results.
- To fetch the next page, pass the cursor value as the `cursor` query parameter.
- Cursors are opaque strings. Clients must not parse or construct them.

### HTTP Status Codes

| Status | Usage |
|--------|-------|
| `200` | Successful read. |
| `201` | Successful write (publish). |
| `304` | Not modified (ETag match). |
| `400` | Malformed request. |
| `401` | Authentication required or token invalid. |
| `403` | Authenticated but not authorized for this operation. |
| `404` | Resource not found. |
| `409` | Conflict (e.g., duplicate publish). |
| `413` | Request body too large. |
| `422` | Request body fails validation. |
| `429` | Rate limited. |
| `501` | Not implemented (e.g., negotiate endpoint in v1). |

---

## Authentication

### Model

Write operations (publish) require authentication. Read operations (index, download, search) do not require authentication on public registries. Private registries may require authentication for all operations by setting `authRequired: true` in their discovery config.

### OAuth 2.0 Device Authorization Grant (CLI)

The primary authentication method for CLI clients. Follows [RFC 8628](https://datatracker.ietf.org/doc/html/rfc8628).

**Flow:**

1. Client sends `POST {authUrl}/device`:

```json
{
  "client_id": "cliproot-cli"
}
```

2. Server responds:

```json
{
  "device_code": "GmRhmhcxhZAzu...",
  "user_code": "ABCD-1234",
  "verification_uri": "https://registry.cliproot.com/device",
  "expires_in": 900,
  "interval": 5
}
```

3. Client displays: `Visit https://registry.cliproot.com/device and enter code: ABCD-1234`
4. Client opens the verification URI in the user's default browser.
5. User authenticates in the browser.
6. Client polls `POST {authUrl}/token`:

```json
{
  "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
  "device_code": "GmRhmhcxhZAzu...",
  "client_id": "cliproot-cli"
}
```

7. Server responds with tokens on success:

```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "dGhpcyBpcyBhI..."
}
```

The client polls at the `interval` (in seconds) specified in step 2. Before authorization completes, the server returns `{"error": "authorization_pending"}`. If the device code expires, the server returns `{"error": "expired_token"}`.

### OAuth 2.0 Authorization Code Grant (Browser)

Browser-based clients (extension, playground) use the standard OAuth 2.0 Authorization Code flow with PKCE ([RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)).

### Client Credentials Grant (CI / Automation)

Service-to-service authentication uses the OAuth 2.0 Client Credentials flow. The client authenticates with a `client_id` and `client_secret` (or a pre-issued token) to obtain an access token.

### Bearer Token Usage

All authenticated requests include the access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Token Refresh

When an access token expires, the client uses the refresh token to obtain a new one:

```
POST {authUrl}/token
Content-Type: application/json

{
  "grant_type": "refresh_token",
  "refresh_token": "dGhpcyBpcyBhI...",
  "client_id": "cliproot-cli"
}
```

### Token Storage

Clients should store tokens securely, in the following priority order:

1. **System keychain** — macOS Keychain, Linux Secret Service (via D-Bus), Windows Credential Manager. Keyed by registry URL.
2. **Encrypted file** — `~/.cliproot/credentials.json` with filesystem-level access control.
3. **Environment variable** — `CLIPROOT_TOKEN` for CI and automation environments.

---

## Client Configuration

### Remotes

Clients store registry configuration in `.cliproot/config.json` under the `remotes` key:

```json
{
  "protocolVersion": "0.0.3",
  "currentProjectId": "auth-refactor",
  "remotes": {
    "origin": {
      "url": "https://registry.cliproot.com",
      "owner": "jasonwhitwill"
    },
    "work": {
      "url": "https://cliproot.acme.corp",
      "owner": "acme"
    }
  },
  "defaultRemote": "origin"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `remotes` | object | Map of remote name → remote configuration. |
| `remotes.{name}.url` | string (URI) | Registry base URL. The client appends `/v1/index/config.json` to discover the registry. |
| `remotes.{name}.owner` | string | Default owner namespace for push operations on this remote. |
| `defaultRemote` | string | Name of the remote used when no `--remote` flag is specified. |

The schema for `.cliproot/config.json` is defined in `schema/cliproot-config-v1.schema.json`.

### Remote Resolution

When a command does not specify a `--remote` flag:

1. If `defaultRemote` is set in config, use that remote.
2. If exactly one remote is configured, use it.
3. Otherwise, return an error asking the user to specify `--remote`.

### Credential Resolution

For a given remote, credentials are resolved in this order:

1. `CLIPROOT_TOKEN` environment variable (if set, used for all remotes).
2. System keychain entry keyed by the remote's URL.
3. `~/.cliproot/credentials.json` entry keyed by the remote's URL.

---

## Content Addressing and Integrity

All content in the registry is identified by `sha256-*` hashes as defined in [hashing.md](hashing.md).

### Immutability

Content at a given hash **must not** change. Once a pack, bundle, clip, or artifact is published at a hash, the bytes served for that hash are permanent. This invariant is fundamental to the trust model — if someone cites a provenance chain, it must remain verifiable.

Registries may support **redaction** for legal or compliance reasons. A redacted resource returns `410 Gone` with a tombstone:

```json
{
  "error": {
    "code": "redacted",
    "message": "This content has been redacted."
  }
}
```

Redacted content must not be served again. The hash remains reserved.

### Client Verification

Clients **must** verify the integrity of all downloaded content:

1. Compute the SHA-256 hash of the received bytes.
2. Compare against the hash in the request URL.
3. Reject and report an error on mismatch.

For packs, additionally apply the full [pack verification](pack-format.md#verification) procedure after download.

---

## Project Naming

Projects are namespaced by owner: `{owner}/{project}`.

### Constraints

| Component | Rule |
|-----------|------|
| **Owner** | `^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$`, 1–64 characters |
| **Project** | `^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$`, 1–64 characters |

Both owner and project names:

- Must start and end with a lowercase alphanumeric character.
- May contain lowercase letters, digits, `.`, `_`, and `-` internally.
- Are case-insensitive for lookup purposes (registries must normalize to lowercase).
- Must be between 1 and 64 characters.

### Full Identifier

The globally unique identifier for a project is `{registry}/{owner}/{project}`:

```
registry.cliproot.com/jasonwhitwill/auth-refactor
```

This is the format used in `registryRef` fields in CRP bundles (see [protocol.md](protocol.md)).

---

## Multi-Registry

### Named Remotes

Clients support multiple named remotes, each pointing to a different registry. This enables workflows like:

- Public provenance on `registry.cliproot.com`
- Private provenance on `cliproot.internal.company.com`

### Cross-Registry References

A clip published on registry A can reference sources on registry B via `registryRef`. The `registryRef.uri` identifies which registry holds the referenced bundle:

```json
{
  "registry": {
    "uri": "https://registry.cliproot.com",
    "bundleId": "jasonwhitwill/auth-refactor/sha256-abc..."
  }
}
```

Clients resolving cross-registry references must fetch from the referenced registry, not from the current remote.

### No Federation in v1

Registries do not communicate with each other in v1. There is no server-side replication, mirroring, or forwarding. Cross-registry resolution is a client-side operation. Federation may be added in a future version of this protocol.

---

## Security Considerations

### Transport Security

All registry communication **must** use HTTPS (TLS 1.2 or later). Clients must reject plain HTTP connections to registry endpoints except for `localhost` development servers.

### Content Verification

The content-addressed design provides integrity verification independent of transport security. Even if a TLS connection is compromised, clients can detect tampered content by verifying hashes. See [Content Addressing and Integrity](#content-addressing-and-integrity).

### Token Security

- Access tokens should have short lifetimes (recommended: 1 hour).
- Refresh tokens should have longer lifetimes (recommended: 30 days) and support rotation.
- Clients must not log or display tokens in plaintext.
- Clients must not send tokens to registries other than the one that issued them.

### Rate Limiting

Registries should implement rate limiting on all endpoints. Rate-limited responses return `429 Too Many Requests` with a `Retry-After` header indicating when the client may retry.

---

## Conformance

### Registry Server Conformance

A CRP Registry v1 server must:

1. **Discovery.** Serve a valid `config.json` at `/v1/index/config.json` conforming to `schema/crp-registry-config-v1.schema.json`.
2. **Download.** Serve packs, bundles, and artifacts by hash at the download layer URLs.
3. **Immutability.** Never change content at a given hash.
4. **Publish.** Accept pack uploads at `POST /v1/api/packs` and validate them per [pack-format.md](pack-format.md#verification) and CRP bundle schema before accepting.
5. **Error responses.** Return errors in the standard error envelope format.
6. **Content hashing.** Verify that all content hashes match on upload.

A server is not required to implement all index endpoints (e.g., search and lineage may be omitted) or authentication (a local development server may accept unauthenticated writes).

### Registry Client Conformance

A CRP Registry v1 client must:

1. **Discovery.** Fetch and parse `config.json` before making other requests.
2. **Integrity.** Verify content hashes on all downloads.
3. **Error handling.** Parse the standard error envelope and present errors to the user.
4. **Authentication.** Include a valid bearer token on write requests when the registry requires it.

### What Conformance Does Not Require

- **Storage backend.** How a server stores content (filesystem, S3, database) is not specified.
- **Authentication provider.** How a server authenticates users (OAuth, API keys, LDAP) is not specified beyond the token exchange endpoints.
- **Search implementation.** Full-text search quality, ranking, and indexing strategy are implementation details.
- **Rate limiting strategy.** Specific rate limits are left to the server operator.

---

## Future Extensions

The following features are explicitly deferred from v1:

- **Delta negotiation** (`POST /v1/api/negotiate`) — computing the minimal transfer set between client and server, similar to git's want/have protocol.
- **Federation** — server-to-server replication and discovery.
- **Webhooks / event streaming** — notifications when new provenance is published.
- **Signed packs** — cryptographic signatures on packs for non-repudiation.
- **Access control lists** — fine-grained team and organization permissions.
- **Bidirectional sync** — git-style merge semantics for provenance graphs.
- **Tags / snapshots** — named references to project states at a point in time.

---

## Schema References

- **Registry discovery config:** `schema/crp-registry-config-v1.schema.json`
- **Local config (with remotes):** `schema/cliproot-config-v1.schema.json`
- **OpenAPI spec:** `schema/crp-registry-v1.openapi.yaml`
- **CRP bundle schema:** `schema/crp-v0.0.3.schema.json`
- **Pack manifest schema:** `schema/cliproot-pack-v1.manifest.schema.json`
