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
  "value": "413 on save",
  "id": "413-on-save",
  "level": 2
}, {
  "value": "Namespace missing from the list",
  "id": "namespace-missing-from-the-list",
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
          children: "<NEXT_PUBLIC_APP_URL>/api/auth/callback"
        }), ", or ", (0,jsx_runtime.jsx)(_components.code, {
          children: "OIDC_REDIRECT_URI"
        }), ")."]
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
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "403-from-the-app-vs-403-from-kubernetes",
      children: "403 from the app vs 403 from Kubernetes"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "You are not allowed to …"
        }), " → Krypton authz denied it (annotations /\nnamespace rules / admin config). Check the visibility matrix in\n", (0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/authorization/",
          children: "Authorization"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "Kubernetes API (403): … — Access denied. Contact your administrator (the app is missing Kubernetes RBAC permission)."
        }), " → the ServiceAccount lacks RBAC.\nVerify with ", (0,jsx_runtime.jsx)(_components.code, {
          children: "kubectl auth can-i … --as=system:serviceaccount:<ns>:krypton"
        }), "\n(see the ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/sandbox/",
          children: "Sandbox guide"
        }), ") and check scope vs Role."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "404-on-a-secret-that-exists",
      children: "404 on a secret that exists"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_MANAGED_ONLY=true"
        }), " (default) hides secrets without\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton.io/managed-by: krypton"
        }), " — excluded from lists, 404 on direct access.\nEither manage the secret through Krypton or set the flag to ", (0,jsx_runtime.jsx)(_components.code, {
          children: "false"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["History snapshots (", (0,jsx_runtime.jsx)(_components.code, {
          children: "<name>-vN"
        }), ") are always hidden from the secrets list."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "409-on-save",
      children: "409 on save"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The secret changed since you loaded it (or a concurrent write raced yours).\nReload and retry — your values are preserved in the form. See\n", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/versioning-history/",
        children: "Versioning & History"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "413-on-save",
      children: "413 on save"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "The payload exceeds ~1 MiB. Split the secret or move large blobs (certs,\nbundles) to a volume/registry instead."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "namespace-missing-from-the-list",
      children: "Namespace missing from the list"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "namespace"
        }), " scope shows only the pod's own namespace — by design."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "cluster"
        }), " scope needs the ", (0,jsx_runtime.jsx)(_components.code, {
          children: "namespaces"
        }), " get/list/watch grant; without it the\napp falls back to ", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_NAMESPACES"
        }), " (or its own namespace)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_NAMESPACES"
        }), " acts as an allowlist in cluster scope — a typo hides\nnamespaces silently."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.h2, {
      id: "restart-apps-missing--403",
      children: [(0,jsx_runtime.jsx)(_components.em, {
        children: "Restart apps"
      }), " missing / 403"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The button is hidden and the API returns 403 unless ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "both"
      }), "\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "KRYPTON_RESTART_ENABLED=true"
      }), " ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "and"
      }), " the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "apps"
      }), " RBAC rule are in place. See\n", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/consumer-restarts/",
        children: "Consumer Restarts"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "etcd-warning-banner-wont-go-away",
      children: "etcd warning banner won't go away"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Set ", (0,jsx_runtime.jsx)(_components.code, {
        children: "KRYPTON_ETCD_ENCRYPTED=true"
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
          children: "kind-krypton-sandbox"
        }), " —\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "make kind-up"
        }), " re-selects it. Never seed prod."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "make seed"
        }), " re-applies fixtures idempotently; ", (0,jsx_runtime.jsx)(_components.code, {
          children: "make reset"
        }), " for a clean slate."]
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