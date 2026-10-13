"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["213"], {
7837(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_about_architecture_mdx_3e8_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-about-architecture-mdx-3e8.json
var site_docs_about_architecture_mdx_3e8_namespaceObject = JSON.parse('{"id":"about/architecture","title":"Architecture","description":"Krypton is a stateless Next.js App Router service. All persistent state lives in","source":"@site/docs/about/architecture.mdx","sourceDirName":"about","slug":"/about/architecture","permalink":"/about/architecture","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":2,"frontMatter":{"sidebar_label":"Architecture","sidebar_position":2},"sidebar":"about","previous":{"title":"Quick Start","permalink":"/about/quick-start"},"next":{"title":"Security Model","permalink":"/about/security-model"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
;// CONCATENATED MODULE: ./docs/about/architecture.mdx


const frontMatter = {
	sidebar_label: 'Architecture',
	sidebar_position: 2
};
const contentTitle = 'Architecture';

const assets = {

};



const toc = [{
  "value": "Request flow",
  "id": "request-flow",
  "level": 2
}, {
  "value": "Namespace policy cache (<code>lib/authz.ts</code>)",
  "id": "namespace-policy-cache-libauthzts",
  "level": 2
}, {
  "value": "Kubernetes client (<code>lib/k8s.ts</code>)",
  "id": "kubernetes-client-libk8sts",
  "level": 2
}, {
  "value": "Scopes (<code>lib/namespaces.ts</code>)",
  "id": "scopes-libnamespacests",
  "level": 2
}, {
  "value": "Versioning model (<code>lib/snapshot-store.ts</code>)",
  "id": "versioning-model-libsnapshot-storets",
  "level": 2
}, {
  "value": "Consumer restarts",
  "id": "consumer-restarts",
  "level": 2
}, {
  "value": "Project layout",
  "id": "project-layout",
  "level": 2
}, {
  "value": "Related pages",
  "id": "related-pages",
  "level": 2
}];
function _createMdxContent(props) {
  const _components = {
    a: "a",
    code: "code",
    h1: "h1",
    h2: "h2",
    header: "header",
    li: "li",
    p: "p",
    pre: "pre",
    strong: "strong",
    table: "table",
    tbody: "tbody",
    td: "td",
    th: "th",
    thead: "thead",
    tr: "tr",
    ul: "ul",
    ...(0,lib/* .useMDXComponents */.R)(),
    ...props.components
  };
  return (0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
    children: [(0,jsx_runtime.jsx)(_components.header, {
      children: (0,jsx_runtime.jsx)(_components.h1, {
        id: "architecture",
        children: "Architecture"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Krypton is a stateless Next.js App Router service. All persistent state lives in\nthe Kubernetes API; the app holds no database connection or disk cache. Namespace\npolicy uses a 60-second in-memory ConfigMap read-through cache."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "request-flow",
      children: "Request flow"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-text",
        children: "Browser ──cookie (HS256 session JWT)──▶ Next.js route handler\n                                              │ 1. requireUser() → SessionUser\n                                              │ 2. assertNamespaceAllowed()\n                                              │ 3. loadAuthorizedLiveSecret()\n                                              │    ├─ read current Secret via CoreV1Api\n                                              │    ├─ live visibility (404 for history; managed-only gate)\n                                              │    └─ canAccessSecret() (admin → ACL → policy → confirmed open)\n                                              ▼\n                                        Kubernetes API (ServiceAccount token in-cluster,\n                                                       ~/.kube/config locally)\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Named-secret GET/PUT/DELETE/history/restore/restart handlers authenticate the\nsession and check namespace scope before using the shared loader in\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "lib/secret-access.ts"
      }), ". It rejects history objects in both managed-only modes,\nthen evaluates current live authorization before any history access or mutation.\nLists use the same live-visibility predicate; creation uses namespace policy alone.\nRestart also requires its deployment feature flag. Visibility/ACL denials and\nsuccessful mutations use metadata-only audit events."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The loader composes ", (0,jsx_runtime.jsx)(_components.code, {
        children: "authz.ts"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "secrets.ts"
      }), ", and HTTP errors; the policy and secret\nstorage modules do not import the loader. This keeps route enforcement shared\nwithout a dependency cycle through storage and authorization."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.h2, {
      id: "namespace-policy-cache-libauthzts",
      children: ["Namespace policy cache (", (0,jsx_runtime.jsx)(_components.code, {
        children: "lib/authz.ts"
      }), ")"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "Admins and explicit live-secret ACLs are decided before namespace fallback."
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Only a ConfigMap read returning 404 means absence. Valid empty/omitted rules\nremain intentionally open. Missing payload, invalid JSON/schema, and read\nfailures become a controlled ", (0,jsx_runtime.jsx)(_components.code, {
          children: "503 Namespace access policy is unavailable"
        }), "."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "Successful policy reads and confirmed absence are cached per process for 60s\nfrom completion. Concurrent misses share one pending read. Expired entries are\ndiscarded before refresh; errors neither revive stale policy nor populate the\ncache, and the next request retries."
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Non-admin collection requests also need namespace policy for the ", (0,jsx_runtime.jsx)(_components.code, {
          children: "canCreate"
        }), "\nhint, so an outage returns 503 for the whole list rather than partial results."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "Failure logs contain only a category and optional numeric HTTP status, never\nConfigMap payloads, SDK error objects, or transport headers."
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.h2, {
      id: "kubernetes-client-libk8sts",
      children: ["Kubernetes client (", (0,jsx_runtime.jsx)(_components.code, {
        children: "lib/k8s.ts"
      }), ")"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "In-cluster"
        }), ": uses the auto-mounted ServiceAccount token\n(", (0,jsx_runtime.jsx)(_components.code, {
          children: "/var/run/secrets/kubernetes.io/serviceaccount/token"
        }), ") via ", (0,jsx_runtime.jsx)(_components.code, {
          children: "loadFromCluster()"
        }), ".\nNo credentials to manage; RBAC comes from the bound ", (0,jsx_runtime.jsx)(_components.code, {
          children: "Role"
        }), "/", (0,jsx_runtime.jsx)(_components.code, {
          children: "ClusterRole"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Local dev"
        }), ": falls back to ", (0,jsx_runtime.jsx)(_components.code, {
          children: "loadFromDefault()"
        }), " (", (0,jsx_runtime.jsx)(_components.code, {
          children: "~/.kube/config"
        }), ")."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Optional impersonation"
        }), ": ", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_IMPERSONATION=true"
        }), " sends the session email\nand every group for human-authorized requests, including workload lists/patches.\nA per-request SDK ", (0,jsx_runtime.jsx)(_components.code, {
          children: "httpApi"
        }), " transport uses raw repeated group headers and retains\nthe SDK's TLS/auth configuration. The SA needs impersonation permission for the\ncorresponding human RBAC subjects. The access-policy ConfigMap remains a service\nread with the shared cache above. Default is ", (0,jsx_runtime.jsx)(_components.code, {
          children: "false"
        }), " (hybrid mode); explicit\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "AUTH_DISABLED=true"
        }), " bypasses human impersonation."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Error normalization"
        }), ": the shared numeric-only status classifier produces\nfixed ", (0,jsx_runtime.jsx)(_components.code, {
          children: "Kubernetes API (status): guidance"
        }), " responses. It never unwraps raw Status\nmessages, bodies, or headers. A 403 can be human RBAC/SA impersonation permission\ndenial or hybrid ServiceAccount RBAC; guidance refers to the effective identity."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Collections"
        }), ": ", (0,jsx_runtime.jsx)(_components.code, {
          children: "lib/k8s-list.ts"
        }), " completes serial 100-object pages with finite\naggregate limits. Live reads exclude history server-side without replacing\nannotation-based managed visibility or ACLs. UID-bound history and each workload\nkind share the reader and preserve full per-user request options. Missing/invalid\npages, bad/repeated tokens, or exhaustion fail instead of returning partial results.\nMetadata cleanup sizes/fingerprints projections without visiting Secret values.\nThe SDK buffers each upstream response first; ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/api/overview/#request-and-collection-budgets",
          children: "budgets"
        }), "\nbound application work/accumulation, not streaming transport responses."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "HTTP"
        }), ": ", (0,jsx_runtime.jsx)(_components.code, {
          children: "lib/http.ts"
        }), " bounds streamed JSON to 16 MiB, sanitizes validation/error\nenvelopes, and explicitly marks API JSON/auth redirects ", (0,jsx_runtime.jsx)(_components.code, {
          children: "Cache-Control: no-store"
        }), "."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.h2, {
      id: "scopes-libnamespacests",
      children: ["Scopes (", (0,jsx_runtime.jsx)(_components.code, {
        children: "lib/namespaces.ts"
      }), ")"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Scope"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Sees"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "RBAC"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "namespace"
            }), " (default)"]
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Only the pod's own namespace"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "Role"
            }), " + binding"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "cluster"
            }), ", allowlisted"]
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Configured names, checked locally"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Resource permissions in those namespaces"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "cluster"
            }), ", unrestricted"]
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Complete bounded namespace inventory"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Cluster namespace-list + resource permissions"
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "KRYPTON_NAMESPACES=\"team-a,team-b\""
      }), " resolves without namespace-list calls. Names are\ndeduplicated/sorted; actual resource calls still enforce existence and RBAC.\nUnrestricted discovery errors surface explicitly instead of falling back to an\nown-namespace subset. Policy lookups use own properties, including ", (0,jsx_runtime.jsx)(_components.code, {
        children: "constructor"
      }), "."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.h2, {
      id: "versioning-model-libsnapshot-storets",
      children: ["Versioning model (", (0,jsx_runtime.jsx)(_components.code, {
        children: "lib/snapshot-store.ts"
      }), ")"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["The focused store owns raw/metadata records, identity checks, retry verification,\nand cleanup. ", (0,jsx_runtime.jsx)(_components.code, {
          children: "secrets.ts"
        }), " converts raw records to decoded response DTOs only at\nthe authorized route boundary; restore copies raw data and cleanup reads metadata."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "krypton.io/version"
        }), " starts at 1. Adoption treats missing/old-zero counters as\nlogical v1: archive v1, write v2, then archive v2, write v3. PUT/restore supply their loaded\nresourceVersion; update/restore replacements retain the live UID/RV for native CAS."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["New snapshots are immutable Opaque Secrets named ", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton-h-<UID hash>-vN"
        }), "\n(at most 60 characters). Bounded ", (0,jsx_runtime.jsx)(_components.code, {
          children: "source-uid"
        }), " and ", (0,jsx_runtime.jsx)(_components.code, {
          children: "source-resource-version"
        }), " hash\nlabels support valid indexing for long live names and opaque revisions. Full UID,\nsource resourceVersion, original name/type, format, version, actor/time, and source\ndescription/ACL annotations are checked; live controller/lifecycle metadata is not copied."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "A snapshot-create 409 is a retry only when the occupied object has the same full\nsource identity and actual immutable byte/key content. Replica retries share that\narchive, then race through Kubernetes CAS. Different-source collisions block writing."
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_HISTORY_LIMIT"
        }), " is 1–100, default 20. Pruning uses serial UID/RV-conditional\ndeletes, confirms absence, and reports failed/pending cleanup before permitting\nreplacement. Snapshots and pruning can persist after a failed live write; these\npre-write captures are not a transaction or an external-change watcher."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "History is exposed only through an authorized live secret's version/restore\nendpoints. Snapshot names cannot be used as live route targets, and copied\nsnapshot ACLs do not determine current access. List/restore/prune/delete require\nthe live UID; retained predecessors never attach to a recreated name. Legacy and\nmalformed history is quarantined with no automatic name-based migration."
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "lib/secret-mutations.ts"
        }), " checks caller revisions and orchestrates live deletion.\nDELETE requires the expected resourceVersion, cleans bound history first, and\nrechecks the authorized live UID/RV before each cleanup mutation and before its\nnative UID/RV-conditional delete. Cleanup failures leave the live object available\nfor retry. A final read distinguishes confirmed absence (200) from pending live\nfinalizers (202); uncertain outcomes are errors."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["These are not cross-object transactions: earlier cleanup can survive conflicts,\nand a concurrent writer can add a snapshot after the last inventory. Retained,\npredecessor, legacy/quarantined, and late copies can require operator cleanup.\nSee the ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/versioning-history/",
          children: "history guide"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "lib/secret-queries.ts"
        }), " provides explicit client recovery that bypasses query\nstaleTime and HTTP caching. Restore/delete conflicts await fresh live/history\ndata; failed reloads retain the error. Confirmed deletion cancels reads and removes\ndetail/history caches; pending deletion refreshes them without navigation."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "consumer-restarts",
      children: "Consumer restarts"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Environment-variable consumers need new containers; ordinary Secret/projected\nmounts usually sync after a kubelet delay (", (0,jsx_runtime.jsx)(_components.code, {
        children: "subPath"
      }), " and application file reloads\nneed special care). ", (0,jsx_runtime.jsx)(_components.code, {
        children: "lib/consumers.ts"
      }), " scans Deployment, StatefulSet, and DaemonSet\ntemplates for exact Secret names in ", (0,jsx_runtime.jsx)(_components.code, {
        children: "env"
      }), "/", (0,jsx_runtime.jsx)(_components.code, {
        children: "envFrom"
      }), " on normal/init/ephemeral\ncontainers, normal/projected Secret volumes, and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "imagePullSecrets"
      }), ". It then\nrequests rollouts with a ", (0,jsx_runtime.jsx)(_components.code, {
        children: "krypton.io/restarted-at"
      }), " JSON-Patch pod-template patch,\nbound to each inspected workload UID/resourceVersion via ", (0,jsx_runtime.jsx)(_components.code, {
        children: "test"
      }), " preconditions and\nallowing at most four patches in flight per request across all kinds. Lists and\npatches retain the full request-local impersonated identity."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Only acknowledged patches are successful requests. Typed results distinguish\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "requested"
      }), " (200), complete ", (0,jsx_runtime.jsx)(_components.code, {
        children: "no_targets"
      }), " (200), ", (0,jsx_runtime.jsx)(_components.code, {
        children: "partial"
      }), " (207), and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "failed"
      }), " (503).\nFailed kind inventories are unknown and never count as empty; other kinds may\nstill be patched. Audit and UI preserve sanitized per-workload and discovery\nfailures. Rollout completion, health, and credential uptake are not checked.\nSee ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/consumer-restarts/",
        children: "consumer rollout limits and retries"
      }), ".\nThe feature is disabled by default\n(", (0,jsx_runtime.jsx)(_components.code, {
        children: "KRYPTON_RESTART_ENABLED=false"
      }), ": button hidden, API returns 403, no ", (0,jsx_runtime.jsx)(_components.code, {
        children: "apps"
      }), "\npermissions needed)."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "project-layout",
      children: "Project layout"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-text",
        children: "app/                    # Next.js App Router\n  app/api/namespaces/…  # secrets CRUD, versions, restore, restart-consumers\n  app/api/auth/…        # OIDC login/callback/logout/me\n  app/secrets/[ns]/…    # detail / edit / history views\n  lib/                  # k8s client, OIDC+session, authz, snapshots, consumers, validation\n  components/           # dashboard, tables, forms, masked values, history\n  k8s/                  # namespace, SA, Role/ClusterRole, configs, deployment\nhelm/                   # helm/main chart + helm/krypton subchart\nsandbox/                # kind cluster + Dex + fixtures + helper scripts\nwebsite/                # this documentation site (Docusaurus)\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "related-pages",
      children: "Related pages"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/about/security-model/",
          children: "Security Model"
        }), " for guarantees and hardening."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/authentication/",
          children: "Authentication"
        }), " and ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/authorization/",
          children: "Authorization"
        }), "\nfor the SSO + hybrid authz design."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/versioning-history/",
          children: "Versioning & History"
        }), " for snapshots, conflicts, and restores."]
      }), "\n"]
    })]
  });
}
function MDXContent(props = {}) {
  const {wrapper: MDXLayout} = {
    ...(0,lib/* .useMDXComponents */.R)(),
    ...props.components
  };
  return MDXLayout ? (0,jsx_runtime.jsx)(MDXLayout, {
    ...props,
    children: (0,jsx_runtime.jsx)(_createMdxContent, {
      ...props
    })
  }) : _createMdxContent(props);
}



},
3191(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.d(__webpack_exports__, {
  R: () => (useMDXComponents),
  x: () => (MDXProvider)
});
/* import */ var react__rspack_import_0 = __webpack_require__(2990);
/**
 * @import {MDXComponents} from 'mdx/types.js'
 * @import {Component, ReactElement, ReactNode} from 'react'
 */

/**
 * @callback MergeComponents
 *   Custom merge function.
 * @param {Readonly<MDXComponents>} currentComponents
 *   Current components from the context.
 * @returns {MDXComponents}
 *   Additional components.
 *
 * @typedef Props
 *   Configuration for `MDXProvider`.
 * @property {ReactNode | null | undefined} [children]
 *   Children (optional).
 * @property {Readonly<MDXComponents> | MergeComponents | null | undefined} [components]
 *   Additional components to use or a function that creates them (optional).
 * @property {boolean | null | undefined} [disableParentContext=false]
 *   Turn off outer component context (default: `false`).
 */



/** @type {Readonly<MDXComponents>} */
const emptyComponents = {}

const MDXContext = react__rspack_import_0.createContext(emptyComponents)

/**
 * Get current components from the MDX Context.
 *
 * @param {Readonly<MDXComponents> | MergeComponents | null | undefined} [components]
 *   Additional components to use or a function that creates them (optional).
 * @returns {MDXComponents}
 *   Current components.
 */
function useMDXComponents(components) {
  const contextComponents = react__rspack_import_0.useContext(MDXContext)

  // Memoize to avoid unnecessary top-level context changes
  return react__rspack_import_0.useMemo(
    function () {
      // Custom merge via a function prop
      if (typeof components === 'function') {
        return components(contextComponents)
      }

      return {...contextComponents, ...components}
    },
    [contextComponents, components]
  )
}

/**
 * Provider for MDX context.
 *
 * @param {Readonly<Props>} properties
 *   Properties.
 * @returns {ReactElement}
 *   Element.
 * @satisfies {Component}
 */
function MDXProvider(properties) {
  /** @type {Readonly<MDXComponents>} */
  let allComponents

  if (properties.disableParentContext) {
    allComponents =
      typeof properties.components === 'function'
        ? properties.components(emptyComponents)
        : properties.components || emptyComponents
  } else {
    allComponents = useMDXComponents(properties.components)
  }

  return react__rspack_import_0.createElement(
    MDXContext.Provider,
    {value: allComponents},
    properties.children
  )
}


},

}]);