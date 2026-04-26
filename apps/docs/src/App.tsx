import { ConvexPanel, convexPanelBus } from "convex-inspect/react";

let idCounter = 0;
function nextId() {
  return `docs-${Date.now()}-${++idCounter}`;
}

function emitEvent(type: "query" | "mutation" | "action", name: string, args: unknown, delay: number) {
  const id = nextId();
  const startedAt = Date.now();
  convexPanelBus.emit({ id, type, name, args, status: "loading", startedAt });

  setTimeout(() => {
    const ok = Math.random() > 0.18;
    convexPanelBus.emit({
      id,
      type,
      name,
      args,
      status: ok ? "success" : "error",
      result: ok ? (type === "query" ? [{ _id: "abc123", text: "Example task" }] : { ok: true }) : undefined,
      error: ok ? undefined : "ConvexError: simulated failure",
      startedAt,
      completedAt: Date.now(),
    });
  }, delay);
}

function triggerQuery() {
  emitEvent("query", "tasks:list", {}, 180 + Math.random() * 240);
}

function triggerMutation() {
  emitEvent("mutation", "tasks:add", { text: "Buy milk" }, 320 + Math.random() * 520);
}

function triggerAction() {
  emitEvent("action", "email:send", { to: "user@example.com" }, 720 + Math.random() * 820);
}

const codeInstall = `pnpm add convex-inspect`;
const codeImport = `import { ConvexPanel, useQuery, useMutation, useAction } from "convex-inspect/react";`;
const codeRender = `<ConvexPanel />`;

export function App() {
  return (
    <>
      <main className="page-shell">
        <header className="site-header">
          <div className="site-brand">
            <span className="site-mark" aria-hidden="true" />
            <span>convex-inspect</span>
          </div>
          <nav className="site-nav" aria-label="Project links">
            <a href="https://github.com/barrymichaeldoyle/convex-inspect" target="_blank" rel="noreferrer">GitHub</a>
            <a href="#install">Install</a>
            <a href="#features">Features</a>
          </nav>
        </header>

        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Convex Devtools</p>
            <div className="hero-badges" aria-label="Package status">
              <span className="hero-badge hero-badge-strong">npm: `convex-inspect`</span>
              <span className="hero-badge">version: `0.1.0`</span>
              <span className="hero-badge">dev-only React entry</span>
            </div>
            <h1>Inspect queries, mutations, and actions without leaving your app.</h1>
            <p className="lede">
              `convex-inspect` gives you a compact in-app event log with keyboard-accessible rows, JSON inspection, and quick copy
              controls for debugging Convex flows during development.
            </p>
            <div className="hero-actions">
              <a className="primary-link" href="https://github.com/barrymichaeldoyle/convex-inspect" target="_blank" rel="noreferrer">
                View on GitHub
              </a>
              <span className="status-pill">npm name currently unavailable</span>
            </div>
          </div>

          <div className="hero-card">
            <div className="card-label">Live Demo</div>
            <div className="demo-grid">
              <button className="demo-btn demo-btn-query" onClick={triggerQuery}>Trigger query</button>
              <button className="demo-btn demo-btn-mutation" onClick={triggerMutation}>Trigger mutation</button>
              <button className="demo-btn demo-btn-action" onClick={triggerAction}>Trigger action</button>
            </div>
            <p className="card-note">Open the panel in the bottom-right corner and trigger a few events.</p>
          </div>
        </section>

        <section className="info-grid" id="install">
          <article className="info-card">
            <h2>Install</h2>
            <CodeBlock code={codeInstall} />
          </article>
          <article className="info-card">
            <h2>Import</h2>
            <CodeBlock code={codeImport} />
          </article>
          <article className="info-card">
            <h2>Render</h2>
            <CodeBlock code={codeRender} />
          </article>
        </section>

        <section className="feature-strip" id="features">
          <div>
            <h3>Built for day-to-day debugging</h3>
            <p>Track query, mutation, and action lifecycles with minimal setup and a dev-only default React entrypoint.</p>
          </div>
          <ul className="feature-list">
            <li>Event filtering with a collapsed-by-default panel control</li>
            <li>Keyboard-accessible rows with animated details expansion</li>
            <li>Copy actions for inspected JSON payloads</li>
          </ul>
        </section>
      </main>

      <ConvexPanel />
    </>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="code-block">
      <code>{code}</code>
    </pre>
  );
}
