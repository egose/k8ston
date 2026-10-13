"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["594"], {
8253(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_guides_authorization_mdx_0a4_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-guides-authorization-mdx-0a4.json
var site_docs_guides_authorization_mdx_0a4_namespaceObject = JSON.parse('{"id":"guides/authorization","title":"Authorization","description":"SSO proves who you are; per-secret annotations and one namespace-level","source":"@site/docs/guides/authorization.mdx","sourceDirName":"guides","slug":"/guides/authorization","permalink":"/guides/authorization","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":6,"frontMatter":{"sidebar_label":"Authorization","sidebar_position":6},"sidebar":"guides","previous":{"title":"Authentication","permalink":"/guides/authentication"},"next":{"title":"Versioning & History","permalink":"/guides/versioning-history"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.0_@docusaurus+types@3.10.0_@sw_d80ed93973d8fdb1b9e1067267ab632b/node_modules/@docusaurus/theme-classic/lib/theme/CodeBlock/index.js + 27 modules
var CodeBlock = __webpack_require__(4401);
;// CONCATENATED MODULE: ./node_modules/.pnpm/raw-loader@4.0.2_webpack@5.111.1_@swc+core@1.16.18_@swc+html@1.16.18_clean-css@5.3.3_cs_0a2048681882c260752bdc7655a466eb/node_modules/raw-loader/dist/cjs.js!./.samples/secret-annotated.yaml
/* export default */ const secret_annotated = ("# What a Krypton-managed Secret looks like in etcd.\n# Per-secret annotations override the namespace fallback in krypton-access.\napiVersion: v1\nkind: Secret\nmetadata:\n  name: database-credentials\n  namespace: krypton-test\n  labels:\n    krypton.io/managed-by: krypton\n  annotations:\n    krypton.io/managed-by: krypton\n    krypton.io/version: '3'\n    krypton.io/description: Primary database credentials\n    krypton.io/allowed-groups: dev-team, database-admins\n    krypton.io/allowed-users: alice@company.com\n    krypton.io/last-modified-by: alice@company.com\ntype: Opaque\ndata:\n  DATABASE_URL: cG9zdGdyZXM6Ly9kYjppbmZyYS1vbmx5QGtleXM= # illustrative base64, never plaintext\n  DB_PASSWORD: czNjcjN0LW9ubHktaW4tZXhj bXBsZXM=\n");
;// CONCATENATED MODULE: ./node_modules/.pnpm/raw-loader@4.0.2_webpack@5.111.1_@swc+core@1.16.18_@swc+html@1.16.18_clean-css@5.3.3_cs_0a2048681882c260752bdc7655a466eb/node_modules/raw-loader/dist/cjs.js!./.samples/access-config.json.txt
/* export default */ const access_config_json = ("{\n  \"frontend-ns\": {\n    \"groups\": [\"AzureAD-Frontend-Team\"],\n    \"users\": []\n  },\n  \"production\": {\n    \"groups\": [\"dev-team\", \"database-admins\"],\n    \"users\": [\"alice@company.com\"]\n  }\n}\n");
;// CONCATENATED MODULE: ./docs/guides/authorization.mdx


const frontMatter = {
	sidebar_label: 'Authorization',
	sidebar_position: 6
};
const contentTitle = 'Authorization';

const assets = {

};






const toc = [{
  "value": "Decision order",
  "id": "decision-order",
  "level": 2
}, {
  "value": "Per-secret annotations",
  "id": "per-secret-annotations",
  "level": 2
}, {
  "value": "Namespace fallback (<code>access.json</code>)",
  "id": "namespace-fallback-accessjson",
  "level": 2
}, {
  "value": "Creation is special",
  "id": "creation-is-special",
  "level": 2
}, {
  "value": "Managed-only mode",
  "id": "managed-only-mode",
  "level": 2
}, {
  "value": "History uses current live authorization",
  "id": "history-uses-current-live-authorization",
  "level": 2
}, {
  "value": "Optional K8s-native impersonation",
  "id": "optional-k8s-native-impersonation",
  "level": 2
}, {
  "value": "Worked example (sandbox)",
  "id": "worked-example-sandbox",
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
    ol: "ol",
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
        id: "authorization",
        children: "Authorization"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["SSO proves ", (0,jsx_runtime.jsx)(_components.em, {
        children: "who you are"
      }), "; per-secret annotations and one namespace-level\nConfigMap decide ", (0,jsx_runtime.jsx)(_components.em, {
        children: "what you may see"
      }), " (", (0,jsx_runtime.jsx)(_components.code, {
        children: "lib/authz.ts"
      }), "). The app's ServiceAccount\nexecutes the K8s calls, so SSO users need no cluster identity."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "decision-order",
      children: "Decision order"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "After namespace scope and live-object visibility checks:"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ol, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Admins always pass authorization"
        }), " — ", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_ADMIN_GROUPS"
        }), " / ", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_ADMIN_USERS"
        }), "\n(matched against SSO groups / lowercased email)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Per-secret annotations override everything below."
        }), " If a secret has any\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "allowed-groups"
        }), "/", (0,jsx_runtime.jsx)(_components.code, {
          children: "allowed-users"
        }), ", only those decide."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Namespace fallback"
        }), " in ConfigMap ", (0,jsx_runtime.jsx)(_components.code, {
          children: "<app-namespace>/krypton-access"
        }), ", key\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "access.json"
        }), " (cached 60s in memory)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Confirmed absence of rules → visible to all authenticated users"
        }), " (open by\ndefault, restricted once rules are added). A policy read/validation failure\nreturns ", (0,jsx_runtime.jsx)(_components.code, {
          children: "503"
        }), ", not an open-policy decision."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Until any admin is configured, every authenticated user is treated as admin\n(bootstrap mode — set admins promptly)."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "per-secret-annotations",
      children: "Per-secret annotations"
    }), "\n", "\n", (0,jsx_runtime.jsx)(CodeBlock/* ["default"] */.A, {
      language: "yaml",
      children: secret_annotated
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Managed in the UI on the secret form:"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-yaml",
        children: "metadata:\n  annotations:\n    krypton.io/allowed-groups: 'dev-team, database-admins'\n    krypton.io/allowed-users: 'alice@company.com'\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Annotations use a simple comma-separated list with ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "no quoting or escaping"
      }), " for\nliteral commas. Create/PUT ", (0,jsx_runtime.jsx)(_components.code, {
        children: "allowedGroups"
      }), " and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "allowedUsers"
      }), " arrays accept at most\n", (0,jsx_runtime.jsx)(_components.strong, {
        children: "256 entries each"
      }), ", with at most ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "256 UTF-8 bytes per raw entry"
      }), ", including\nsurrounding whitespace. Each entry is trimmed using the same whitespace rules as\nthe reader. Comma-containing, empty, whitespace-only, or oversized entries return\n", (0,jsx_runtime.jsx)(_components.strong, {
        children: "400 before any Secret/snapshot write"
      }), ", without echoing values or dropping entries.\nOrder, duplicates, internal whitespace, and case are preserved; groups match exactly\nand user emails match case-insensitively. Session/impersonation groups retain their\nseparate transport contract; these bounds apply to stored ACL collections."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "[]"
      }), " explicitly clears just that annotation; omitted PUT fields keep their stored\nvalues. Both ACLs empty means namespace fallback, which can intentionally be open.\nOmitted create fields default to ", (0,jsx_runtime.jsx)(_components.code, {
        children: "[]"
      }), ". The UI's comma-list fields still split on\ncommas, trim, and discard blank segments before submitting: ", (0,jsx_runtime.jsx)(_components.code, {
        children: "team-a, ,team-b"
      }), " becomes\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "[\"team-a\", \"team-b\"]"
      }), ", and a blank field submits ", (0,jsx_runtime.jsx)(_components.code, {
        children: "[]"
      }), ". The UI cannot express a\nliteral-comma principal; API ", (0,jsx_runtime.jsx)(_components.code, {
        children: "[\"team-a,team-b\"]"
      }), " is rejected rather than split."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.strong, {
        children: "ACL input upgrade:"
      }), " previous API versions accepted comma-containing entries that\nexpanded into multiple principals, and whitespace-only entries that could restore\nopen fallback. Update API callers and all writer replicas to this validation contract.\nExisting annotations are not rewritten or migrated; reads still split/trim/drop blank\nsegments, and omitted PUT fields and restores retain existing ACL values. Review and\ncorrect affected live ACLs: CSV cannot recover the original array intent."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.h2, {
      id: "namespace-fallback-accessjson",
      children: ["Namespace fallback (", (0,jsx_runtime.jsx)(_components.code, {
        children: "access.json"
      }), ")"]
    }), "\n", "\n", (0,jsx_runtime.jsx)(CodeBlock/* ["default"] */.A, {
      language: "json",
      children: access_config_json
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Namespaces absent from a valid map are open to all authenticated users until\nrestricted. ", (0,jsx_runtime.jsx)(_components.code, {
        children: "{}"
      }), " and namespace entries with empty rule lists are valid open\npolicies. Entries accept only ", (0,jsx_runtime.jsx)(_components.code, {
        children: "groups"
      }), " and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "users"
      }), " string arrays; omitted lists\ndefault to empty, and unknown fields are rejected to catch misspelled rules.\nEach policy array has the same 256-entry / 256-UTF-8-byte ceilings; a violation is\ninvalid policy, not an open fallback. Namespace lookups use own properties, so a\nvalid namespace named ", (0,jsx_runtime.jsx)(_components.code, {
        children: "constructor"
      }), " follows the same absent/empty/explicit rules."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Unlike annotations, namespace JSON arrays preserve each entry exactly, including\nliteral commas and surrounding whitespace; they are ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "not split or trimmed"
      }), ".\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "{ \"groups\": [\"team-a,team-b\"] }"
      }), " matches only that whole group, not either component.\nThe same applies to ", (0,jsx_runtime.jsx)(_components.code, {
        children: "users"
      }), " (with existing case-insensitive email comparison).\nThis representation remains available for comma-containing principals when namespace\nfallback applies; explicit per-secret ACLs still take precedence."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Only a Kubernetes ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "404"
      }), " reading the ConfigMap means no namespace rules exist.\nAn existing ConfigMap with missing/empty ", (0,jsx_runtime.jsx)(_components.code, {
        children: "access.json"
      }), ", invalid JSON/schema, or\na failed read (including 403 and timeout) yields\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "503 { \"error\": \"Namespace access policy is unavailable\" }"
      }), " for decisions needing\nnamespace policy. Admins and explicit live-secret ACL decisions keep their\nprecedence and do not require a policy read."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Each process caches valid policy or confirmed absence for ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "60 seconds from read\ncompletion"
      }), ". Concurrent misses share a single read. At expiry, requests wait for\na fresh policy; if refresh fails, the old policy is not used. Failures are not\ncached, so the next request retries. Changes may take up to one cache TTL to be\nobserved by each process. Logs contain only a failure category and, for API read\nfailures, a numeric HTTP status; policy contents and raw transport errors are omitted."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.strong, {
        children: "Upgrade:"
      }), " repair malformed ConfigMaps and read permissions before rollout.\nAn intentionally open existing ConfigMap must contain valid ", (0,jsx_runtime.jsx)(_components.code, {
        children: "access.json: '{}'"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "creation-is-special",
      children: "Creation is special"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["A new secret has no annotations yet, so creating in a namespace is decided by\nthe ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "namespace rules alone"
      }), " — the per-secret allowed groups/users you set in\nthe form only take effect ", (0,jsx_runtime.jsx)(_components.em, {
        children: "after"
      }), " the secret exists. The secrets list response\nincludes ", (0,jsx_runtime.jsx)(_components.code, {
        children: "canCreate"
      }), " so the UI disables creation upfront when the rules exclude\nyou (POST still enforces server-side: ", (0,jsx_runtime.jsx)(_components.code, {
        children: "403"
      }), "). Policy failures return ", (0,jsx_runtime.jsx)(_components.code, {
        children: "503"
      }), " for\nnon-admin creation ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "and list requests"
      }), ". Lists need the policy for ", (0,jsx_runtime.jsx)(_components.code, {
        children: "canCreate"
      }), "\neven when empty or containing only explicitly authorized secrets; they return\nan error rather than a partial list or an invented creation hint."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "managed-only-mode",
      children: "Managed-only mode"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Default ", (0,jsx_runtime.jsx)(_components.code, {
        children: "KRYPTON_MANAGED_ONLY=true"
      }), ": secrets ", (0,jsx_runtime.jsx)(_components.em, {
        children: "without"
      }), "\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "krypton.io/managed-by: krypton"
      }), " are hidden entirely — excluded from lists, 404\non direct access (read, edit, delete, history, restore, restart) — so K8s-level\nsecrets created outside Krypton can't be touched by accident. Set\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "KRYPTON_MANAGED_ONLY=false"
      }), " to show unmanaged live secrets (legacy adopt-on-edit:\nsaving an external secret stamps Krypton annotations onto it)."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "history-uses-current-live-authorization",
      children: "History uses current live authorization"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["History objects (", (0,jsx_runtime.jsx)(_components.code, {
        children: "krypton.io/kind=history"
      }), ") are always excluded from lists and\nreturn ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "404 on direct GET/PUT/DELETE/history/restore/restart routes"
      }), ", in both\nmanaged-only modes and for admins too. A managed annotation cannot override the\nhistory label. All named-secret operations share ", (0,jsx_runtime.jsx)(_components.code, {
        children: "lib/secret-access.ts"
      }), ", which\nloads a current live object, checks visibility, then evaluates its authorization."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Read history via ", (0,jsx_runtime.jsx)(_components.code, {
        children: "/secrets/:liveName/versions"
      }), " and restore via\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "/secrets/:liveName/restore"
      }), ". These endpoints check the ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "live object's current\nACL"
      }), " before accessing snapshots. Copied historical ACLs never grant access:\na user denied by the current live rules cannot regain access through an older\nsnapshot that listed them.\nClients previously addressing snapshot names must switch to the live endpoints."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "optional-k8s-native-impersonation",
      children: "Optional K8s-native impersonation"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Set ", (0,jsx_runtime.jsx)(_components.code, {
        children: "KRYPTON_IMPERSONATION=true"
      }), " when the session email and groups match the\nintended Kubernetes RBAC subjects. The app's ServiceAccount must have the\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "impersonate"
      }), " verb for those users and ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "all"
      }), " their groups; their RBAC then\nauthorizes the human operations. Krypton's visibility and application ACL checks\nstill apply, including to users considered Krypton admins."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Namespace requests, live-secret CRUD, history reads/writes/pruning, and all\nDeployment/StatefulSet/DaemonSet ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "lists and patches"
        }), " carry the human identity."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["The session email is sent as ", (0,jsx_runtime.jsx)(_components.code, {
          children: "Impersonate-User"
        }), ". Every session group is a\nseparate repeated ", (0,jsx_runtime.jsx)(_components.code, {
          children: "Impersonate-Group"
        }), " header, including when a group contains a\nliteral comma. There is ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "no application group-count cap"
        }), ", joining, or splitting."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "Values must be nonempty printable ASCII with no leading/trailing whitespace.\nUnsupported user/group values fail with 400 rather than being silently changed.\nAPI-server/proxy header-size limits can reject the whole request; groups are\nnever silently truncated. Impersonated API requests do not follow redirects."
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["The SDK's supported per-request ", (0,jsx_runtime.jsx)(_components.code, {
          children: "httpApi"
        }), " extension sends raw header pairs,\npreserving its ServiceAccount authentication and TLS dispatcher and the\nJSON-Patch content type. Clients and KubeConfig hold no human identity."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["The application's access-policy ConfigMap is deliberately fetched ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "as the\nServiceAccount"
        }), ", with the same process-wide 60s cache and coalesced reads above.\nIts cache never depends on the requesting human's Kubernetes permissions."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Default ", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_IMPERSONATION=false"
        }), " uses hybrid mode. Explicit\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "AUTH_DISABLED=true"
        }), " bypasses human impersonation for local development. A real\nsigned session for ", (0,jsx_runtime.jsx)(_components.code, {
          children: "dev@krypton.local"
        }), " is impersonated just like any other user."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.strong, {
        children: "Upgrade:"
      }), " earlier versions overwrote repeated groups, processed only the first\n32 groups, and omitted impersonation on workload lists. Review ServiceAccount\nimpersonation grants for the full group set and human workload list/patch RBAC.\nMap unsupported identity values to header-safe IdP subjects and matching RBAC\nbindings; failure to represent an identity never falls back to the service identity\nfor secret or workload operations."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "worked-example-sandbox",
      children: "Worked example (sandbox)"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Secret"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Namespace"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Rule source"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "alice (dev-team)"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "bob (other-team)"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "carol (frontend-team)"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "admin"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "database-credentials"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "krypton-test"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["annotation ", (0,jsx_runtime.jsx)(_components.code, {
              children: "allowed-groups: dev-team,…"
            })]
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "✅"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "❌"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "❌"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "✅"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "feature-flags"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "krypton-test"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "none (open by default)"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "✅"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "✅"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "✅"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "✅"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "frontend-api-keys"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "frontend-ns"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["namespace fallback (", (0,jsx_runtime.jsx)(_components.code, {
              children: "frontend-team"
            }), ")"]
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "❌"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "❌"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "✅"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "✅"
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Recreate it headless with ", (0,jsx_runtime.jsx)(_components.code, {
        children: "sandbox/scripts/mint-jwt.mjs"
      }), " — see the\n", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/sandbox/",
        children: "Sandbox guide"
      }), "."]
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

}]);