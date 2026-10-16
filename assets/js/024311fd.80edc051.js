"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["343"], {
1207(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_guides_troubleshooting_mdx_024_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-guides-troubleshooting-mdx-024.json
var site_docs_guides_troubleshooting_mdx_024_namespaceObject = JSON.parse('{"id":"guides/troubleshooting","title":"Troubleshooting","description":"Login fails / redirect loops","source":"@site/docs/guides/troubleshooting.mdx","sourceDirName":"guides","slug":"/guides/troubleshooting","permalink":"/guides/troubleshooting","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":9,"frontMatter":{"sidebar_label":"Troubleshooting","sidebar_position":9},"sidebar":"guides","previous":{"title":"Consumer Restarts","permalink":"/guides/consumer-restarts"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
;// CONCATENATED MODULE: ./docs/guides/troubleshooting.mdx


const frontMatter = {
	sidebar_label: 'Troubleshooting',
	sidebar_position: 9
};
const contentTitle = 'Troubleshooting';

const assets = {

};



const toc = [{
  "value": "Login fails / redirect loops",
  "id": "login-fails--redirect-loops",
  "level": 2
}, {
  "value": "403 from the app vs 403 from Kubernetes",
  "id": "403-from-the-app-vs-403-from-kubernetes",
  "level": 2
}, {
  "value": "404 on a secret that exists",
  "id": "404-on-a-secret-that-exists",
  "level": 2
}, {
  "value": "409 on save",
  "id": "409-on-save",
  "level": 2
}, {
  "value": "503 history/configuration failure",
  "id": "503-historyconfiguration-failure",
  "level": 2
}, {
  "value": "Deletion is pending (202)",
  "id": "deletion-is-pending-202",
  "level": 2
}, {
  "value": "400 / 413 on save",
  "id": "400--413-on-save",
  "level": 2
}, {
  "value": "Incomplete inventory / collection budget",
  "id": "incomplete-inventory--collection-budget",
  "level": 2
}, {
  "value": "Namespace missing from the list",
  "id": "namespace-missing-from-the-list",
  "level": 2
}, {
  "value": "New secret is disabled / history did not load",
  "id": "new-secret-is-disabled--history-did-not-load",
  "level": 2
}, {
  "value": "Bulk entries have not appeared / import validation failed",
  "id": "bulk-entries-have-not-appeared--import-validation-failed",
  "level": 2
}, {
  "value": "<em>Restart apps</em> missing / 403",
  "id": "restart-apps-missing--403",
  "level": 2
}, {
  "value": "etcd warning banner won&#39;t go away",
  "id": "etcd-warning-banner-wont-go-away",
  "level": 2
}, {
  "value": "Wrong cluster / stale fixtures (sandbox)",
  "id": "wrong-cluster--stale-fixtures-sandbox",
  "level": 2
}];
function _createMdxContent(props) {
  const _components = {
    a: "a",
    code: "code",
    em: "em",
    h1: "h1",
    h2: "h2",
    header: "header",
    li: "li",
    p: "p",
    strong: "strong",
    ul: "ul",
    ...(0,lib/* .useMDXComponents */.R)(),
    ...props.components
  };
  return (0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
    children: [(0,jsx_runtime.jsx)(_components.header, {
      children: (0,jsx_runtime.jsx)(_components.h1, {
        id: "troubleshooting",
        children: "Troubleshooting"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "login-fails--redirect-loops",
      children: "Login fails / redirect loops"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Confirm ", (0,jsx_runtime.jsx)(_components.code, {
          children: "OIDC_ISSUER"
        }), " is the issuer identifier, not the discovery URL, and\nthat it exactly matches the discovery document's ", (0,jsx_runtime.jsx)(_components.code, {
          children: "issuer"
        }), " field."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Confirm the redirect URI registered at the IdP matches the app's\n(", (0,jsx_runtime.jsx)(_components.code, {
          children: "<configured-app-url>/api/auth/callback"
        }), ", or ", (0,jsx_runtime.jsx)(_components.code, {
          children: "OIDC_REDIRECT_URI"
        }), ").\nCheck runtime ", (0,jsx_runtime.jsx)(_components.code, {
          children: "APP_URL"
        }), " and any higher-precedence ", (0,jsx_runtime.jsx)(_components.code, {
          children: "NEXT_PUBLIC_APP_URL"
        }), " baked\ninto the image; see ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/configuration/",
          children: "Configuration"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["For ", (0,jsx_runtime.jsx)(_components.code, {
          children: "http://"
        }), " issuers (sandbox Dex): hostname must be loopback,\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "OIDC_ALLOW_HTTP=true"
        }), " must be set, and ", (0,jsx_runtime.jsx)(_components.code, {
          children: "NODE_ENV"
        }), " must not be ", (0,jsx_runtime.jsx)(_components.code, {
          children: "production"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["OIDC configuration is cached per process — restart ", (0,jsx_runtime.jsx)(_components.code, {
          children: "pnpm dev"
        }), " (or roll the\ndeployment) after Dex/IdP restarts or issuer changes."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Check Dex health: the discovery doc must answer at\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "http://localhost:5556/dex/.well-known/openid-configuration"
        }), " (", (0,jsx_runtime.jsx)(_components.code, {
          children: "make logs"
        }), "\nfor Dex container logs)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Callback logs expose classified codes/hints, not raw provider descriptions or\nauthorization response values. ", (0,jsx_runtime.jsx)(_components.code, {
          children: "descriptionCode: redirect_uri"
        }), " points to redirect\nregistration; ", (0,jsx_runtime.jsx)(_components.code, {
          children: "omitted"
        }), " means a diagnostic exceeded 2 KiB. ", (0,jsx_runtime.jsx)(_components.code, {
          children: "provider_error"
        }), " is\nthe fixed replacement for an unknown/oversized IdP code. ", (0,jsx_runtime.jsx)(_components.code, {
          children: "redirectBaseMatches"
        }), "\ncompares origin/path without logging either URL; false can be normal behind a\nreverse proxy because the token exchange uses the configured public redirect."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "403-from-the-app-vs-403-from-kubernetes",
      children: "403 from the app vs 403 from Kubernetes"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "You are not allowed to …"
        }), " → K8ston authz denied it (annotations /\nnamespace rules / admin config). Check the visibility matrix in\n", (0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/authorization/",
          children: "Authorization"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "Kubernetes API (403): Access denied. …"
        }), " → Kubernetes denied the effective\nidentity. In hybrid mode review ServiceAccount RBAC; in impersonation mode\nreview ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "human RBAC and SA impersonation grants for every group"
        }), ". It does not\ninvariably mean missing app ServiceAccount resource permissions. Inspect the\nconfigured scope/Role and use operator-side authorization checks with the\nintended identity. Raw API payload/header text is intentionally suppressed."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "404-on-a-secret-that-exists",
      children: "404 on a secret that exists"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "K8STON_MANAGED_ONLY=true"
        }), " (default) hides secrets without\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "k8ston.io/managed-by: k8ston"
        }), " — excluded from lists, 404 on direct access.\nEither manage the secret through K8ston or set the flag to ", (0,jsx_runtime.jsx)(_components.code, {
          children: "false"
        }), "."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "History snapshots are always hidden from the live list and direct routes. Use\nthe authorized live object's history endpoints. An empty history list can mean\nunbound legacy or predecessor-UID snapshots are quarantined, not erased."
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "409-on-save",
      children: "409 on save"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The secret changed since you loaded it (or a concurrent write raced yours). The\nfailed save keeps your draft. On the edit form, ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "Reload latest"
      }), " fetches the live\nSecret and, ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "only on success"
      }), ", replaces every field and its resourceVersion\ntogether. It also clears pending bulk text. Review the fresh state and re-apply\nyour changes before saving. A failed reload preserves the draft and original\nrevision; retry the same button after resolving the error."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Background refreshes and reconnects never replace the draft's fields or revision.\nAn available newer revision is announced, but saving the old draft still conflicts.\nDrafts are memory-only and can survive client navigation while Next retains the\npage; a full reload, sign-out, closed tab, or route eviction can discard them. See\n", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/versioning-history/#optimistic-concurrency-409s",
        children: "Versioning & History"
      }), "."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["An explicit ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "snapshot identity/content conflict"
      }), " needs review of the occupied\nversion's UID, source revision, and immutable bytes. A native edit after a failed\nK8ston write can leave the same app counter with a different source revision;\nreloading alone does not resolve that collision. Follow the\n", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/versioning-history/#upgrade-and-operator-reviewed-recovery",
        children: "reviewed recovery procedure"
      }), "\ninstead of relabeling or overwriting old snapshots."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Restore/delete conflicts also provide ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "Reload latest"
      }), ", which fetches fresh live\nand history data before closing the confirmation for review. A failed reload keeps\nthe error visible. These requests now require the expected live resourceVersion;\nmissing revisions return 400. Do not automatically retry with a newer revision."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "503-historyconfiguration-failure",
      children: "503 history/configuration failure"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Use a decimal ", (0,jsx_runtime.jsx)(_components.code, {
        children: "K8STON_HISTORY_LIMIT"
      }), " from 1 to 100 (default 20 when unset).\nHistory creation/list failures or failed/pending pruning block the live replacement.\nResolve Kubernetes permissions, quota/admission errors, or snapshot finalizers,\nthen retry; an exact-source retry also retries cleanup. Failed DELETE history cleanup\ndoes not attempt live deletion, preserving the authorization object for a retry.\nEarlier partial cleanup is not rolled back. If a concurrent writer removes the live\nobject, or live deletion/confirmation has an uncertain outcome, reload first; an\noperator must handle old-UID leftovers when there is no live object to authorize."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "deletion-is-pending-202",
      children: "Deletion is pending (202)"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The DELETE request was accepted but the Secret still exists, commonly because of\nfinalizers. The UI keeps it visible and disables edit/restore while pending.\nReload to check progress and obtain the latest resourceVersion before retrying.\nAn operator may need to resolve the responsible controller/finalizer. History\ncleanup can already have completed; a pending result does not promise an undo or\nthat every copy was erased. See ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/api/secrets/#delete-secret",
        children: "deletion semantics"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "400--413-on-save",
      children: "400 / 413 on save"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Malformed JSON/UTF-8, invalid length headers, invalid individual data maps, or ACLs\nover 256 entries / 256 UTF-8 bytes per entry return 400. A streaming JSON envelope\nover ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "16 MiB"
      }), " or an oversized merged/native data payload returns 413. The larger\nenvelope accommodates escaping; the conservative 1 MiB data limit still applies.\nSplit large data or move blobs to suitable storage. Also check ingress request\nlimits if rejection happens before the application. Validation issues identify\nknown top-level fields without echoing submitted values or arbitrary nested keys."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "incomplete-inventory--collection-budget",
      children: "Incomplete inventory / collection budget"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Lists follow 100-object Kubernetes pages with finite per-inventory page, object,\nand byte budgets. The response includes a fixed reason such as ", (0,jsx_runtime.jsx)(_components.code, {
        children: "page_limit"
      }), ",\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "item_limit"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "byte_limit"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "invalid_continue"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "repeated_continue"
      }), ", or\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "inconsistent_page"
      }), "; raw tokens/objects are excluded. A list failure is not an empty\nnamespace/history or a successful partial result. Retry a fresh request after\nrepair. An expired token is not automatically restarted. Review large history\nbacklogs through operator tooling; incomplete discovery never authorizes cleanup\nor workload patches based on earlier pages of that failed inventory. See the\n", (0,jsx_runtime.jsx)(_components.a, {
        href: "/api/overview/#request-and-collection-budgets",
        children: "exact budgets and accounting limits"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "namespace-missing-from-the-list",
      children: "Namespace missing from the list"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Loading and failed discovery are shown separately from a successful empty list.\nUse ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "Retry namespaces"
        }), " after resolving an error. A namespace URL parameter must\nstill identify an available namespace before the dashboard enables creation."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "namespace"
        }), " scope shows only the pod's own namespace — by design."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["In ", (0,jsx_runtime.jsx)(_components.code, {
          children: "cluster"
        }), " scope, a configured ", (0,jsx_runtime.jsx)(_components.code, {
          children: "K8STON_NAMESPACES"
        }), " list is returned/checked\nlocally with no namespace-list calls. Check spelling and per-namespace resource\nRBAC; configured entries do not prove the namespace exists or is readable."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["With an empty allowlist, complete namespace discovery needs namespace-list RBAC\nfor the effective identity. ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "Upgrade:"
        }), " discovery failures now surface an error\nrather than a silently incomplete own-namespace fallback. Use an explicit\nallowlist for curated multi-namespace deployments without cluster-wide listing."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "new-secret-is-disabled--history-did-not-load",
      children: "New secret is disabled / history did not load"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.strong, {
        children: "New secret"
      }), " requires successful namespace discovery and an explicit allowed\ncreation hint from that namespace's secret list. It remains disabled while those\nchecks are loading, missing, or failed, even if an older cached hint allowed creation.\nUse ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "Retry secrets"
      }), " on the dashboard or ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "Retry create permission"
      }), " on a direct\ncreate page. An explicit denial needs an access-rule/RBAC change or another namespace.\nThese hints are only upfront guidance; the server checks permission again on submit."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["History load failures show ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "Retry history"
      }), ", with separate permission-denied and\nunavailable guidance. They do not mean there are no snapshots. The UI hides stale\nrestore choices after a failed history refresh; retry to obtain fresh choices.\nOnly a successful empty response shows “No previous versions yet.”"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "bulk-entries-have-not-appeared--import-validation-failed",
      children: "Bulk entries have not appeared / import validation failed"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Typing or pasting does not add rows until you choose ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "Import entries"
      }), ". Every\nnonblank line must be ", (0,jsx_runtime.jsx)(_components.code, {
        children: "KEY=value"
      }), "; ", (0,jsx_runtime.jsx)(_components.code, {
        children: "KEY="
      }), " is an intentional empty value. CRLF and\nblank lines are supported, keys are trimmed, and values keep spaces and additional\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "="
      }), " characters. Quotes and shell escapes are literal; use the expanded editor for\nmultiline values."]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Malformed lines, invalid keys, duplicate new/existing keys, unsupported text, and\noversized combined data reject the whole import. Both the current rows and bulk\ndraft remain intact so you can correct the error. Existing keys are never replaced.\nImport or clear pending bulk text before saving. A row with a value but no key is\nan error, not a row that will be silently discarded."
    }), "\n", (0,jsx_runtime.jsxs)(_components.h2, {
      id: "restart-apps-missing--403",
      children: [(0,jsx_runtime.jsx)(_components.em, {
        children: "Restart apps"
      }), " missing / 403"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The button is hidden and the API returns 403 while\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "K8STON_RESTART_ENABLED=false"
      }), ". Enabling the flag also requires workload\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "list"
      }), "/", (0,jsx_runtime.jsx)(_components.code, {
        children: "patch"
      }), " RBAC for Deployments, StatefulSets, and DaemonSets. If the button is\nvisible but requests fail, inspect the persistent per-workload/discovery details:\n207 ", (0,jsx_runtime.jsx)(_components.code, {
        children: "partial"
      }), " means some patches were acknowledged; 503 ", (0,jsx_runtime.jsx)(_components.code, {
        children: "failed"
      }), " means none were\nacknowledged. Failed discovery is not \"no targets\". In impersonation mode, check\nthe complete human identity's RBAC and the ServiceAccount's impersonation grants.\nIn hybrid mode, check ServiceAccount workload RBAC."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["An acknowledged patch is only a rollout request. Check progress/readiness and\ncredential uptake independently, including paused/OnDelete/partitioned workloads.\nBefore retrying, inspect actual state: transport failures can follow applied\npatches, and another request can roll earlier successes again. See\n", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/consumer-restarts/",
        children: "Consumer Restarts"
      }), " and the ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/api/restart-consumers/",
        children: "API result contract"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "etcd-warning-banner-wont-go-away",
      children: "etcd warning banner won't go away"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Set ", (0,jsx_runtime.jsx)(_components.code, {
        children: "K8STON_ETCD_ENCRYPTED=true"
      }), " — but only after verifying the API server\nactually encrypts Secrets at rest (", (0,jsx_runtime.jsx)(_components.code, {
        children: "aescbc"
      }), " provider or equivalent). The flag\nis an attestation, not a detector."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "wrong-cluster--stale-fixtures-sandbox",
      children: "Wrong cluster / stale fixtures (sandbox)"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "kubectl config current-context"
        }), " should be ", (0,jsx_runtime.jsx)(_components.code, {
          children: "kind-k8ston-sandbox"
        }), " —\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "make kind-up"
        }), " re-selects it. Never seed prod."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "make seed"
        }), " reapplies fixtures and can overwrite edits; ", (0,jsx_runtime.jsx)(_components.code, {
          children: "make reset"
        }), " destroys\nall kind cluster data before recreating the sandbox."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "make verify-sandbox"
        }), " runs static checks (compose config + manifest\nvalidation) with no cluster needed."]
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