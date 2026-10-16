"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["725"], {
476(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_guides_local_development_mdx_c46_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-guides-local-development-mdx-c46.json
var site_docs_guides_local_development_mdx_c46_namespaceObject = JSON.parse('{"id":"guides/local-development","title":"Local Development","description":"Use Node 22.22 (the Docker build version) or the developer/CI version in","source":"@site/docs/guides/local-development.mdx","sourceDirName":"guides","slug":"/guides/local-development","permalink":"/guides/local-development","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":0,"frontMatter":{"sidebar_label":"Local Development","sidebar_position":0},"sidebar":"guides","next":{"title":"Sandbox","permalink":"/guides/sandbox"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
;// CONCATENATED MODULE: ./docs/guides/local-development.mdx


const frontMatter = {
	sidebar_label: 'Local Development',
	sidebar_position: 0
};
const contentTitle = 'Local Development';

const assets = {

};



const toc = [{
  "value": "Mock-admin loop (no IdP)",
  "id": "mock-admin-loop-no-idp",
  "level": 2
}, {
  "value": "Real-SSO loop (local app, real IdP)",
  "id": "real-sso-loop-local-app-real-idp",
  "level": 2
}, {
  "value": "Prefer batteries-included?",
  "id": "prefer-batteries-included",
  "level": 2
}, {
  "value": "Commands",
  "id": "commands",
  "level": 2
}];
function _createMdxContent(props) {
  const _components = {
    a: "a",
    admonition: "admonition",
    code: "code",
    h1: "h1",
    h2: "h2",
    header: "header",
    p: "p",
    pre: "pre",
    strong: "strong",
    table: "table",
    tbody: "tbody",
    td: "td",
    th: "th",
    thead: "thead",
    tr: "tr",
    ...(0,lib/* .useMDXComponents */.R)(),
    ...props.components
  };
  return (0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
    children: [(0,jsx_runtime.jsx)(_components.header, {
      children: (0,jsx_runtime.jsx)(_components.h1, {
        id: "local-development",
        children: "Local Development"
      })
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
      }), "). Current dependencies require at least Node 22.19.\nChoose credentials allowed to manage Secrets in your development namespace."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "mock-admin-loop-no-idp",
      children: "Mock-admin loop (no IdP)"
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
      }), "; adapt it deliberately if it exists.\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "AUTH_DISABLED=true"
      }), " signs every request in as the mock admin ", (0,jsx_runtime.jsx)(_components.code, {
        children: "dev@k8ston.local"
      }), "\nand ignores session cookies. It still performs real Kubernetes writes, so use a\ndevelopment cluster, keep it loopback-bound, and never enable it in production\nor for per-user authorization checks. Managed-only mode hides unmanaged Secrets by default."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "real-sso-loop-local-app-real-idp",
      children: "Real-SSO loop (local app, real IdP)"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Set a fresh random ", (0,jsx_runtime.jsx)(_components.code, {
        children: "SESSION_SECRET"
      }), " (use ", (0,jsx_runtime.jsx)(_components.code, {
        children: "openssl rand -hex 32"
      }), "),\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "AUTH_DISABLED=false"
      }), ", and your ", (0,jsx_runtime.jsx)(_components.code, {
        children: "OIDC_*"
      }), " settings in ", (0,jsx_runtime.jsx)(_components.code, {
        children: "app/.env"
      }), ". Your IdP needs\nthe redirect URI registered:"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-text",
        children: "http://localhost:3000/api/auth/callback\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "OIDC_ISSUER"
      }), " is the issuer identifier, ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "not"
      }), " the discovery URL: the app\nappends ", (0,jsx_runtime.jsx)(_components.code, {
        children: "/.well-known/openid-configuration"
      }), " itself, and it must exactly match\nthe ", (0,jsx_runtime.jsx)(_components.code, {
        children: "issuer"
      }), " field of that document (Keycloak realms often live under\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "/auth/realms/..."
      }), ")."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Note: OIDC configuration is cached per process — restart ", (0,jsx_runtime.jsx)(_components.code, {
        children: "pnpm dev"
      }), " if you\nchange issuer settings or restart your IdP."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "prefer-batteries-included",
      children: "Prefer batteries-included?"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The repo-root ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/sandbox/",
        children: "sandbox"
      }), " spins up a kind cluster with seeded\nfixtures plus Dex as a throwaway OIDC provider (", (0,jsx_runtime.jsx)(_components.code, {
        children: "make up"
      }), ", then copy\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "sandbox/app.env.sandbox"
      }), " to ", (0,jsx_runtime.jsx)(_components.code, {
        children: "app/.env"
      }), "). Use it when you want realistic SSO,\nauthz fixtures, and consumer workloads without touching a shared cluster."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "commands",
      children: "Commands"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Run these from the repository root:"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Command"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Purpose"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "pnpm --dir app dev --hostname 127.0.0.1"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Loopback dev server with hot reload"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "pnpm --dir app build"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Production build"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "pnpm --dir app start --hostname 127.0.0.1"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Serve the production build on loopback"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "pnpm --dir app lint"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "ESLint"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "pnpm --dir app e2e"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Playwright browser suite; needs a production build"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "pnpm --dir app exec playwright install chromium"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "One-time browser install"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "pnpm test:unit"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Backend regressions; no cluster or IdP required"
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Browser tests mock Kubernetes-backed HTTP APIs; they are not proof of real cluster\nRBAC or end-to-end OIDC. See the sandbox for integration checks."
    }), "\n", (0,jsx_runtime.jsx)(_components.admonition, {
      type: "note",
      children: (0,jsx_runtime.jsxs)(_components.p, {
        children: ["The host dev server uses your selected kubeconfig — it does ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "not"
        }), " exercise\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "app/k8s/role.yaml"
        }), " or the ServiceAccount-token flow. Validate those against\nkind too; the ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/sandbox/",
          children: "sandbox guide"
        }), " shows how."]
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