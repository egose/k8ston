"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["63"], {
9555(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_about_quick_start_mdx_f1d_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-about-quick-start-mdx-f1d.json
var site_docs_about_quick_start_mdx_f1d_namespaceObject = JSON.parse('{"id":"about/quick-start","title":"Quick Start","description":"Two paths, same app. Pick the one that matches how much realism you need.","source":"@site/docs/about/quick-start.mdx","sourceDirName":"about","slug":"/about/quick-start","permalink":"/about/quick-start","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":1,"frontMatter":{"sidebar_label":"Quick Start","sidebar_position":1},"sidebar":"about","previous":{"title":"Overview","permalink":"/about/overview"},"next":{"title":"Architecture","permalink":"/about/architecture"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
;// CONCATENATED MODULE: ./docs/about/quick-start.mdx


const frontMatter = {
	sidebar_label: 'Quick Start',
	sidebar_position: 1
};
const contentTitle = 'Quick Start';

const assets = {

};



const toc = [{
  "value": "Path A: local dev with a mock admin (fastest)",
  "id": "path-a-local-dev-with-a-mock-admin-fastest",
  "level": 2
}, {
  "value": "Path B: full sandbox with real SSO (recommended)",
  "id": "path-b-full-sandbox-with-real-sso-recommended",
  "level": 2
}, {
  "value": "Deploy it for real",
  "id": "deploy-it-for-real",
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
        id: "quick-start",
        children: "Quick Start"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Two paths, same app. Pick the one that matches how much realism you need."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "path-a-local-dev-with-a-mock-admin-fastest",
      children: "Path A: local dev with a mock admin (fastest)"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Use Node 22.22 (the Docker build version) or the developer/CI version in\n", (0,jsx_runtime.jsx)(_components.a, {
        href: "https://github.com/egose/k8ston/blob/main/.tool-versions",
        children: (0,jsx_runtime.jsx)(_components.code, {
          children: ".tool-versions"
        })
      }), ",\nthe pnpm version selected by root ", (0,jsx_runtime.jsx)(_components.code, {
        children: "package.json"
      }), ", and a kubeconfig for a development\ncluster (", (0,jsx_runtime.jsx)(_components.code, {
        children: "KUBECONFIG"
      }), " or ", (0,jsx_runtime.jsx)(_components.code, {
        children: "~/.kube/config"
      }), "). Current dependencies require at least Node 22.19."]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "# From the repository root.\npnpm install --frozen-lockfile\ncp -n app/.env.example app/.env\n# Set K8STON_NAMESPACE in app/.env to your development namespace (example: default).\npnpm --dir app dev --hostname 127.0.0.1   # http://localhost:3000\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "cp -n"
      }), " preserves an existing ", (0,jsx_runtime.jsx)(_components.code, {
        children: "app/.env"
      }), "; update it deliberately if needed.\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "AUTH_DISABLED=true"
      }), " uses the mock admin (", (0,jsx_runtime.jsx)(_components.code, {
        children: "dev@k8ston.local"
      }), ") for every request,\nignores session cookies, and still performs real Kubernetes writes. Use development\ncredentials, keep it loopback-bound, and never enable the bypass in production.\nTo exercise real SSO locally, set a fresh random ", (0,jsx_runtime.jsx)(_components.code, {
        children: "SESSION_SECRET"
      }), " (", (0,jsx_runtime.jsx)(_components.code, {
        children: "openssl rand -hex 32"
      }), "),\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "AUTH_DISABLED=false"
      }), ", and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "OIDC_*"
      }), " (your IdP needs redirect URI\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "http://localhost:3000/api/auth/callback"
      }), ")."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["From the repository root, use ", (0,jsx_runtime.jsx)(_components.code, {
        children: "pnpm --dir app build"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "pnpm --dir app lint"
      }), ",\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "pnpm --dir app start --hostname 127.0.0.1"
      }), ", and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "pnpm --dir app e2e"
      }), ".\nThe browser suite needs a production build and\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "pnpm --dir app exec playwright install chromium"
      }), "; it mocks Kubernetes-backed APIs."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "path-b-full-sandbox-with-real-sso-recommended",
      children: "Path B: full sandbox with real SSO (recommended)"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "The repo-root sandbox spins up a kind cluster with seeded fixtures plus Dex as\na throwaway OIDC provider — everything K8ston needs, nothing else."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "# from the repo root\npnpm install --frozen-lockfile\nmake up          # kind cluster + Dex + fixtures\ncp -n sandbox/app.env.sandbox app/.env\npnpm --dir app dev --hostname 127.0.0.1   # http://localhost:3000\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Sign in with any sandbox user (password is ", (0,jsx_runtime.jsx)(_components.code, {
        children: "password"
      }), " for all):"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "User"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Groups"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Expected access"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "alice@company.com"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "dev-team"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["can manage ", (0,jsx_runtime.jsx)(_components.code, {
              children: "database-credentials"
            })]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "bob@company.com"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "other-team"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "denied restricted Secrets; can manage open fixtures"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "carol@company.com"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "frontend-team"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["can manage namespace-fallback Secrets in ", (0,jsx_runtime.jsx)(_components.code, {
              children: "frontend-ns"
            })]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "admin@company.com"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "k8ston-admin"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "application ACL bypass within scope/visibility and Kubernetes RBAC"
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "These are read/manage grants, not read-only roles. Keep all sandbox credentials\nand signing keys confined to local testing."
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Tear down: ", (0,jsx_runtime.jsx)(_components.code, {
        children: "make down"
      }), " (stops Dex, keeps kind for fast iteration),\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "make destroy"
      }), " (removes Dex volumes ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "and"
      }), " all kind cluster data), or ", (0,jsx_runtime.jsx)(_components.code, {
        children: "make reset"
      }), "\n(destroy and recreate). ", (0,jsx_runtime.jsx)(_components.code, {
        children: "make seed"
      }), " can overwrite fixture edits."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["See the ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/sandbox/",
        children: "Sandbox guide"
      }), " for the fixture map, visibility\nmatrix, test scenarios, and headless authz checks."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "deploy-it-for-real",
      children: "Deploy it for real"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/deploy-kubernetes/",
          children: "Deploy to Kubernetes"
        }), " — raw manifests, namespace\nor cluster scope, OIDC wiring."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/deploy-helm/",
          children: "Deploy with Helm"
        }), " — the ", (0,jsx_runtime.jsx)(_components.code, {
          children: "helm/main"
        }), " chart with the\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "helm/k8ston"
        }), " subchart, NetworkPolicy included."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/configuration/",
          children: "Configuration"
        }), " — every environment variable, with\ndefaults and safety notes."]
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