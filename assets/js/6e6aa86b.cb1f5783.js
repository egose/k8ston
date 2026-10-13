"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["973"], {
4525(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_api_overview_mdx_6e6_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-api-overview-mdx-6e6.json
var site_docs_api_overview_mdx_6e6_namespaceObject = JSON.parse('{"id":"api/overview","title":"API Overview","description":"The API is plain REST over JSON, authenticated with the krypton_session","source":"@site/docs/api/overview.mdx","sourceDirName":"api","slug":"/api/overview","permalink":"/api/overview","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":0,"frontMatter":{"sidebar_label":"Overview","sidebar_position":0},"sidebar":"api","next":{"title":"Namespaces","permalink":"/api/namespaces"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.0_@docusaurus+types@3.10.0_@sw_d80ed93973d8fdb1b9e1067267ab632b/node_modules/@docusaurus/theme-classic/lib/theme/CodeBlock/index.js + 27 modules
var CodeBlock = __webpack_require__(4401);
;// CONCATENATED MODULE: ./node_modules/.pnpm/raw-loader@4.0.2_webpack@5.111.1_@swc+core@1.16.18_@swc+html@1.16.18_clean-css@5.3.3_cs_0a2048681882c260752bdc7655a466eb/node_modules/raw-loader/dist/cjs.js!./.samples/rest-lifecycle.sh
/* export default */ const rest_lifecycle = ("# Krypton REST lifecycle against the sandbox (make up + app/.env from app.env.sandbox).\n# Mint session JWTs directly — must match the app's SESSION_SECRET.\nALICE=$(node sandbox/scripts/mint-jwt.mjs --email alice@company.com --groups dev-team)\nBOB=$(node sandbox/scripts/mint-jwt.mjs --email bob@company.com --groups other-team)\n\nBASE=localhost:3000\nNS=krypton-test\n\n# 1. List namespaces and secrets (alice sees dev-team + open secrets)\ncurl --cookie \"krypton_session=$ALICE\" $BASE/api/namespaces\ncurl --cookie \"krypton_session=$ALICE\" $BASE/api/namespaces/$NS/secrets\n\n# 2. Negative case: bob is not in dev-team\ncurl --cookie \"krypton_session=$BOB\" \\\n  $BASE/api/namespaces/$NS/secrets/database-credentials # 403\n\n# 3. Create a secret (201; stamps krypton.io/managed-by + version=1)\ncurl --cookie \"krypton_session=$ALICE\" -X POST \\\n  -H 'Content-Type: application/json' \\\n  $BASE/api/namespaces/$NS/secrets \\\n  -d '{\"name\":\"demo-secret\",\"data\":{\"API_KEY\":\"s3cr3t\"},\"description\":\"Demo\"}'\n\n# 4. Read it back (detail includes decoded data + resourceVersion)\ncurl --cookie \"krypton_session=$ALICE\" \\\n  $BASE/api/namespaces/$NS/secrets/demo-secret\n\n# 5. Update with optimistic concurrency (409 on resourceVersion mismatch)\nRV=$(curl -s --cookie \"krypton_session=$ALICE\" \\\n  $BASE/api/namespaces/$NS/secrets/demo-secret | jq -r .secret.resourceVersion)\ncurl --cookie \"krypton_session=$ALICE\" -X PUT \\\n  -H 'Content-Type: application/json' \\\n  -d \"{\\\"data\\\":{\\\"API_KEY\\\":\\\"r0tated\\\"},\\\"resourceVersion\\\":\\\"$RV\\\"}\" \\\n  $BASE/api/namespaces/$NS/secrets/demo-secret\n\n# 6. History + reversible restore (snapshots current state first)\ncurl --cookie \"krypton_session=$ALICE\" \\\n  $BASE/api/namespaces/$NS/secrets/demo-secret/versions\nRV=$(curl -fsS --cookie \"krypton_session=$ALICE\" \\\n  $BASE/api/namespaces/$NS/secrets/demo-secret | jq -er .secret.resourceVersion)\ncurl --cookie \"krypton_session=$ALICE\" -X POST \\\n  -H 'Content-Type: application/json' \\\n  -d \"$(jq -cn --arg rv \"$RV\" '{version:1,resourceVersion:$rv}')\" \\\n  $BASE/api/namespaces/$NS/secrets/demo-secret/restore\n\n# 7. Restart env-var consumers (needs KRYPTON_RESTART_ENABLED=true)\ncurl --cookie \"krypton_session=$ALICE\" -X POST \\\n  $BASE/api/namespaces/$NS/secrets/demo-secret/restart-consumers\n\n# 8. Delete with the reviewed live revision (add keepHistory=true to retain copies).\n# 409 requires reload/review, not automatic retry. 202 means still present, e.g.\n# pending finalizers. Cleanup is ordered, not an atomic erase across K8s objects.\nRV=$(curl -fsS --cookie \"krypton_session=$ALICE\" \\\n  $BASE/api/namespaces/$NS/secrets/demo-secret | jq -er .secret.resourceVersion)\ncurl --cookie \"krypton_session=$ALICE\" -G -X DELETE \\\n  --data-urlencode \"resourceVersion=$RV\" \\\n  $BASE/api/namespaces/$NS/secrets/demo-secret\n");
;// CONCATENATED MODULE: ./docs/api/overview.mdx


const frontMatter = {
	sidebar_label: 'Overview',
	sidebar_position: 0
};
const contentTitle = 'API Overview';

const assets = {

};





const toc = [{
  "value": "Conventions",
  "id": "conventions",
  "level": 2
}, {
  "value": "Request and collection budgets",
  "id": "request-and-collection-budgets",
  "level": 2
}, {
  "value": "Endpoint map",
  "id": "endpoint-map",
  "level": 2
}, {
  "value": "Scripted lifecycle",
  "id": "scripted-lifecycle",
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
        id: "api-overview",
        children: "API Overview"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The API is plain REST over JSON, authenticated with the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "krypton_session"
      }), "\ncookie (an HS256 session JWT minted at OIDC login). Values cross the API\nboundary as ", (0,jsx_runtime.jsxs)(_components.strong, {
        children: ["plaintext ", (0,jsx_runtime.jsx)(_components.code, {
          children: "data"
        }), " for text values"]
      }), " and ", (0,jsx_runtime.jsxs)(_components.strong, {
        children: ["base64 ", (0,jsx_runtime.jsx)(_components.code, {
          children: "binaryData"
        }), " for\nnon-text values"]
      }), " in authorized detail/history responses. Summary ", (0,jsx_runtime.jsx)(_components.code, {
        children: "binaryKeys"
      }), "\ncontains names only. Create/update ", (0,jsx_runtime.jsx)(_components.code, {
        children: "data"
      }), " remains plaintext; metadata-only PUTs\nomit it. See the ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/api/secrets/",
        children: "data contract"
      }), " before round-tripping responses."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "conventions",
      children: "Conventions"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Auth"
        }), ": Secret/namespace endpoints require a session; configuration and\nlogin/callback/logout are public entry points. Protected\nunauthenticated calls get ", (0,jsx_runtime.jsx)(_components.code, {
          children: "401 { \"error\": \"Authentication required\" }"
        }), ".\n(The one exception is ", (0,jsx_runtime.jsx)(_components.code, {
          children: "GET /api/auth/me"
        }), ", which answers ", (0,jsx_runtime.jsx)(_components.code, {
          children: "401 { \"user\": null }"
        }), ".)"]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Errors"
        }), ": ", (0,jsx_runtime.jsx)(_components.code, {
          children: "{ \"error\": \"<message>\" }"
        }), " with the HTTP status. Zod validation\nfailures answer ", (0,jsx_runtime.jsx)(_components.code, {
          children: "400 { \"error\": \"Validation failed\", \"issues\": [...] }"
        }), ", with\nat most 20 issues containing known top-level paths and fixed code/message\nclassifications. Submitted values, arbitrary nested keys, enum values, upstream\nmessages, and raw headers are omitted. Unexpected failures use fixed guidance."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Caching"
        }), ": API JSON successes/errors and auth redirects explicitly send\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "Cache-Control: no-store"
        }), ", including authenticated metadata lists and failures."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Gates"
        }), ": secrets routes enforce namespace scope. Named-secret routes then\nenforce live-object visibility (404 for snapshots in both modes, and for\nunmanaged secrets in managed-only mode) → hybrid authorization (403). See\n", (0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/authorization/",
          children: "Authorization"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Policy unavailable"
        }), ": decisions that need namespace fallback return\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "503 { \"error\": \"Namespace access policy is unavailable\" }"
        }), " on malformed policy\nor failed ConfigMap reads. This includes non-admin creation and list hints.\nAdmins and explicit live ACLs keep precedence; only a confirmed ConfigMap 404\nor valid empty rules mean intentionally open policy."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "History"
        }), ": snapshots are immutable and UID/source-resourceVersion bound.\nUnbound legacy/predecessor history is quarantined. Snapshot identity/content\nconflicts return 409; snapshot creation/list/pruning failures use controlled\n503 errors. Cleanup may be partial; see ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/versioning-history/",
          children: "history semantics"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Restore/delete revisions"
        }), ": both require the caller's expected live\nresourceVersion (restore JSON, DELETE query). Missing input is 400; stale input\nis 409 before history side effects. DELETE returns a typed status: 200 ", (0,jsx_runtime.jsx)(_components.code, {
          children: "deleted"
        }), "\nfor confirmed live absence, 202 ", (0,jsx_runtime.jsx)(_components.code, {
          children: "pending"
        }), " while it still exists. Ordered cleanup\nis retryable but nontransactional; it does not promise atomic erasure of all copies."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Consumer rollouts"
        }), ": acknowledged pod-template patches are rollout requests,\nnot verified readiness or credential uptake. The ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/api/restart-consumers/",
          children: "restart result"
        }), "\ndistinguishes 200 ", (0,jsx_runtime.jsx)(_components.code, {
          children: "requested"
        }), "/", (0,jsx_runtime.jsx)(_components.code, {
          children: "no_targets"
        }), ", 207 ", (0,jsx_runtime.jsx)(_components.code, {
          children: "partial"
        }), ", and 503 ", (0,jsx_runtime.jsx)(_components.code, {
          children: "failed"
        }), ", with\nstructured patch and discovery failures. Retain those result bodies; failed\ninventories must not be treated as empty. Gate/preparation errors keep ", (0,jsx_runtime.jsx)(_components.code, {
          children: "{ error }"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Other Kubernetes failures"
        }), " retain numeric statuses with\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "Kubernetes API (<status>): <fixed guidance>"
        }), ". A 403 can mean effective human\nRBAC or ServiceAccount impersonation permission denial in impersonation mode,\nor ServiceAccount RBAC in hybrid mode. Kubernetes 401s are distinct from expired\napp sessions. Raw Kubernetes Status messages/bodies/headers are never forwarded."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "request-and-collection-budgets",
      children: "Request and collection budgets"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Create, update, and restore accept an inclusive ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "16 MiB UTF-8 JSON envelope"
      }), "\n(16,777,216 bytes). Oversized ", (0,jsx_runtime.jsx)(_components.code, {
        children: "Content-Length"
      }), " is rejected before reading; chunked\nand understated-length bodies are counted as they arrive and cancelled on overflow\n(413). Malformed JSON/UTF-8 and invalid length headers are 400 before mutation.\nThe envelope accommodates JSON escaping and overlapping create ", (0,jsx_runtime.jsx)(_components.code, {
        children: "data"
      }), "/", (0,jsx_runtime.jsx)(_components.code, {
        children: "stringData"
      }), ";\nthe separate conservative 1 MiB data validation still applies. Individual text maps\nuse ", (0,jsx_runtime.jsx)(_components.code, {
        children: "ceil(1.4 × UTF-8 key/value bytes) <= 1 MiB"
      }), " (schema failures are 400); oversized\nmerged create data or native restore bytes return 413. Upstream ingress limits may\nreject requests earlier."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Submitted ACL arrays allow ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "256 nonempty strings each, at most 256 UTF-8 bytes\nper entry"
      }), ". Policy rule arrays use the same count/byte ceilings; invalid policy\nremains unavailable, never absent. These limits do not truncate session groups."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Kubernetes collections use ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "100-object pages, at most 100 pages per inventory"
      }), ":"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Inventory"
          }), (0,jsx_runtime.jsx)(_components.th, {
            style: {
              textAlign: "right"
            },
            children: "Raw object limit"
          }), (0,jsx_runtime.jsx)(_components.th, {
            style: {
              textAlign: "right"
            },
            children: "Aggregate JSON bytes"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Live Secrets / namespace"
          }), (0,jsx_runtime.jsx)(_components.td, {
            style: {
              textAlign: "right"
            },
            children: "5,000"
          }), (0,jsx_runtime.jsx)(_components.td, {
            style: {
              textAlign: "right"
            },
            children: "32 MiB"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Raw history / live UID"
          }), (0,jsx_runtime.jsx)(_components.td, {
            style: {
              textAlign: "right"
            },
            children: "1,000"
          }), (0,jsx_runtime.jsx)(_components.td, {
            style: {
              textAlign: "right"
            },
            children: "160 MiB"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "History cleanup or pruning / live UID"
          }), (0,jsx_runtime.jsx)(_components.td, {
            style: {
              textAlign: "right"
            },
            children: "1,000"
          }), (0,jsx_runtime.jsx)(_components.td, {
            style: {
              textAlign: "right"
            },
            children: "8 MiB projected metadata"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Workloads / kind"
          }), (0,jsx_runtime.jsx)(_components.td, {
            style: {
              textAlign: "right"
            },
            children: "2,000"
          }), (0,jsx_runtime.jsx)(_components.td, {
            style: {
              textAlign: "right"
            },
            children: "32 MiB"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Unrestricted namespaces"
          }), (0,jsx_runtime.jsx)(_components.td, {
            style: {
              textAlign: "right"
            },
            children: "5,000"
          }), (0,jsx_runtime.jsx)(_components.td, {
            style: {
              textAlign: "right"
            },
            children: "8 MiB"
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Byte accounting measures SDK-decoded JSON pages before filtering/deduplication;\nmetadata-only cleanup measures projections and page metadata without visiting\nSecret values. Raw object/page counts apply in every mode. The SDK buffers each\nupstream page first; these are application accumulation/work bounds, not streaming\nresponse-size or global concurrency limits. Each multi-inventory operation applies\nthe bounds independently; restart reads three kinds concurrently."
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Opaque continuation tokens must be printable ASCII and at most 8 KiB. Bad/repeated\ntokens, inconsistent list revisions/conflicting duplicates, missing items, or budget\nexhaustion produce a controlled 503 incomplete-inventory error, never partial success.\nExact projected duplicates appear once. Failed/expired pages never trigger an\nautomatic continuation restart. History wraps upstream list failures as 503;\nrestart preserves per-kind failures; other lists preserve safe numeric statuses\n(including 410). Retry a fresh request after repair, or use operator-reviewed\ncleanup for an over-budget backlog. See ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/api/namespaces/",
        children: "Namespaces"
      }), " for the\nallowlist's zero-discovery-call contract and ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/api/secrets/",
        children: "Secrets"
      }), " for selectors."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "endpoint-map",
      children: "Endpoint map"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Method"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Path"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Page"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "GET"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/namespaces"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/namespaces/",
              children: "Namespaces"
            })
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "GET"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/namespaces/:ns/secrets"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/secrets/",
              children: "Secrets"
            })
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "POST"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/namespaces/:ns/secrets"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/secrets/",
              children: "Secrets"
            })
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "GET"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/namespaces/:ns/secrets/:name"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/secrets/",
              children: "Secrets"
            })
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "PUT"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/namespaces/:ns/secrets/:name"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/secrets/",
              children: "Secrets"
            })
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "DELETE"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/namespaces/:ns/secrets/:name"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/secrets/",
              children: "Secrets"
            })
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "GET"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/namespaces/:ns/secrets/:name/versions"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/versions/",
              children: "Versions"
            })
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "POST"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/namespaces/:ns/secrets/:name/restore"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/restore/",
              children: "Restore"
            })
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "POST"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/namespaces/:ns/secrets/:name/restart-consumers"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/restart-consumers/",
              children: "Restart"
            })
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "GET"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "/api/auth/login"
            }), ", ", (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/auth/callback"
            }), ", ", (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/auth/logout"
            }), ", ", (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/auth/me"
            })]
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/auth/",
              children: "Auth"
            })
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "GET"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/config"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/config/",
              children: "Config"
            })
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "scripted-lifecycle",
      children: "Scripted lifecycle"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "The full flow — list, negative authz case, create, read, concurrent-safe\nupdate, versions, restore, restart, delete — against the sandbox:"
    }), "\n", "\n", (0,jsx_runtime.jsx)(CodeBlock/* ["default"] */.A, {
      language: "bash",
      children: rest_lifecycle
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Session cookies for scripts come from ", (0,jsx_runtime.jsx)(_components.code, {
        children: "sandbox/scripts/mint-jwt.mjs"
      }), " (must\nmatch the app's ", (0,jsx_runtime.jsx)(_components.code, {
        children: "SESSION_SECRET"
      }), "):"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "ALICE=$(node sandbox/scripts/mint-jwt.mjs --email alice@company.com --groups dev-team)\ncurl --cookie \"krypton_session=$ALICE\" localhost:3000/api/namespaces\n"
      })
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