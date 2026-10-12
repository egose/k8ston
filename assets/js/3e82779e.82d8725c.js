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
  "value": "Kubernetes client (<code>lib/k8s.ts</code>)",
  "id": "kubernetes-client-libk8sts",
  "level": 2
}, {
  "value": "Scopes (<code>lib/namespaces.ts</code>)",
  "id": "scopes-libnamespacests",
  "level": 2
}, {
  "value": "Versioning model (<code>lib/secrets.ts</code>)",
  "id": "versioning-model-libsecretsts",
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
    em: "em",
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
      children: "Krypton is a stateless Next.js App Router service. All persistent state lives in\nthe Kubernetes API; the app holds no database connection, no disk cache beyond a\n60-second in-memory ConfigMap read-through, and no secret values in logs."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "request-flow",
      children: "Request flow"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-text",
        children: "Browser ──cookie (HS256 session JWT)──▶ Next.js route handler\n                                              │ 1. requireUser() → SessionUser\n                                              │ 2. assertNamespaceAllowed()\n                                              │ 3. read live Secret via CoreV1Api\n                                              │ 4. assertManagedVisible() (404 if unmanaged + managed-only)\n                                              │ 5. canAccessSecret() (annotations → ConfigMap → open)\n                                              ▼\n                                        Kubernetes API (ServiceAccount token in-cluster,\n                                                       ~/.kube/config locally)\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Every secrets route follows the same five-step shape: authenticate the session,\ncheck the namespace scope, read the live object, apply the managed-only gate,\nthen evaluate hybrid authorization. Denials and errors are audit-logged with key\n", (0,jsx_runtime.jsx)(_components.strong, {
        children: "names"
      }), " only — values never reach the logs."]
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
        }), ": when ", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_IMPERSONATION=true"
        }), " and the API server\ntrusts the same OIDC issuer, ", (0,jsx_runtime.jsx)(_components.code, {
          children: "Impersonate-User"
        }), "/", (0,jsx_runtime.jsx)(_components.code, {
          children: "Impersonate-Group"
        }), " headers\nforward the human identity so ", (0,jsx_runtime.jsx)(_components.em, {
          children: "their"
        }), " RBAC is evaluated instead of the\nServiceAccount's. Default is ", (0,jsx_runtime.jsx)(_components.code, {
          children: "false"
        }), " (hybrid mode)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Error normalization"
        }), ": ", (0,jsx_runtime.jsx)(_components.code, {
          children: "toK8sError()"
        }), " unwraps client-node ", (0,jsx_runtime.jsx)(_components.code, {
          children: "ApiException"
        }), "\nbodies into clean ", (0,jsx_runtime.jsx)(_components.code, {
          children: "Kubernetes API (status): message"
        }), " responses, with a 403\nhint pointing at missing app RBAC permissions."]
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
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "cluster"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "All namespaces, optionally allowlisted"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "ClusterRole"
            })
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "KRYPTON_NAMESPACES=\"team-a,team-b\""
      }), " narrows cluster scope. If the ServiceAccount\ncannot list namespaces, ", (0,jsx_runtime.jsx)(_components.code, {
        children: "/api/namespaces"
      }), " degrades gracefully to the allowlist\n(or the pod's own namespace) instead of failing."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.h2, {
      id: "versioning-model-libsecretsts",
      children: ["Versioning model (", (0,jsx_runtime.jsx)(_components.code, {
        children: "lib/secrets.ts"
      }), ")"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Every live secret carries ", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton.io/version"
        }), " (app counter, starts at 1) plus\nthe native ", (0,jsx_runtime.jsx)(_components.code, {
          children: "metadata.resourceVersion"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Writes send the loaded ", (0,jsx_runtime.jsx)(_components.code, {
          children: "resourceVersion"
        }), " back; a mismatch is a ", (0,jsx_runtime.jsx)(_components.code, {
          children: "409"
        }), " with a\nreload prompt (optimistic concurrency, K8s-native)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Before every overwrite, the current state is persisted as an immutable snapshot\nSecret named ", (0,jsx_runtime.jsx)(_components.code, {
          children: "<name>-vN"
        }), ", labeled ", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton.io/history-of=<name>"
        }), " /\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton.io/kind=history"
        }), ", annotated with version, timestamp, and actor."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Snapshots are pruned to ", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_HISTORY_LIMIT"
        }), " (default 20, newest kept)."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "Restore snapshots the current state first, so rollbacks are reversible."
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "consumer-restarts",
      children: "Consumer restarts"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Pods with ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "volume-mounted"
      }), " secrets sync automatically (kubelet delay); pods\nusing ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "environment variables"
      }), " need a rollout. ", (0,jsx_runtime.jsx)(_components.em, {
        children: "Restart apps"
      }), " scans\nDeployments, StatefulSets, and DaemonSets for references to the secret\n(", (0,jsx_runtime.jsx)(_components.code, {
        children: "env"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "envFrom"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "volumes"
      }), ", projected sources with a string-scan fallback)\nand patches the pod template with a ", (0,jsx_runtime.jsx)(_components.code, {
        children: "krypton.io/restarted-at"
      }), " annotation to\ntrigger a rolling restart. The feature is disabled by default\n(", (0,jsx_runtime.jsx)(_components.code, {
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
        children: "app/                    # Next.js App Router\n  app/api/namespaces/…  # secrets CRUD, versions, restore, restart-consumers\n  app/api/auth/…        # OIDC login/callback/logout/me\n  app/secrets/[ns]/…    # detail / edit / history views\n  lib/                  # k8s client, OIDC+session, authz, snapshots, validation\n  components/           # dashboard, tables, forms, masked values, history\n  k8s/                  # namespace, SA, Role/ClusterRole, configs, deployment\nhelm/                   # helm/main chart + helm/krypton subchart\nsandbox/                # kind cluster + Dex + fixtures + helper scripts\nwebsite/                # this documentation site (Docusaurus)\n"
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