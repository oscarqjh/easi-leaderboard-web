# EASI Leaderboard — API Reference

## Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| [`/api/auth/callback`](#get-apiauthcallback) | GET | None | HuggingFace OAuth callback |
| [`/api/leaderboard`](#get-apileaderboard) | GET | None (public) | Fetch latest leaderboard data |
| [`/api/submit`](#post-apisubmit) | POST | Bearer token | Submit model evaluation results |

---

## Authentication

Authentication uses HuggingFace OAuth 2.0 (authorization code flow). The API uses Bearer token authentication — the same approach works for both the web form and programmatic scripts.

### Browser Flow

1. Client redirects to `https://huggingface.co/oauth/authorize` with `client_id`, `redirect_uri`, `scope=openid profile`, `response_type=code`
2. User authorizes on HuggingFace
3. HuggingFace redirects to `/api/auth/callback?code=...`
4. Server exchanges code for access token, fetches user info
5. Server redirects to `/submit?hf_user=<base64url>` containing user display data + access token
6. Client stores access token in `localStorage` and sends it as `Authorization: Bearer <token>` on submit

### Script Flow

1. Script obtains an HF access token via [device code flow](https://huggingface.co/docs/hub/oauth#device-code-oauth) or any other OAuth flow
2. Script calls `POST /api/submit` with `Authorization: Bearer <token>` header
3. Server verifies identity by calling HuggingFace `/oauth/userinfo` with the token

### Token Details

- **What it is:** A HuggingFace OAuth access token (e.g., `hf_oauth_xxxxxxxx`), issued by HuggingFace after user authorization
- **What it proves:** The identity of the user (username, profile)
- **What it does NOT grant:** Write access to the EASI dataset repository. The server uses its own `HF_UPLOAD_TOKEN` for repo uploads.
- **Where it's stored (browser):** `localStorage` key `easi_hf_token`
- **Expiry:** Determined by HuggingFace (typically several hours). When expired, the submit endpoint returns 401 and the client prompts re-authentication.

### Logout (browser only)

Clicking "Sign out" clears `localStorage` (token + user data) and resets the form. No server call is needed. The user can then re-authenticate with a different HuggingFace account.

---

## `GET /api/auth/callback`

OAuth callback handler. Not called directly by clients — HuggingFace redirects here after user authorizes.

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `code` | string | Authorization code from HuggingFace |
| `state` | string | CSRF state parameter (passed through) |

### Behavior

1. Exchanges `code` for access token via `POST https://huggingface.co/oauth/token` (with retry: 2 attempts, 10s timeout)
2. Fetches user info via `GET https://huggingface.co/oauth/userinfo` (with retry)
3. Encodes user display data (`id`, `name`, `avatar`) and `accessToken` as base64url
4. Redirects to `/submit?hf_user=<base64url>`

### Redirect on Error

On failure, redirects to `/submit?auth_error=<code>&detail=<message>`.

| Error Code | Cause |
|------------|-------|
| `missing_code` | No `code` parameter in callback URL |
| `server_config` | `HF_CLIENT_ID` or `HF_CLIENT_SECRET` env var missing |
| `token_exchange` | HuggingFace rejected the authorization code (detail included) |
| `userinfo` | Failed to fetch user profile from HuggingFace |
| `unknown` | Unexpected server error |

---

## `GET /api/leaderboard`

Fetch the latest leaderboard data from the private HuggingFace dataset repository. Public endpoint — no authentication required from the caller. The server uses `HF_UPLOAD_TOKEN` internally to access the private repo.

### Behavior

1. Lists files in `leaderboard/versions/` from `lmms-lab-si/EASI-Leaderboard-Results` (with retry: 3 attempts, 15s timeout, exponential backoff)
2. Sorts by filename timestamp, picks the latest (e.g., `bench_20260214T040553.json`)
3. Concurrently fetches the leaderboard JSON and `leaderboard/capability_map.json` (taxonomy mapping)
4. Transforms leaderboard data to `ModelEntry[]` format (with retry)
5. Returns cached data if less than 5 minutes old

### Data Transformation

The HF repo stores data as:
```json
{
  "model_key": {
    "config": { "model_name": "..." },
    "results": { "vsi_bench": { "acc": 27.0 }, "site": { "caa": 33.14 } }
  }
}
```

The API transforms this to:
```json
{
  "name": "model_key",
  "type": "instruction",
  "precision": "bfloat16",
  "scores": { "vsi_bench": 27.0, "site": 33.14 }
}
```

- `results.benchmark.acc` → `scores.benchmark_id` (uses `caa` for SITE)
- Only includes benchmarks defined in the `BENCHMARKS` constant
- `type` and `precision` default to `"instruction"` and `"bfloat16"` (until HF data includes these fields)

### Caching

In-memory cache with 5-minute TTL. Resets on server restart.

### Success Response

**Status:** `200`

```json
{
  "data": [
    {
      "name": "qwen2.5_vl_3b_instruct",
      "type": "instruction",
      "precision": "bfloat16",
      "scores": {
        "vsi_bench": 27.0,
        "mmsi_bench": 28.6,
        "site": 33.14,
        ...
      }
    }
  ],
  "lastUpdated": "2026-02-14T04:05:53Z",
  "capabilityMap": {
    "vsi_bench": {
      "object_counting": ["cr"],
      "object_abs_distance": ["mm"],
      "object_rel_distance_accuracy": ["sr", "mm"],
      "object_rel_direction_accuracy": ["pt"]
    },
    "mmsi_bench": {
      "pos_cam_cam_accuracy": ["pt"],
      "attr_meas_accuracy": ["mm"],
      "msr_accuracy": ["cr"]
    }
  }
}
```

### Capability Map (Taxonomy)

The `capabilityMap` field maps each benchmark's sub-scores to spatial taxonomy categories. It is fetched from `leaderboard/capability_map.json` in the HF dataset repo.

**Structure:** `Record<benchmarkId, Record<subScoreKey, taxonomyLabels[]>>`

- Each sub-score key maps to an array of taxonomy labels (e.g., `["mm"]`, `["sr", "mm"]`)
- Sub-scores with an empty array `[]` have no taxonomy mapping
- Only benchmarks that have a mapping entry appear in the map
- Taxonomy labels are dynamically derived — the set of labels depends on the data, not hardcoded

The frontend uses this map to:
- Display taxonomy tags on sub-score column headers
- Compute per-taxonomy aggregate scores in the "Taxonomy" view mode

### Error Response

**Status:** `502`

```json
{
  "error": "Failed to load leaderboard data. Please try again later."
}
```

---

## `POST /api/submit`

Submit model evaluation results. Requires a valid HuggingFace access token. Uploads a JSON file to the HuggingFace dataset repository.

### Authentication

Reads the `Authorization: Bearer <token>` header. Verifies identity by calling HuggingFace `/oauth/userinfo` with the token. The server uses the verified username for the submission — any `userId`/`userName` fields in the request body are ignored.

### Rate Limiting

**Sliding window:** 5 submissions per 2-hour rolling window per user. Each submission's timestamp expires independently. Tracked in-memory by server-verified username. Resets on server restart.

### Request

**Headers:**

```
Content-Type: application/json
Authorization: Bearer <hf_access_token>
```

**Body:**

```json
{
  "modelName": "meta-llama/Llama-3-8B-Instruct",
  "modelType": "instruction",
  "precision": "bfloat16",
  "revision": "main",
  "weightType": "Original",
  "baseModel": "",
  "scores": {
    "vsi_bench": 72.4,
    "mmsi_bench": 68.1,
    "mindcube_tiny": null,
    "viewspatial": null,
    "site": 0,
    "blink": null,
    "3dsrbench": null,
    "embspatial": null,
    "mmsi_video_bench": null,
    "omnispatial_(manual_cot)": null,
    "spar_bench": null,
    "vsi_debiased": null
  },
  "remarks": "Initial submission"
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `modelName` | string | Yes | HuggingFace model ID in `org/model` format |
| `modelType` | string | Yes | One of: `pretrained`, `finetuned`, `instruction`, `rl` |
| `precision` | string | Yes | One of: `bfloat16`, `float16`, `float32`, `int8` |
| `revision` | string | No | Model revision/commit hash. Defaults to `"main"` |
| `weightType` | string | No | One of: `Original`, `Delta`, `Adapter`. Defaults to `"Original"` |
| `baseModel` | string | Conditional | Required when `weightType` is `Delta` or `Adapter` |
| `scores` | object | Yes | Benchmark ID to score (number) or `null` (not evaluated) |
| `remarks` | string | No | Free-text notes. Defaults to `"Submitted via EASI Leaderboard"` |

### Benchmark IDs

Scores use the following benchmark IDs as keys:

**EASI-8 (core):**

| ID | Display Name | Metric |
|----|-------------|--------|
| `vsi_bench` | VSI-Bench | Acc. |
| `mmsi_bench` | MMSI-Bench | Acc. |
| `mindcube_tiny` | MindCube-Tiny | Acc. |
| `viewspatial` | ViewSpatial | Acc. |
| `site` | SITE | CAA |
| `blink` | BLINK | Acc. |
| `3dsrbench` | 3DSRBench | Acc. |
| `embspatial` | EmbSpatial | Acc. |

**Additional:**

| ID | Display Name | Metric |
|----|-------------|--------|
| `mmsi_video_bench` | MMSI-Video-Bench | Acc. |
| `omnispatial_(manual_cot)` | OmniSpatial (Manual CoT) | Acc. |
| `spar_bench` | SPAR-Bench | Acc. |
| `vsi_debiased` | VSI-Debiased | Acc. |

A `null` value means the benchmark was not evaluated. A `0` value means evaluated with a score of zero.

### Validation Pipeline

Checks are executed in this order. The first failure short-circuits the request.

| Step | Check | Status |
|------|-------|--------|
| 1 | Server has `HF_UPLOAD_TOKEN` configured | 500 |
| 2 | `Authorization: Bearer` header present and valid (HF userinfo) | 401 |
| 3 | Rate limit not exceeded (5 per 2hr sliding window) | 429 |
| 4 | Request body is valid JSON | 400 |
| 5 | `modelName` is non-empty and contains `/` | 400 |
| 6 | `modelType` is non-empty | 400 |
| 7 | `precision` is non-empty | 400 |
| 8 | Model exists on HuggingFace (`GET /api/models/{name}`) | 400 |
| 9 | Model has a license in its model card (`cardData.license`) | 400 |
| 10 | If Delta/Adapter: `baseModel` is non-empty | 400 |
| 11 | If Delta/Adapter: base model exists on HuggingFace | 400 |
| 12 | Upload to HF dataset repo succeeds | 500 |

### Success Response

**Status:** `200`

```json
{ "success": true }
```

### Error Response

**Status:** `400`, `401`, `429`, or `500`

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### Error Messages

| Status | Message | Cause |
|--------|---------|-------|
| 500 | Server configuration error. Please contact the maintainers. | `HF_UPLOAD_TOKEN` not set |
| 401 | Your session has expired. Please sign in with HuggingFace again. | Missing/invalid/expired Bearer token |
| 429 | You've reached the submission limit (5 per 2 hours). Please try again in X minutes. | Rate limit exceeded |
| 400 | Invalid request body. | Malformed JSON |
| 400 | A valid model name in the format 'organization/model-name' is required. | Empty or no `/` in model name |
| 400 | Please select a model type (pretrained, finetuned, instruction, or rl). | Empty model type |
| 400 | Please select a precision (bfloat16, float16, float32, or int8). | Empty precision |
| 400 | Model "{name}" was not found on HuggingFace. | HF API returns non-200 |
| 400 | Model "{name}" does not have a license set. | No `cardData.license` |
| 400 | Base model is required when using {type} weights. | Delta/Adapter with empty base model |
| 400 | Base model "{name}" was not found on HuggingFace. | Base model not on HF |
| 500 | Failed to upload your submission to the repository. | HF commit API failed |

---

## Submission File Format

Each submission creates a JSON file in the HuggingFace dataset repository (`lmms-lab-si/EASI-Leaderboard-Requests`).

### File Path

```
{userName}/{modelPath}_{precision}_{weightType}_{timestamp}.json
```

Example: `oscarqjh/Llama-3-8B-Instruct_bfloat16_Original_2026-03-18T10-30-45-123.json`

- `userName`: Server-verified HuggingFace username (from OAuth userinfo, not client-supplied)
- `modelPath`: Model name after the `/` (e.g., `Llama-3-8B-Instruct` from `meta-llama/Llama-3-8B-Instruct`)
- `timestamp`: ISO 8601 with `:` and `.` replaced by `-`

### File Contents

```json
{
  "user_id": "oscarqjh",
  "model_id": "meta-llama/Llama-3-8B-Instruct",
  "base_model": "",
  "model_sha": "main",
  "model_dtype": "bfloat16",
  "weight_type": "Original",
  "model_type": "instruction",
  "submit_time": "2026-03-18T10:30:45Z",
  "remarks": "Initial submission",
  "config": {},
  "results": {
    "vsi_bench": 72.4,
    "mmsi_bench": 68.1,
    "mindcube_tiny": null
  }
}
```

### Upload Method

Files are uploaded via the HuggingFace commit API:

```
POST https://huggingface.co/api/datasets/{repoId}/commit/main
Content-Type: application/x-ndjson
Authorization: Bearer {HF_UPLOAD_TOKEN}
```

Body is two NDJSON lines: a header with the commit message, and a file entry with path and UTF-8 content.

---

## Usage Examples

### Python Script

```python
import requests

# Obtain an HF access token via device code flow, OAuth, or any method
# See: https://huggingface.co/docs/hub/oauth#device-code-oauth
hf_access_token = "hf_oauth_xxxxxxxx"

response = requests.post(
    "https://easi.lmms-lab.com/api/submit",
    headers={
        "Authorization": f"Bearer {hf_access_token}",
        "Content-Type": "application/json",
    },
    json={
        "modelName": "org/model-name",
        "modelType": "instruction",
        "precision": "bfloat16",
        "revision": "main",
        "weightType": "Original",
        "baseModel": "",
        "scores": {
            "vsi_bench": 72.4,
            "mmsi_bench": None,  # null = not evaluated
            "site": 0,           # 0 = evaluated, scored zero
        },
        "remarks": "Submitted via script",
    },
)

data = response.json()
if data["success"]:
    print("Submission successful!")
else:
    print(f"Error: {data['error']}")
```

### cURL

```bash
curl -X POST https://easi.lmms-lab.com/api/submit \
  -H "Authorization: Bearer hf_oauth_xxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "modelName": "org/model-name",
    "modelType": "instruction",
    "precision": "bfloat16",
    "revision": "main",
    "weightType": "Original",
    "baseModel": "",
    "scores": {"vsi_bench": 72.4},
    "remarks": "Submitted via cURL"
  }'
```

---

## Environment Variables

| Variable | Required | Server/Client | Description |
|----------|----------|---------------|-------------|
| `HF_CLIENT_ID` | Yes | Server | HuggingFace OAuth app client ID |
| `HF_CLIENT_SECRET` | Yes | Server | HuggingFace OAuth app client secret |
| `HF_REDIRECT_URI` | No | Server | OAuth callback URL. Defaults to `{origin}/api/auth/callback` |
| `HF_UPLOAD_TOKEN` | Yes | Server | HF token with read/write access to the dataset repos |
| `HF_REQUESTS_REPO` | No | Server | Submissions repo. Defaults to `lmms-lab-si/EASI-Leaderboard-Requests` |
| `HF_RESULTS_REPO` | No | Server | Leaderboard results repo. Defaults to `lmms-lab-si/EASI-Leaderboard-Results` |
| `NEXT_PUBLIC_HF_CLIENT_ID` | Yes | Client | Same client ID, exposed to browser for authorize URL |
| `NEXT_PUBLIC_HF_REDIRECT_URI` | No | Client | Redirect URI for client-side authorize URL |

### `.env.local` example

```
HF_CLIENT_ID=058e6b15-xxxx-xxxx-xxxx-xxxxxxxxxxxx
HF_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_HF_CLIENT_ID=058e6b15-xxxx-xxxx-xxxx-xxxxxxxxxxxx
HF_UPLOAD_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxx
HF_REQUESTS_REPO=lmms-lab-si/EASI-Leaderboard-Requests
HF_RESULTS_REPO=lmms-lab-si/EASI-Leaderboard-Results
NEXT_PUBLIC_HF_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

For production, set `HF_REDIRECT_URI` and `NEXT_PUBLIC_HF_REDIRECT_URI` to `https://easi.lmms-lab.com/api/auth/callback`.
