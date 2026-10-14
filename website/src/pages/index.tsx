import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

const GREEN = '!text-[#3ECF8E]';

function Icon({ path }: { path: string }): ReactNode {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  table: 'M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14z M3 10h18 M10 3v18',
  history: 'M3 12a9 9 0 1 0 9 -9 M3 5v4h4 M12 7v5l3 2',
  lock: 'M5 11h14v10h-14z M8 11v-4a4 4 0 0 1 8 0v4',
  key: 'M15 9a4 4 0 1 0 -4 4 M15 9l6 0 M15 9l0 6 M11 13l-7 7',
  refresh: 'M21 12a9 9 0 1 1 -2.64 -6.36 M21 3v6h-6',
  terminal: 'M4 17l6 -6l-6 -6 M12 19h8',
};

function Eyebrow({ children }: { children: ReactNode }): ReactNode {
  return (
    <p className={`!text-[13px] !font-medium !tracking-wide ${GREEN}`}>
      <span className="!mr-2 !inline-block !h-1.5 !w-1.5 !rounded-full !bg-[#3ECF8E]" />
      {children}
    </p>
  );
}

function SectionHeading({ children }: { children: ReactNode }): ReactNode {
  return (
    <h2 className="!mt-3 !max-w-xl !text-3xl !font-semibold !tracking-tight !text-white sm:!text-4xl">{children}</h2>
  );
}

function SectionSub({ children }: { children: ReactNode }): ReactNode {
  return <p className="!mt-3 !max-w-xl !text-[15px] !leading-7 !text-zinc-400">{children}</p>;
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }): ReactNode {
  return (
    <div className={`!min-w-0 !rounded-xl !border !border-white/10 !bg-[#111111] !p-5 ${className}`}>{children}</div>
  );
}

function CardHeader({ icon, title, description }: { icon: string; title: string; description: string }): ReactNode {
  return (
    <div>
      <div className="!flex !items-center !gap-2 !text-zinc-200">
        <span className={`!inline-flex ${GREEN}`}>
          <Icon path={icon} />
        </span>
        <h3 className="!m-0 !text-[15px] !font-semibold">{title}</h3>
      </div>
      <p className="!mt-2 !text-[13px] !leading-6 !text-zinc-500">{description}</p>
    </div>
  );
}

function Hero(): ReactNode {
  return (
    <section className="!relative !overflow-hidden !border-b !border-white/5">
      <div className="!pointer-events-none !absolute !inset-x-0 !top-0 !h-72 !bg-[radial-gradient(ellipse_50%_100%_at_50%_0%,_rgba(62,207,142,0.09),_transparent)]" />
      <div className="!relative !mx-auto !grid !max-w-6xl !gap-10 !px-6 !pb-14 !pt-16 lg:!grid-cols-[1.2fr_0.8fr] lg:!items-end lg:!px-8 lg:!pt-24">
        <div>
          <h1 className="!text-4xl !font-semibold !leading-[1.1] !tracking-tight !text-white sm:!text-5xl">
            Manage Kubernetes secrets <br />
            <span className={GREEN}>without touching kubectl.</span>
          </h1>
          <div className="!mt-6 !flex !flex-wrap !gap-3">
            <Link
              className="!inline-flex !items-center !rounded-md !bg-[#3ECF8E] !px-4 !py-2 !text-sm !font-medium !text-black !no-underline !transition hover:!bg-[#4be19d]"
              to="/about/quick-start/"
            >
              Open Quick Start
            </Link>
            <Link
              className="!inline-flex !items-center !rounded-md !border !border-white/15 !bg-white/5 !px-4 !py-2 !text-sm !font-medium !text-zinc-200 !no-underline !transition hover:!bg-white/10"
              to="/guides/sandbox/"
            >
              Try the Sandbox
            </Link>
          </div>
        </div>
        <p className="!max-w-md !text-sm !leading-7 !text-zinc-400 lg:!justify-self-end">
          K8ston is a lightweight UI and API backed directly by native Secret objects. SSO proves who you are,
          annotations decide what you may see, and every change is versioned — with Velero, GitOps, and RBAC still in
          charge underneath.
        </p>
      </div>
    </section>
  );
}

