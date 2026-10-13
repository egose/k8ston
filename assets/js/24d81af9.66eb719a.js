"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["133"], {
4467(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_about_overview_mdx_24d_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-about-overview-mdx-24d.json
var site_docs_about_overview_mdx_24d_namespaceObject = JSON.parse('{"id":"about/overview","title":"Overview","description":"Krypton is a lightweight secret manager UI and API backed directly by Kubernetes Secret objects.","source":"@site/docs/about/overview.mdx","sourceDirName":"about","slug":"/about/overview","permalink":"/about/overview","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":0,"frontMatter":{"sidebar_label":"Overview","sidebar_position":0},"sidebar":"about","next":{"title":"Quick Start","permalink":"/about/quick-start"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
;// CONCATENATED MODULE: ./docs/about/overview.mdx


const frontMatter = {
	sidebar_label: 'Overview',
	sidebar_position: 0
};
const contentTitle = 'Overview';

const assets = {

};



const toc = [{
  "value": "How it works",
  "id": "how-it-works",
  "level": 2
}, {
  "value": "What Krypton is not",
  "id": "what-krypton-is-not",
  "level": 2
}, {
  "value": "At a glance",
  "id": "at-a-glance",
  "level": 2
}, {
  "value": "Where to go next",
  "id": "where-to-go-next",
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
        id: "overview",
        children: "Overview"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Krypton is a lightweight secret manager UI and API backed ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "directly by Kubernetes Secret objects"
      }), ".\nNo database, no persistent volumes, no secret sprawl: Kubernetes is the source of\ntruth, and Krypton is the translation + visualization layer on top."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["It is built with Next.js (App Router), ", (0,jsx_runtime.jsx)(_components.code, {
        children: "@kubernetes/client-node"
      }), ", generic OIDC SSO, and\nshadcn-theme components."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "how-it-works",
      children: "How it works"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-text",
        children: "Browser ──SSO login──▶ Krypton (Next.js)\n                            │  ServiceAccount token (auto-mounted in-cluster)\n                            │  https://kubernetes.default.svc  — no credentials to manage\n                            ▼\n                    Kubernetes API ──▶ etcd (Secrets + one access ConfigMap)\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "State"
        }), ": every secret is a native ", (0,jsx_runtime.jsx)(_components.code, {
          children: "Secret"
        }), " object. Standard tools (Velero,\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "kubectl"
        }), ", GitOps) keep working; RBAC, audit logs, and network policies come free."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Auth"
        }), ": users sign in via OIDC SSO (Keycloak, Entra ID, Okta, Google, GitHub…).\nUsers do ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "not"
        }), " need cluster credentials."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Authz (hybrid)"
        }), ": SSO proves ", (0,jsx_runtime.jsx)(_components.em, {
          children: "who you are"
        }), "; per-secret annotations and one\nnamespace-level ConfigMap decide ", (0,jsx_runtime.jsx)(_components.em, {
          children: "what you may see"
        }), ". The app's ServiceAccount\nexecutes the K8s calls."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "History"
        }), ": K8s overwrites secrets in place, so Krypton snapshots the previous\nstate into an immutable, UID/resourceVersion-bound Secret before updates and\nrestores. Rollbacks preserve raw bytes and current access rules within the\n", (0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/versioning-history/",
          children: "retained history"
        }), "."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "what-krypton-is-not",
      children: "What Krypton is not"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Not an encryption layer."
        }), " Out of the box, Kubernetes Secrets are ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "base64-encoded,\nnot encrypted"
        }), ", in etcd. Krypton shows a warning banner until you confirm etcd\nencryption-at-rest is enabled (", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_ETCD_ENCRYPTED=true"
        }), "). Read the\n", (0,jsx_runtime.jsx)(_components.a, {
          href: "/about/security-model/",
          children: "Security Model"
        }), " before production."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Not a replacement for RBAC."
        }), " Krypton adds an SSO-friendly authorization layer\nfor users without cluster identities. The ServiceAccount it runs as should still\nfollow least privilege (namespace ", (0,jsx_runtime.jsx)(_components.code, {
          children: "Role"
        }), " by default, ", (0,jsx_runtime.jsx)(_components.code, {
          children: "ClusterRole"
        }), " only for\nmulti-namespace dashboards)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Not a secret generator or rotation engine."
        }), " It stores, versions, and gates\naccess to values your teams already manage."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "at-a-glance",
      children: "At a glance"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Concern"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Approach"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Storage"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Native ", (0,jsx_runtime.jsx)(_components.code, {
              children: "Secret"
            }), " objects; snapshots labeled ", (0,jsx_runtime.jsx)(_components.code, {
              children: "krypton.io/kind=history"
            })]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Login"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Generic OIDC (discovery-based), stateless HS256 session JWT"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Authorization"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Admins bypass; per-secret annotations override namespace fallback"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Concurrency"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Optimistic writes on ", (0,jsx_runtime.jsx)(_components.code, {
              children: "metadata.resourceVersion"
            }), " (409 + reload on drift)"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Size guard"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "1 MiB per-object limit enforced client- and server-side (413)"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Consumer rollout"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Opt-in bounded rollout requests for explicit Secret consumers; reports partial failures"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Deployment"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Raw manifests (", (0,jsx_runtime.jsx)(_components.code, {
              children: "app/k8s/"
            }), ") or Helm (", (0,jsx_runtime.jsx)(_components.code, {
              children: "helm/main"
            }), " + ", (0,jsx_runtime.jsx)(_components.code, {
              children: "helm/krypton"
            }), " subchart)"]
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "where-to-go-next",
      children: "Where to go next"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/about/quick-start/",
          children: "Quick Start"
        }), " — run the app locally in minutes."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/about/architecture/",
          children: "Architecture"
        }), " — request flow, scopes, and project layout."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/about/security-model/",
          children: "Security Model"
        }), " — assumptions, guarantees, and hardening."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/sandbox/",
          children: "Sandbox"
        }), " — batteries-included kind + Dex environment."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/api/overview/",
          children: "API Overview"
        }), " — drive Krypton from scripts and automation."]
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