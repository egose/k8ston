"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["974"], {
1116(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_api_restart_consumers_mdx_f0b_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-api-restart-consumers-mdx-f0b.json
var site_docs_api_restart_consumers_mdx_f0b_namespaceObject = JSON.parse('{"id":"api/restart-consumers","title":"Restart Consumers API","description":"Request rollouts for workloads consuming a Secret","source":"@site/docs/api/restart-consumers.mdx","sourceDirName":"api","slug":"/api/restart-consumers","permalink":"/api/restart-consumers","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":5,"frontMatter":{"sidebar_label":"Restart Consumers","sidebar_position":5},"sidebar":"api","previous":{"title":"Restore","permalink":"/api/restore"},"next":{"title":"Auth","permalink":"/api/auth"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
;// CONCATENATED MODULE: ./docs/api/restart-consumers.mdx


const frontMatter = {
	sidebar_label: 'Restart Consumers',
	sidebar_position: 5
};
const contentTitle = 'Restart Consumers API';

const assets = {

};



const toc = [{
  "value": "Request rollouts for workloads consuming a Secret",
  "id": "request-rollouts-for-workloads-consuming-a-secret",
  "level": 2
}, {
  "value": "Result contract",
  "id": "result-contract",
  "level": 2
}, {
  "value": "Access and audit",
  "id": "access-and-audit",
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
        id: "restart-consumers-api",
        children: "Restart Consumers API"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "request-rollouts-for-workloads-consuming-a-secret",
      children: "Request rollouts for workloads consuming a Secret"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-http",
        children: "POST /api/namespaces/:namespace/secrets/:name/restart-consumers\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["No request body. After current live-Secret authorization, discovers Deployments,\nStatefulSets, and DaemonSets in the same namespace with ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "exact"
      }), " Secret references:"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "env[].valueFrom.secretKeyRef.name"
        }), " and ", (0,jsx_runtime.jsx)(_components.code, {
          children: "envFrom[].secretRef.name"
        }), " on normal,\ninit, and ephemeral containers, where present in the workload template;"]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "volumes[].secret.secretName"
        }), " and\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "volumes[].projected.sources[].secret.name"
        }), ";"]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "imagePullSecrets[].name"
        }), "."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["It patches ", (0,jsx_runtime.jsx)(_components.code, {
        children: "spec.template.metadata.annotations[\"krypton.io/restarted-at\"]"
      }), " with\na timestamp, using an RFC 6902 JSON Patch and at most ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "four in-flight patches\nper request across all kinds"
      }), ". Each patch first tests the inspected workload\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "UID"
      }), " and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "resourceVersion"
      }), ", so a same-name replacement or any intervening\nedit (including reference removal) fails before any mutation instead of\nrestarting the wrong revision. Only acknowledged patches appear in ", (0,jsx_runtime.jsx)(_components.code, {
        children: "requested"
      }), ".\nThe API does ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "not"
      }), " wait for rollout completion, check readiness, or verify\ncredential uptake. ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/consumer-restarts/",
        children: "Scanning limits and operational behavior"
      }), "\nalso apply."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "result-contract",
      children: "Result contract"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "HTTP"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "status"
            })
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Meaning"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "200"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "requested"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "At least one acknowledged patch, no patch failures, all three inventories complete."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "200"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "no_targets"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "All three inventories complete with zero matching workloads; no patch attempted."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "207"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "partial"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "At least one acknowledged patch, plus patch and/or discovery failures."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "503"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "failed"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Zero acknowledged patches, with patch and/or discovery failures."
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["An empty successful inventory for one kind does not compensate for a failed\ninventory for another. In particular, failed discovery with zero known matches is\n", (0,jsx_runtime.jsxs)(_components.strong, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "failed"
        }), ", not ", (0,jsx_runtime.jsx)(_components.code, {
          children: "no_targets"
        })]
      }), ". Discovery settles before mutation. No workloads of\na failed/incomplete kind are patched; known matches from other kinds can proceed.\nEach kind uses complete 100-object pages with at most 100 pages, 2,000 raw objects,\nand 32 MiB of SDK-decoded JSON per inventory. All pages carry full per-user request\noptions. Budget or continuation failures do not permit patches from earlier pages\nof that kind. See ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/api/overview/#request-and-collection-budgets",
        children: "collection budgets"
      }), ".\nAll result and error statuses explicitly send ", (0,jsx_runtime.jsx)(_components.code, {
        children: "Cache-Control: no-store"
      }), "."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Example ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "207 mixed result"
      }), ":"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{\n  \"status\": \"partial\",\n  \"matched\": 2,\n  \"requested\": [{ \"kind\": \"Deployment\", \"name\": \"api-server\" }],\n  \"failures\": [{\n    \"kind\": \"StatefulSet\",\n    \"name\": \"worker\",\n    \"code\": \"forbidden\",\n    \"message\": \"Access denied. Check Kubernetes permissions for the effective identity and, when enabled, ServiceAccount impersonation permissions.\",\n    \"httpStatus\": 403\n  }],\n  \"discoveryFailures\": [],\n  \"message\": \"Rollout requested for 1 of 2 matched workloads. 1 patch request failed.\",\n  \"note\": \"Only acknowledged pod-template patches are reported as requested. Rollout completion, readiness, and credential uptake are not verified.\"\n}\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The TypeScript ", (0,jsx_runtime.jsx)(_components.code, {
        children: "RestartResult"
      }), " contract lives in ", (0,jsx_runtime.jsx)(_components.code, {
        children: "app/lib/consumers.ts"
      }), ":"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "kind"
        }), " is ", (0,jsx_runtime.jsx)(_components.code, {
          children: "Deployment"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "StatefulSet"
        }), ", or ", (0,jsx_runtime.jsx)(_components.code, {
          children: "DaemonSet"
        }), " (case-sensitive)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "matched"
        }), " is the number of ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "known"
        }), " matches from successful inventories:\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "requested.length + failures.length"
        }), ". It excludes unknown inventories."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "requested"
        }), " contains ", (0,jsx_runtime.jsx)(_components.code, {
          children: "{ kind, name }"
        }), " for each acknowledged patch."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "failures"
        }), " contains ", (0,jsx_runtime.jsx)(_components.code, {
          children: "{ kind, name, code, message, httpStatus? }"
        }), " for each\nunacknowledged patch. A transport failure does not prove that no mutation occurred.\nA match whose listed identity is missing or malformed appears here with\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "incomplete_list"
        }), " and is never patched by name alone. Conflict (", (0,jsx_runtime.jsx)(_components.code, {
          children: "409"
        }), ") and\nrejected-patch (", (0,jsx_runtime.jsx)(_components.code, {
          children: "422"
        }), ") failures mean the workload changed or was replaced\nafter discovery; the patch was attempted once and never blind-retried."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "discoveryFailures"
        }), " contains ", (0,jsx_runtime.jsx)(_components.code, {
          children: "{ kind, code, message, httpStatus? }"
        }), "; no workload\nname is invented for a failed list. A malformed/inconsistent/over-budget list\n(including bad or repeated continuation tokens) uses ", (0,jsx_runtime.jsx)(_components.code, {
          children: "incomplete_list"
        }), " and is\nnot silently truncated. Valid continuation tokens are followed to completion."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "code"
        }), " is ", (0,jsx_runtime.jsx)(_components.code, {
          children: "unauthenticated"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "forbidden"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "not_found"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "conflict"
        }), ",\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "invalid_request"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "rate_limited"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "unavailable"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "unconfirmed"
        }), ", or\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "incomplete_list"
        }), ". ", (0,jsx_runtime.jsx)(_components.code, {
          children: "httpStatus"
        }), " is a numeric upstream status when available,\nor 503 for a locally detected incomplete inventory. Messages are fixed,\nsanitized guidance, never raw error payloads."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "message"
        }), " is a human-readable summary; ", (0,jsx_runtime.jsx)(_components.code, {
          children: "note"
        }), " explains the acknowledgement limit.\nAutomation should use ", (0,jsx_runtime.jsx)(_components.code, {
          children: "status"
        }), " and the arrays, not parse either string."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["A ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "503 attempt"
        }), " retains all these fields and also has ", (0,jsx_runtime.jsx)(_components.code, {
          children: "error"
        }), " equal to\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "message"
        }), ". Preflight errors have the ordinary ", (0,jsx_runtime.jsx)(_components.code, {
          children: "{ error }"
        }), " envelope instead."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Review actual workload state and repair errors before retrying. After a conflict\nor rejected patch, reload the workload (check for replacement, edits, or removed\nreferences) and retry only if a rollout is still wanted. A retry scans all\nkinds again and may request another rollout for workloads already acknowledged.\nThere is no transaction, background retry, or readiness watcher. Native\nworkload UIDs and resourceVersions stay internal to the patch; results and\naudits carry only ", (0,jsx_runtime.jsx)(_components.code, {
        children: "kind"
      }), "/", (0,jsx_runtime.jsx)(_components.code, {
        children: "name"
      }), " plus classified failures."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "access-and-audit",
      children: "Access and audit"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Returns ", (0,jsx_runtime.jsx)(_components.code, {
          children: "403 { \"error\": \"Restarting apps is disabled on this deployment\" }"
        }), "\nunless ", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_RESTART_ENABLED=true"
        }), " (which also needs the ", (0,jsx_runtime.jsx)(_components.code, {
          children: "apps"
        }), " RBAC rule)."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "Same authentication, namespace, live visibility, and current ACL gates as\nupdating the Secret. Direct history names are hidden. Gate/preparation failures\noccur before workload mutation and return the ordinary error envelope.\nUnexpected preparation errors use the shared sanitized 500 response."
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["In impersonation mode, ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "every list and patch"
        }), " carries the full user/group\nidentity. A workload 403 can be human RBAC or impersonation permission denial;\nin hybrid mode it can be ServiceAccount RBAC. List/patch failures are classified\nin the result, not treated as application-session expiry."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "secret.restart"
        }), " audits include ", (0,jsx_runtime.jsx)(_components.code, {
          children: "status"
        }), ", known ", (0,jsx_runtime.jsx)(_components.code, {
          children: "matched"
        }), " count, acknowledged\nworkload identities, and sanitized patch/discovery failures. ", (0,jsx_runtime.jsx)(_components.code, {
          children: "partial"
        }), " and\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "failed"
        }), " use audit ", (0,jsx_runtime.jsx)(_components.code, {
          children: "result: error"
        }), "; ", (0,jsx_runtime.jsx)(_components.code, {
          children: "requested"
        }), " and explicit ", (0,jsx_runtime.jsx)(_components.code, {
          children: "no_targets"
        }), " use\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "allow"
        }), ". Secret values, template contents, and raw upstream errors are excluded."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.strong, {
        children: "Upgrade:"
      }), " replace consumption of the old ", (0,jsx_runtime.jsx)(_components.code, {
        children: "deployments"
      }), "/", (0,jsx_runtime.jsx)(_components.code, {
        children: "statefulSets"
      }), "/\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "daemonSets"
      }), " arrays with this result. Preserve 207/503 bodies and check ", (0,jsx_runtime.jsx)(_components.code, {
        children: "status"
      }), ";\na resolved HTTP request is not a completed rollout. The bundled client retains\ntyped failed-attempt reports for the detail UI, while preflight errors still raise\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "ApiError"
      }), ". See ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/consumer-restarts/",
        children: "Consumer Restarts"
      }), " for the walkthrough."]
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