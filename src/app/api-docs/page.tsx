import { Metadata } from "next";
import ApiDocsSidebar from "@/components/ApiDocsSidebar";

export const metadata: Metadata = { title: "API Reference" };

/* ── Reusable components ── */

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      {children}
    </section>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-heading text-xl font-semibold text-lb-text mt-12 mb-4 pb-2 border-b border-lb-border">{children}</h2>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="font-heading text-base font-semibold text-lb-text mt-8 mb-3">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-lb-text-secondary leading-relaxed mb-4">{children}</p>;
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="px-1.5 py-0.5 text-xs font-mono bg-lb-primary-light text-lb-primary rounded">{children}</code>;
}

function CodeBlock({ lang, children }: { lang?: string; children: string }) {
  return (
    <div className="relative mb-4">
      {lang && (
        <div className="absolute top-0 right-0 px-2 py-0.5 text-[10px] font-mono uppercase text-lb-text-muted bg-lb-border/40 rounded-bl-md rounded-tr-lg">
          {lang}
        </div>
      )}
      <pre className="bg-[#1e1b4b] text-[#c4b5fd] text-xs font-mono p-4 rounded-lg overflow-x-auto leading-relaxed selection:bg-[#4338ca] selection:text-white">
        {children}
      </pre>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-lb-border">
            {headers.map((h) => (
              <th key={h} className="text-left px-3 py-2 font-semibold text-lb-text-muted text-xs uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-lb-border/60">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-lb-text whitespace-nowrap">
                  {cell.startsWith("`") && cell.endsWith("`") ? (
                    <Code>{cell.slice(1, -1)}</Code>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-emerald-100 text-emerald-700",
    POST: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded ${colors[method] || "bg-lb-border text-lb-text"}`}>
      {method}
    </span>
  );
}

function EndpointHeader({ method, path, auth }: { method: string; path: string; auth?: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <MethodBadge method={method} />
      <span className="font-mono text-sm font-semibold text-lb-text">{path}</span>
      {auth && (
        <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-full bg-lb-primary-light text-lb-primary">
          {auth}
        </span>
      )}
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return <li className="text-sm text-lb-text-secondary leading-relaxed">{children}</li>;
}

/* ── Page ── */

export default function ApiDocsPage() {
  return (
    <div className="max-w-5xl mx-auto px-md py-lg flex gap-10">
      <ApiDocsSidebar />
      <div className="flex-1 min-w-0 animate-fade-in-up">
        {/* Header */}
        <h1 className="font-heading text-heading font-bold text-lb-text mb-2">API Reference</h1>
        <P>Programmatic access to the EASI Leaderboard — fetch results, submit evaluations, and authenticate via HuggingFace OAuth.</P>

        {/* Endpoint overview */}
        <div className="bg-lb-surface border border-lb-border rounded-lg shadow-sm p-5 mb-8">
          <Table
            headers={["Endpoint", "Method", "Auth", "Description"]}
            rows={[
              ["`/api/auth/callback`", "GET", "None", "HuggingFace OAuth callback"],
              ["`/api/leaderboard`", "GET", "None (public)", "Fetch latest leaderboard data"],
              ["`/api/submit`", "POST", "Bearer token", "Submit evaluation (browser flow, Vercel Blob)"],
              ["`/api/submit-with-file`", "POST", "Bearer token", "Submit evaluation (scripts, inline zip)"],
              ["`/api/blob-upload`", "POST", "Bearer token", "Vercel Blob token exchange (browser only)"],
            ]}
          />
        </div>

        {/* ── Authentication ── */}
        <Section id="authentication">
          <H2>Authentication</H2>
          <P>
            Authentication uses HuggingFace OAuth 2.0 (authorization code flow). The API uses Bearer token
            authentication — the same approach works for both the web form and programmatic scripts.
          </P>

          <H3>Browser Flow</H3>
          <ol className="list-decimal list-inside space-y-1 mb-4">
            <Li>Client redirects to HuggingFace authorize URL with <Code>client_id</Code>, <Code>redirect_uri</Code>, <Code>scope=openid profile</Code></Li>
            <Li>User authorizes on HuggingFace</Li>
            <Li>HuggingFace redirects to <Code>/api/auth/callback?code=...</Code></Li>
            <Li>Server exchanges code for access token, fetches user info</Li>
            <Li>Server redirects to <Code>/submit?hf_user=&lt;base64url&gt;</Code> with user data + access token</Li>
            <Li>Client stores token in <Code>localStorage</Code> and sends as <Code>Authorization: Bearer</Code> on submit</Li>
          </ol>

          <H3>Script Flow</H3>
          <ol className="list-decimal list-inside space-y-1 mb-4">
            <Li>Obtain an HF token — either a regular API token (<Code>hf_*</Code>) from <Code>huggingface.co/settings/tokens</Code> or an OAuth token</Li>
            <Li>Call <Code>POST /api/submit-with-file/</Code> with <Code>Authorization: Bearer &lt;token&gt;</Code> and the zip file as multipart</Li>
            <Li>Server verifies identity via HuggingFace (<Code>/oauth/userinfo</Code> for OAuth tokens, <Code>/api/whoami</Code> for regular tokens)</Li>
          </ol>

          <H3>Token Details</H3>
          <ul className="space-y-2 mb-4">
            <Li><strong className="text-lb-text">Accepted tokens:</strong> Both regular HF API tokens (<Code>hf_*</Code>) and OAuth tokens (<Code>hf_oauth_*</Code>)</Li>
            <Li><strong className="text-lb-text">What it proves:</strong> The identity of the user (username, profile)</Li>
            <Li><strong className="text-lb-text">What it does NOT grant:</strong> Write access to the EASI dataset repository</Li>
            <Li><strong className="text-lb-text">For scripts:</strong> Use a regular HF API token from <Code>huggingface.co/settings/tokens</Code> — no browser OAuth flow needed</Li>
            <Li><strong className="text-lb-text">Expiry:</strong> Determined by HuggingFace. Submit returns 401 when expired.</Li>
          </ul>
        </Section>

        {/* ── GET /api/auth/callback ── */}
        <Section id="get-apiauthcallback">
          <H2>OAuth Callback</H2>
          <EndpointHeader method="GET" path="/api/auth/callback" />
          <P>Not called directly — HuggingFace redirects here after user authorizes. Exchanges code for token with retry (2 attempts, 10s timeout).</P>

          <H3>Query Parameters</H3>
          <Table
            headers={["Parameter", "Type", "Description"]}
            rows={[
              ["`code`", "string", "Authorization code from HuggingFace"],
              ["`state`", "string", "CSRF state parameter"],
            ]}
          />

          <H3>Error Codes</H3>
          <P>On failure, redirects to <Code>/submit?auth_error=&lt;code&gt;&amp;detail=&lt;message&gt;</Code>.</P>
          <Table
            headers={["Code", "Cause"]}
            rows={[
              ["`missing_code`", "No code parameter in callback URL"],
              ["`server_config`", "Missing HF_CLIENT_ID or HF_CLIENT_SECRET"],
              ["`token_exchange`", "HuggingFace rejected the authorization code"],
              ["`userinfo`", "Failed to fetch user profile"],
              ["`unknown`", "Unexpected server error"],
            ]}
          />
        </Section>

        {/* ── GET /api/leaderboard ── */}
        <Section id="get-apileaderboard">
          <H2>Leaderboard Data</H2>
          <EndpointHeader method="GET" path="/api/leaderboard" auth="Public" />
          <P>
            Fetches the latest leaderboard data from the private HuggingFace dataset repo.
            The server uses its own token internally — no authentication required from the caller.
            Results are cached in memory for 5 minutes.
          </P>

          <H3>Behavior</H3>
          <ol className="list-decimal list-inside space-y-1 mb-4">
            <Li>Lists files in <Code>leaderboard/versions/</Code> (with retry: 3 attempts, exponential backoff)</Li>
            <Li>Picks the latest by filename timestamp (e.g., <Code>bench_20260214T040553.json</Code>)</Li>
            <Li>Concurrently fetches leaderboard JSON and <Code>capability_map.json</Code> (taxonomy mapping)</Li>
            <Li>Transforms to <Code>ModelEntry[]</Code> format</Li>
            <Li>Returns cached data if less than 5 minutes old</Li>
          </ol>

          <H3>Success Response</H3>
          <CodeBlock lang="json">{`{
  "data": [
    {
      "name": "qwen2.5_vl_3b_instruct",
      "type": "instruction",
      "precision": "bfloat16",
      "scores": {
        "vsi_bench": 27.0,
        "mmsi_bench": 28.6,
        "site": 33.14
      }
    }
  ],
  "lastUpdated": "2026-02-14T04:05:53Z",
  "capabilityMap": {
    "vsi_bench": {
      "object_counting": ["cr"],
      "object_abs_distance": ["mm"]
    },
    "mmsi_bench": {
      "msr_accuracy": ["cr"]
    }
  }
}`}</CodeBlock>

          <H3>Taxonomy Map (<Code>capabilityMap</Code>)</H3>
          <P>
            Maps each benchmark{"'"}s sub-scores to spatial taxonomy categories. Fetched from <Code>capability_map.json</Code> in
            the HF dataset repo. Structure: <Code>{"Record<benchmarkId, Record<subScoreKey, taxonomyLabels[]>>"}</Code>.
          </P>
          <ul className="space-y-1 mb-4">
            <Li>Each sub-score maps to an array of taxonomy labels (e.g., <Code>["mm"]</Code>, <Code>["sr", "mm"]</Code>)</Li>
            <Li>Empty array <Code>[]</Code> means no taxonomy mapping for that sub-score</Li>
            <Li>Only benchmarks with mappings appear in the map</Li>
            <Li>Taxonomy labels are dynamically derived from the data</Li>
          </ul>

          <H3>Error Response</H3>
          <P>Status <Code>502</Code>:</P>
          <CodeBlock lang="json">{`{
  "error": "Failed to load leaderboard data. Please try again later."
}`}</CodeBlock>
        </Section>

        {/* ── POST /api/submit ── */}
        <Section id="post-apisubmit">
          <H2>Submit Evaluation (Browser)</H2>
          <EndpointHeader method="POST" path="/api/submit" auth="Bearer" />
          <P>
            Used by the web form. Accepts a JSON payload with a Vercel Blob URL referencing the uploaded zip file.
            The zip is uploaded to Vercel Blob first (via <Code>/api/blob-upload/</Code>), then this endpoint
            fetches it, validates contents, and uploads to the HuggingFace dataset repository.
          </P>
          <P>
            <strong className="text-lb-text">For scripts and programmatic access, use <Code>/api/submit-with-file/</Code> instead</strong> (see below).
          </P>
        </Section>

        {/* ── POST /api/submit-with-file ── */}
        <Section id="post-apisubmitwithfile">
          <H2>Submit Evaluation (Scripts)</H2>
          <EndpointHeader method="POST" path="/api/submit-with-file" auth="Bearer" />
          <P>
            Script-friendly endpoint for programmatic submissions. Accepts <Code>multipart/form-data</Code> with
            the JSON payload and zip file inline. Supports both regular HF API tokens (<Code>hf_*</Code>) and
            OAuth tokens — no browser flow needed.
          </P>
          <P>
            <strong className="text-lb-text">Zip file size limit: 4.5 MB</strong> (Vercel serverless payload limit).
            For larger files, use the web form which uploads via Vercel Blob with no size limit.
          </P>

          <H3>Rate Limiting</H3>
          <P>
            Sliding window: <strong className="text-lb-text">5 submissions per 2-hour window</strong> per user.
            Each timestamp expires independently. Tracked in-memory by server-verified username.
          </P>

          <H3>Request Format</H3>
          <P>
            <Code>multipart/form-data</Code> with two parts:
          </P>
          <Table
            headers={["Part", "Type", "Required", "Description"]}
            rows={[
              ["`payload`", "JSON string", "Yes", "Submission metadata and scores (see fields below)"],
              ["`zipFile`", "File (.zip)", "Yes", "Zip archive containing evaluation result files (max 4.5 MB)"],
            ]}
          />

          <H3>Payload Fields</H3>
          <Table
            headers={["Field", "Type", "Required", "Description"]}
            rows={[
              ["`modelName`", "string", "Yes", "HuggingFace model ID (org/model)"],
              ["`modelType`", "string", "Yes", "pretrained | finetuned | instruction | rl"],
              ["`precision`", "string", "Yes", "bfloat16 | float16 | float32 | int8"],
              ["`revision`", "string", "No", "Model revision. Defaults to \"main\""],
              ["`weightType`", "string", "No", "Original | Delta | Adapter"],
              ["`baseModel`", "string", "Conditional", "Required for Delta/Adapter weights"],
              ["`backend`", "string", "Yes", "vlmevalkit | lmmseval | others"],
              ["`scores`", "object", "Yes", "Benchmark ID → number or null"],
              ["`subScores`", "object", "No", "Benchmark ID → { sub_key → number or null }"],
              ["`remarks`", "string", "No", "Free-text notes"],
            ]}
          />

          <H3>Zip File Requirements</H3>
          <P>
            The zip file must contain your raw evaluation result files for independent verification.
          </P>
          <ul className="space-y-1 mb-4">
            <Li><strong className="text-lb-text">Max size:</strong> 20 MB (max decompressed: 100 MB)</Li>
            <Li><strong className="text-lb-text">Allowed file types:</strong> .json, .jsonl, .csv, .tsv, .txt, .log, .yaml, .yml, .xml, .md, .html, .pdf, .py, .sh, .png, .jpg, .jpeg, .gif, .svg, .parquet, .arrow, .npy, .pkl</Li>
            <Li><strong className="text-lb-text">Security:</strong> Files with disallowed extensions or path traversal patterns are rejected</Li>
          </ul>

          <H3>Sub-Scores</H3>
          <P>
            Each benchmark has a set of sub-score keys. The <Code>subScores</Code> field is optional — only include benchmarks
            where at least one sub-score is filled. Unfilled sub-scores within an included benchmark should be <Code>null</Code>.
            See the benchmark sub-score keys in the submit form for the full mapping.
          </P>

          <H3>Benchmark IDs</H3>
          <P>EASI-8 (core):</P>
          <Table
            headers={["ID", "Name", "Metric"]}
            rows={[
              ["`vsi_bench`", "VSI-Bench", "Acc."],
              ["`mmsi_bench`", "MMSI-Bench", "Acc."],
              ["`mindcube_tiny`", "MindCube-Tiny", "Acc."],
              ["`viewspatial`", "ViewSpatial", "Acc."],
              ["`site`", "SITE", "CAA"],
              ["`blink`", "BLINK", "Acc."],
              ["`3dsrbench`", "3DSRBench", "Acc."],
              ["`embspatial`", "EmbSpatial", "Acc."],
            ]}
          />
          <P>Additional:</P>
          <Table
            headers={["ID", "Name", "Metric"]}
            rows={[
              ["`mmsi_video_bench`", "MMSI-Video-Bench", "Acc."],
              ["`omnispatial_(manual_cot)`", "OmniSpatial (Manual CoT)", "Acc."],
              ["`spar_bench`", "SPAR-Bench", "Acc."],
              ["`vsi_debiased`", "VSI-Debiased", "Acc."],
            ]}
          />
          <P>A <Code>null</Code> value means not evaluated. A <Code>0</Code> value means evaluated with a score of zero.</P>

          <H3>Validation Pipeline</H3>
          <Table
            headers={["Step", "Check", "Status"]}
            rows={[
              ["1", "HF_UPLOAD_TOKEN configured", "500"],
              ["2", "Bearer token valid (OAuth or regular HF token)", "401"],
              ["3", "Rate limit not exceeded", "429"],
              ["4", "Valid multipart form data", "400"],
              ["5", "Payload JSON parseable", "400"],
              ["6", "Zip file present", "400"],
              ["7", "Zip valid (magic bytes, size, decompressed size, contents)", "400"],
              ["8", "modelName matches org/model format", "400"],
              ["9", "modelType non-empty", "400"],
              ["10", "precision non-empty", "400"],
              ["11", "Model exists on HuggingFace", "400"],
              ["12", "Model has a license", "400"],
              ["13", "Base model valid (Delta/Adapter)", "400"],
              ["14", "Upload to HF repo via LFS succeeds", "500"],
            ]}
          />

          <H3>Success Response</H3>
          <CodeBlock lang="json">{`{ "success": true }`}</CodeBlock>

          <H3>Error Messages</H3>
          <Table
            headers={["Status", "Message"]}
            rows={[
              ["500", "Server configuration error. Please contact the maintainers."],
              ["401", "Your session has expired. Please sign in with HuggingFace again."],
              ["429", "You've reached the submission limit (5 per 2 hours)."],
              ["400", "Invalid request. Expected multipart form data."],
              ["400", "Missing submission payload."],
              ["400", "Evaluation results zip file is required."],
              ["400", "File is not a valid ZIP archive."],
              ["400", "ZIP file exceeds 20 MB limit."],
              ["400", "ZIP decompressed size exceeds 100 MB limit."],
              ["400", "ZIP contains invalid file paths."],
              ["400", "ZIP contains disallowed file types: {list}"],
              ["400", "A valid model name in the format 'organization/model-name' is required."],
              ["400", "Model \"{name}\" was not found on HuggingFace."],
              ["400", "Model \"{name}\" does not have a license set."],
              ["400", "Base model is required when using {type} weights."],
              ["500", "Failed to upload your submission to the repository."],
            ]}
          />
        </Section>

        {/* ── Usage Examples ── */}
        <Section id="examples">
          <H2>Usage Examples</H2>
          <P>
            These examples use <Code>/api/submit-with-file/</Code> for script-based submissions.
            You can use a regular HuggingFace API token (from <Code>huggingface.co/settings/tokens</Code>) —
            no OAuth browser flow needed.
          </P>

          <H3>Python</H3>
          <CodeBlock lang="python">{`import requests
import json

# Use a regular HF API token (hf_*) — no OAuth needed
# Get one from: https://huggingface.co/settings/tokens
HF_TOKEN = "hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

payload = {
    "modelName": "org/model-name",
    "modelType": "instruction",       # pretrained | finetuned | instruction | rl
    "precision": "bfloat16",          # bfloat16 | float16 | float32 | int8
    "revision": "main",
    "weightType": "Original",         # Original | Delta | Adapter
    "baseModel": "",                  # required for Delta/Adapter
    "backend": "vlmevalkit",          # vlmevalkit | lmmseval | others
    "scores": {
        "vsi_bench": 27.0,
        "mmsi_bench": 28.6,
        "blink": None,                # null = not evaluated
        "site": 0,                    # 0 = evaluated with score of zero
    },
    "subScores": {                    # optional
        "vsi_bench": {
            "obj_appearance_order_accuracy": 25.3,
            "object_abs_distance": 18.7,
            "object_counting": None,
        },
    },
    "remarks": "Submitted via Python script",
}

# Submit with zip file (max 4.5 MB)
response = requests.post(
    "https://easi.lmms-lab.com/api/submit-with-file/",
    headers={"Authorization": f"Bearer {HF_TOKEN}"},
    files={
        "zipFile": (
            "eval_results.zip",
            open("eval_results.zip", "rb"),
            "application/zip",
        ),
    },
    data={"payload": json.dumps(payload)},
)

result = response.json()
if result.get("success"):
    print("Submission successful!")
else:
    print(f"Error ({response.status_code}): {result.get('error')}")`}</CodeBlock>

          <H3>cURL</H3>
          <CodeBlock lang="bash">{`# Use a regular HF API token — no OAuth needed
curl -X POST https://easi.lmms-lab.com/api/submit-with-file/ \\
  -H "Authorization: Bearer hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \\
  -F 'payload={
    "modelName": "org/model-name",
    "modelType": "instruction",
    "precision": "bfloat16",
    "revision": "main",
    "weightType": "Original",
    "baseModel": "",
    "backend": "vlmevalkit",
    "scores": {"vsi_bench": 27.0, "mmsi_bench": 28.6},
    "subScores": {"vsi_bench": {"object_counting": 30.2}},
    "remarks": "Submitted via cURL"
  }' \\
  -F "zipFile=@eval_results.zip"

# Response: {"success": true}`}</CodeBlock>

          <H3>Notes</H3>
          <ul className="space-y-1 mb-4">
            <Li><strong className="text-lb-text">Zip size limit:</strong> 4.5 MB for script submissions. For larger files, use the web form at <Code>/submit</Code></Li>
            <Li><strong className="text-lb-text">Token type:</strong> Both regular HF API tokens (<Code>hf_*</Code>) and OAuth tokens (<Code>hf_oauth_*</Code>) are accepted</Li>
            <Li><strong className="text-lb-text">Rate limit:</strong> 5 submissions per 2-hour window per user</Li>
            <Li><strong className="text-lb-text">Scores:</strong> Use <Code>null</Code> for benchmarks not evaluated, <Code>0</Code> for zero score</Li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