function MaskedRow({ name, meta, revealed }: { name: string; meta: string; revealed?: string }): ReactNode {
  return (
    <div className="!flex !items-center !justify-between !rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2">
      <div className="!min-w-0">
        <div className="!truncate !font-mono !text-[11px] !text-zinc-300">{name}</div>
        <div className="!font-mono !text-[11px] !text-zinc-600">{revealed ?? '••••••••••'}</div>
      </div>
      <span className="!ml-3 !shrink-0 !font-mono !text-[10px] !text-zinc-500">{meta}</span>
    </div>
  );
}

function BentoGrid(): ReactNode {
  return (
    <section className="!border-b !border-white/5">
      <div className="!mx-auto !max-w-6xl !px-6 !py-14 lg:!px-8">
        <div className="!grid !gap-4 md:!grid-cols-2 lg:!grid-cols-3">
          <Card>
            <CardHeader
              icon={ICONS.table}
              title="Secrets dashboard"
              description="Browse namespaces, create and edit secrets with masked values until you reveal them."
            />
            <div className="!mt-4 !space-y-2">
              <MaskedRow name="database-credentials" meta="v3 · 2 keys" />
              <MaskedRow name="feature-flags" meta="v1 · 5 keys" revealed="postgres://…" />
            </div>
          </Card>

          <Card>
            <CardHeader
              icon={ICONS.history}
              title="One-click rollbacks"
              description="Every write snapshots first into <name>-vN. Restores are reversible by construction."
            />
            <div className="!mt-4 !space-y-2 !font-mono !text-[11px]">
              <div className="!flex !items-center !justify-between !rounded-md !border !border-[#3ECF8E]/25 !bg-[#3ECF8E]/5 !px-3 !py-2">
                <span className="!text-zinc-200">v3 · current</span>
                <span className={GREEN}>● live</span>
              </div>
              <div className="!flex !items-center !justify-between !rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2">
                <span className="!text-zinc-500">v2 · alice · 09:30</span>
                <span className="!text-zinc-600">restore →</span>
              </div>
              <div className="!flex !items-center !justify-between !rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2">
                <span className="!text-zinc-500">v1 · bob · Tue</span>
                <span className="!text-zinc-600">restore →</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              icon={ICONS.lock}
              title="Hybrid authorization"
              description="Per-secret annotations override one namespace fallback. Admins always pass."
            />
            <div className="!mt-4 !space-y-2 !font-mono !text-[11px]">
              <div className="!rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2 !text-zinc-400">
                <span className="!text-zinc-600">allowed-groups:</span> dev-team
              </div>
              <div className="!rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2 !text-zinc-400">
                <span className="!text-zinc-600">allowed-users:</span> alice@company.com
              </div>
              <div className="!rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2 !text-zinc-600">
                <span>no rules → open to all authenticated</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              icon={ICONS.key}
              title="OIDC SSO"
              description="Keycloak, Entra ID, Okta, Google, GitHub. Users never need cluster credentials."
            />
            <div className="!mt-4 !rounded-md !border !border-white/5 !bg-black/40 !p-3">
              <div className="!rounded-md !bg-[#3ECF8E] !px-3 !py-2 !text-center !text-[12px] !font-medium !text-black">
                Continue with Keycloak
              </div>
              <div className="!mt-3 !flex !items-center !justify-center !gap-2">
                {['Entra ID', 'Okta', 'Google', 'GitHub'].map((p) => (
                  <span
                    key={p}
                    className="!rounded-full !border !border-white/10 !px-2 !py-0.5 !text-[10px] !text-zinc-500"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              icon={ICONS.refresh}
              title="Consumer restarts"
              description="Env-var consumers need a rollout after edits. Volume mounts sync on their own."
            />
            <div className="!mt-4 !space-y-2 !font-mono !text-[11px]">
              <div className="!flex !items-center !justify-between !rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2">
                <span className="!text-zinc-400">deploy/api-server</span>
                <span className={GREEN}>restarted ✓</span>
              </div>
              <div className="!flex !items-center !justify-between !rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2">
                <span className="!text-zinc-400">sts/cache</span>
                <span className="!text-zinc-600">volume · auto-sync</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              icon={ICONS.terminal}
              title="REST API"
              description="Drive everything from scripts: CRUD, versions, restores, restarts, auth, config."
            />
            <div className="!mt-4 !space-y-2 !font-mono !text-[11px]">
              <div className="!flex !items-center !justify-between !rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2">
                <span className="!text-zinc-400">GET /api/namespaces</span>
                <span className={GREEN}>200</span>
              </div>
              <div className="!flex !items-center !justify-between !rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2">
                <span className="!text-zinc-400">PUT …/demo-secret</span>
                <span className={GREEN}>200</span>
              </div>
              <div className="!flex !items-center !justify-between !rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2">
                <span className="!text-zinc-400">PUT …stale resourceVersion</span>
                <span className="!text-amber-400">409</span>
              </div>
            </div>
          </Card>
        </div>
        <p className="!mt-8 !text-center !text-sm !text-zinc-500">
          Use the UI, the API, or both. <span className="!text-zinc-300">One platform over native Secrets.</span>
        </p>
      </div>
    </section>
  );
}

function StackStrip(): ReactNode {
  const groups = [
    { label: 'Sign in with', items: ['Keycloak', 'Entra ID', 'Okta', 'Google', 'GitHub'] },
    { label: 'Keeps working', items: ['kubectl', 'Velero', 'Argo CD', 'RBAC', 'Audit logs'] },
  ];
  return (
    <section className="!border-b !border-white/5 !bg-[#0a0a0a]">
      <div className="!mx-auto !max-w-6xl !space-y-5 !px-6 !py-10 lg:!px-8">
        <p className="!text-center !text-[13px] !text-zinc-500">
          Plays nicely with your identity provider — and your platform
        </p>
        {groups.map((group) => (
          <div key={group.label} className="!flex !flex-wrap !items-center !justify-center !gap-2">
            <span className="!mr-2 !text-[11px] !uppercase !tracking-[0.18em] !text-zinc-600">{group.label}</span>
            {group.items.map((item) => (
              <span
                key={item}
                className="!inline-flex !items-center !gap-2 !rounded-md !border !border-white/10 !bg-[#111111] !px-3 !py-1.5 !text-[13px] !text-zinc-300"
              >
                <span className="!h-1.5 !w-1.5 !rounded-full !bg-[#3ECF8E]" />
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function Dashboard(): ReactNode {
  return (
    <section className="!border-b !border-white/5">
      <div className="!mx-auto !max-w-6xl !px-6 !py-16 lg:!px-8 lg:!py-24">
        <Eyebrow>Dashboard</Eyebrow>
        <SectionHeading>Stay productive without leaving the browser</SectionHeading>
        <SectionSub>
          Namespaces on the left, secrets in the middle, history one click away. Values stay masked until you reveal
          them — and the audit log only ever records key names.
        </SectionSub>

        <div className="!mt-10 !overflow-hidden !rounded-xl !border !border-white/10 !bg-[#0d0d0d] !shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
          <div className="!flex !items-center !gap-2 !border-b !border-white/10 !px-4 !py-3">
            <span className="!h-2.5 !w-2.5 !rounded-full !bg-[#ff5f57]" />
            <span className="!h-2.5 !w-2.5 !rounded-full !bg-[#febc2e]" />
            <span className="!h-2.5 !w-2.5 !rounded-full !bg-[#28c840]" />
            <span className="!ml-3 !flex-1 !truncate !rounded-md !bg-white/5 !px-3 !py-1 !font-mono !text-[11px] !text-zinc-500">
              k8ston.example.com/secrets/k8ston-test/database-credentials
            </span>
          </div>
          <div className="!grid md:!grid-cols-[200px_1fr]">
            <div className="!hidden !border-r !border-white/10 !p-4 md:!block">
              <p className="!text-[10px] !uppercase !tracking-[0.18em] !text-zinc-600">Namespaces</p>
              <div className="!mt-3 !space-y-1 !text-[13px]">
                <div className="!rounded-md !bg-white/5 !px-3 !py-2 !text-zinc-200">k8ston-test</div>
                <div className="!rounded-md !px-3 !py-2 !text-zinc-500">frontend-ns</div>
                <div className="!rounded-md !px-3 !py-2 !text-zinc-500">production</div>
              </div>
              <div className="!mt-6 !rounded-md !border !border-white/10 !p-3">
                <p className="!font-mono !text-[11px] !text-zinc-300">alice@company.com</p>
                <p className={`!mt-1 !font-mono !text-[10px] ${GREEN}`}>dev-team · can edit</p>
              </div>
            </div>
            <div className="!p-4 sm:!p-6">
              <div className="!flex !flex-wrap !items-center !justify-between !gap-3">
                <div className="!flex !items-center !gap-3">
                  <h3 className="!m-0 !font-mono !text-sm !text-white">database-credentials</h3>
                  <span className="!rounded-full !border !border-[#3ECF8E]/30 !bg-[#3ECF8E]/10 !px-2 !py-0.5 !font-mono !text-[10px] !text-[#3ECF8E]">
                    v3
                  </span>
                </div>
                <div className="!flex !gap-2 !text-[12px]">
                  <span className="!rounded-md !bg-[#3ECF8E] !px-3 !py-1.5 !font-medium !text-black">Edit</span>
                  <span className="!rounded-md !border !border-white/15 !px-3 !py-1.5 !text-zinc-300">History</span>
                  <span className="!rounded-md !border !border-white/15 !px-3 !py-1.5 !text-zinc-300">
                    Restart apps
                  </span>
                </div>
              </div>
              <div className="!mt-4 !space-y-2">
                <div className="!flex !items-center !justify-between !rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2.5">
                  <span className="!font-mono !text-[12px] !text-zinc-300">DATABASE_URL</span>
                  <span className="!flex !items-center !gap-3">
                    <span className="!font-mono !text-[12px] !text-zinc-600">••••••••••</span>
                    <span className={`!font-mono !text-[11px] ${GREEN}`}>Reveal</span>
                  </span>
                </div>
                <div className="!flex !items-center !justify-between !rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2.5">
                  <span className="!font-mono !text-[12px] !text-zinc-300">DB_PASSWORD</span>
                  <span className="!flex !items-center !gap-3">
                    <span className="!font-mono !text-[12px] !text-zinc-600">••••••••••</span>
                    <span className={`!font-mono !text-[11px] ${GREEN}`}>Reveal</span>
                  </span>
                </div>
              </div>
              <div className="!mt-4 !flex !flex-wrap !gap-2 !font-mono !text-[10px]">
                <span className="!rounded-full !border !border-white/10 !px-2 !py-1 !text-zinc-500">
                  allowed-groups: dev-team
                </span>
                <span className="!rounded-full !border !border-white/10 !px-2 !py-1 !text-zinc-500">
                  1 MiB guard · 412 B
                </span>
                <span className="!rounded-full !border !border-white/10 !px-2 !py-1 !text-zinc-500">
                  etcd encrypted ✓
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const codeSample = `# Headless authz checks (no browser)
ALICE=$(node sandbox/scripts/mint-jwt.mjs \\
  --email alice@company.com --groups dev-team)

curl --cookie "k8ston_session=$ALICE" \\
  localhost:3000/api/namespaces/k8ston-test/secrets

# Optimistic-concurrency update (409 on drift)
curl --cookie "k8ston_session=$ALICE" -X PUT \\
  -H 'Content-Type: application/json' \\
  -d '{"data":{"API_KEY":"<rotated>"},"resourceVersion":"'$RV'"}' \\
  localhost:3000/api/namespaces/k8ston-test/secrets/demo-secret

# Reversible restore — snapshots current state first
curl --cookie "k8ston_session=$ALICE" -X POST \\
  -d '{"version":1}' \\
  localhost:3000/api/namespaces/k8ston-test/secrets/demo-secret/restore`;

function CodeSection(): ReactNode {
  return (
    <section className="!border-b !border-white/5 !bg-[#0a0a0a]">
      <div className="!mx-auto !grid !max-w-6xl !items-center !gap-10 !px-6 !py-16 lg:!grid-cols-[0.9fr_1.1fr] lg:!px-8 lg:!py-24">
        <div>
          <Eyebrow>Automation</Eyebrow>
          <SectionHeading>Drive K8ston from scripts</SectionHeading>
          <SectionSub>
            Plain REST over JSON with session-cookie auth. Values cross the API as plain strings — base64 stays inside
            Kubernetes.
          </SectionSub>
          <ul className="!mt-6 !list-none !space-y-3 !p-0 !text-sm !text-zinc-400">
            {[
              'CRUD plus versions, restores, and consumer restarts',
              'resourceVersion writes: 409 instead of silent clobbers',
              'Every restore snapshots first — rollbacks stay reversible',
            ].map((item) => (
              <li key={item} className="!flex !items-start !gap-3">
                <span className={`!mt-1 ${GREEN}`}>✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link className={`!mt-6 !inline-block !text-sm !font-medium ${GREEN} hover:!underline`} to="/api/overview/">
            Read the API reference →
          </Link>
        </div>
        <div className="!min-w-0 !overflow-hidden !rounded-xl !border !border-white/10 !bg-[#0d0d0d]">
          <div className="!flex !items-center !justify-between !border-b !border-white/10 !px-4 !py-2.5">
            <div className="!flex !items-center !gap-2">
              <span className="!h-2.5 !w-2.5 !rounded-full !bg-[#ff5f57]" />
              <span className="!h-2.5 !w-2.5 !rounded-full !bg-[#febc2e]" />
              <span className="!h-2.5 !w-2.5 !rounded-full !bg-[#28c840]" />
            </div>
            <span className="!font-mono !text-[11px] !text-zinc-600">bash</span>
          </div>
          <pre className="!m-0 !overflow-x-auto !border-0 !bg-transparent !p-5 !font-mono !text-[12px] !leading-6 !text-zinc-300">
            <code className="!border-0 !bg-transparent !p-0">{codeSample}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}

function DeployOptions(): ReactNode {
  const options = [
    {
      title: 'Sandbox',
      description: 'kind + Dex + seeded fixtures. Real SSO on localhost in one command.',
      snippet: 'make up',
      to: '/guides/sandbox/',
      link: 'Open the sandbox guide →',
    },
    {
      title: 'Raw manifests',
      description: 'Namespace Role by default, ClusterRole when you need the full dashboard.',
      snippet: 'kubectl apply -f app/k8s/',
      to: '/guides/deploy-kubernetes/',
      link: 'Deploy to Kubernetes →',
    },
    {
      title: 'Helm + OCI',
      description: 'Umbrella chart or direct OCI install. Chart version tracks the app release.',
      snippet: 'helm install k8ston oci://ghcr.io/egose/charts/k8ston',
      to: '/guides/deploy-helm/',
      link: 'Deploy with Helm →',
    },
  ];
  return (
    <section className="!border-b !border-white/5">
      <div className="!mx-auto !max-w-6xl !px-6 !py-16 lg:!px-8 lg:!py-24">
        <Eyebrow>Deployment</Eyebrow>
        <SectionHeading>Ship it your way</SectionHeading>
        <SectionSub>
          Stateless by design — all state lives in Kubernetes Secrets, so more than one replica is always safe.
        </SectionSub>
        <div className="!mt-10 !grid !gap-4 md:!grid-cols-3">
          {options.map((option) => (
            <Card key={option.title} className="!flex !flex-col">
              <h3 className="!text-[15px] !font-semibold !text-zinc-100">{option.title}</h3>
              <p className="!mt-2 !flex-1 !text-[13px] !leading-6 !text-zinc-500">{option.description}</p>
              <div className="!mt-4 !overflow-x-auto !rounded-md !border !border-white/5 !bg-black/60 !px-3 !py-2.5">
                <code className="!whitespace-nowrap !border-0 !bg-transparent !p-0 !font-mono !text-[11px] !text-zinc-300">
                  $ {option.snippet}
                </code>
              </div>
              <Link className={`!mt-4 !text-[13px] !font-medium ${GREEN} hover:!underline`} to={option.to}>
                {option.link}
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function OpenSource(): ReactNode {
  return (
    <section className="!border-b !border-white/5 !bg-[#0a0a0a]">
      <div className="!mx-auto !grid !max-w-6xl !items-center !gap-8 !px-6 !py-16 lg:!grid-cols-2 lg:!px-8">
        <div>
          <Eyebrow>Open source</Eyebrow>
          <SectionHeading>Open source from day one</SectionHeading>
          <SectionSub>
            Apache-2.0 licensed. No database to operate, no proprietary control plane — Kubernetes is the source of
            truth and the code stays boring on purpose.
          </SectionSub>
          <div className="!mt-6 !flex !flex-wrap !gap-3">
            <Link
              className="!inline-flex !items-center !rounded-md !border !border-white/15 !bg-white/5 !px-4 !py-2 !text-sm !font-medium !text-zinc-200 !no-underline !transition hover:!bg-white/10"
              to="https://github.com/egose/k8ston"
            >
              Star on GitHub
            </Link>
            <Link
              className={`!inline-flex !items-center !rounded-md !px-4 !py-2 !text-sm !font-medium ${GREEN} hover:!underline`}
              to="/about/security-model/"
            >
              Read the security model →
            </Link>
          </div>
        </div>
        <div className="!grid !grid-cols-3 !gap-4">
          {[
            { value: '0', label: 'databases to operate' },
            { value: '1', label: 'ConfigMap for access rules' },
            { value: 'N', label: 'native Secrets, versioned' },
          ].map((stat) => (
            <div key={stat.label} className="!rounded-xl !border !border-white/10 !bg-[#111111] !p-5 !text-center">
              <div className={`!font-mono !text-3xl !font-semibold ${GREEN}`}>{stat.value}</div>
              <div className="!mt-2 !text-[12px] !leading-5 !text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta(): ReactNode {
  return (
    <section>
      <div className="!mx-auto !max-w-4xl !px-6 !py-16 !text-center lg:!py-24">
        <h2 className="!text-3xl !font-semibold !tracking-tight !text-white sm:!text-4xl">
          Stop pasting secrets into chat.
        </h2>
        <p className="!mx-auto !mt-4 !max-w-xl !text-[15px] !leading-7 !text-zinc-400">
          Give developers self-service secrets with SSO login, group-based access, and versioned history — while
          platform keeps RBAC, audit, and GitOps exactly as they are.
        </p>
        <div className="!mt-8 !flex !flex-wrap !justify-center !gap-3">
          <Link
            className="!inline-flex !items-center !rounded-md !bg-[#3ECF8E] !px-4 !py-2 !text-sm !font-medium !text-black !no-underline !transition hover:!bg-[#4be19d]"
            to="/about/quick-start/"
          >
            Open Quick Start
          </Link>
          <Link
            className="!inline-flex !items-center !rounded-md !border !border-white/15 !bg-white/5 !px-4 !py-2 !text-sm !font-medium !text-zinc-200 !no-underline !transition hover:!bg-white/10"
            to="/api/overview/"
          >
            Browse API Reference
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="K8ston"
      description="K8ston is a Kubernetes-native secret manager: SSO login, hybrid authorization, versioned history, and one-click rollbacks on top of native Secret objects."
    >
      <main className="!bg-black">
        <Hero />
        <BentoGrid />
        <StackStrip />
        <Dashboard />
        <CodeSection />
        <DeployOptions />
        <OpenSource />
        <FinalCta />
      </main>
    </Layout>
  );
}
