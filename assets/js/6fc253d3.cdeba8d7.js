"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["904"], {
5917(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_about_security_model_mdx_6fc_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-about-security-model-mdx-6fc.json
var site_docs_about_security_model_mdx_6fc_namespaceObject = JSON.parse('{"id":"about/security-model","title":"Security Model","description":"Read this before production. Krypton makes secret management convenient, but it","source":"@site/docs/about/security-model.mdx","sourceDirName":"about","slug":"/about/security-model","permalink":"/about/security-model","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":3,"frontMatter":{"sidebar_label":"Security Model","sidebar_position":3},"sidebar":"about","previous":{"title":"Architecture","permalink":"/about/architecture"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
;// CONCATENATED MODULE: ./docs/about/security-model.mdx


const frontMatter = {
	sidebar_label: 'Security Model',
	sidebar_position: 3
};
const contentTitle = 'Security Model';

const assets = {

};



const toc = [{
  "value": "The etcd truth",
  "id": "the-etcd-truth",
  "level": 2
}, {
  "value": "Authentication guarantees",
  "id": "authentication-guarantees",
  "level": 2
}, {
  "value": "Authorization rules",
  "id": "authorization-rules",
  "level": 2
}, {
  "value": "Concurrency and integrity",
  "id": "concurrency-and-integrity",
  "level": 2
}, {
  "value": "Least-privilege RBAC",
  "id": "least-privilege-rbac",
  "level": 2
}, {
  "value": "Operational checklist",
  "id": "operational-checklist",
  "level": 2
}];
function _createMdxContent(props) {
  const _components = {
    a: "a",
    admonition: "admonition",
    code: "code",
    em: "em",
    h1: "h1",
    h2: "h2",
    header: "header",
    input: "input",
    li: "li",
    ol: "ol",
    p: "p",
    strong: "strong",
    ul: "ul",
    ...(0,lib/* .useMDXComponents */.R)(),
    ...props.components
  };
  return (0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
    children: [(0,jsx_runtime.jsx)(_components.header, {
      children: (0,jsx_runtime.jsx)(_components.h1, {
        id: "security-model",
        children: "Security Model"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Read this before production. Krypton makes secret management convenient, but it\ncannot make Kubernetes Secrets something they are not."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "the-etcd-truth",
      children: "The etcd truth"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Out of the box, Kubernetes Secrets are ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "base64-encoded, not encrypted"
      }), ", in etcd —\nanyone with etcd or broad API access can decode them. Krypton therefore:"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Never logs secret values."
        }), " Audit logs record key ", (0,jsx_runtime.jsx)(_components.em, {
          children: "names"
        }), " only\n(", (0,jsx_runtime.jsx)(_components.code, {
          children: "auditLog()"
        }), " in ", (0,jsx_runtime.jsx)(_components.code, {
          children: "lib/validation.ts"
        }), "); grep the logs to prove it."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Masks values in the UI"
        }), " until explicitly revealed per key."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Validates the 1 MiB per-object limit"
        }), " client- and server-side (the form\nmeter blocks; forced API calls get ", (0,jsx_runtime.jsx)(_components.code, {
          children: "413"
        }), ")."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Shows a warning banner"
        }), " until you confirm etcd encryption-at-rest is enabled\n(", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_ETCD_ENCRYPTED=true"
        }), " once the API server uses an encryption provider\nsuch as ", (0,jsx_runtime.jsx)(_components.code, {
          children: "aescbc"
        }), " on OpenShift)."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Secrets additionally benefit from strict RBAC, redacted ", (0,jsx_runtime.jsx)(_components.code, {
        children: "kubectl"
      }), " output, and\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "tmpfs"
      }), " (RAM-backed) volume mounts that never touch node disk."]
    }), "\n", (0,jsx_runtime.jsx)(_components.admonition, {
      type: "warning",
      children: (0,jsx_runtime.jsxs)(_components.p, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_ETCD_ENCRYPTED"
        }), " is an attestation, not a detector. Set it to ", (0,jsx_runtime.jsx)(_components.code, {
          children: "true"
        }), "\nonly after you have verified the API server encrypts Secret resources at rest."]
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "authentication-guarantees",
      children: "Authentication guarantees"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Sessions are stateless HS256 JWTs (", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton_session"
        }), " cookie, ", (0,jsx_runtime.jsx)(_components.code, {
          children: "HttpOnly"
        }), ",\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "Secure"
        }), " in production, ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SameSite=Lax"
        }), ", 8-hour default). There is no session\nstore to steal — but ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SESSION_SECRET"
        }), " must be ≥32 random characters\n(", (0,jsx_runtime.jsx)(_components.code, {
          children: "openssl rand -hex 32"
        }), ") and must ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "never"
        }), " be committed."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["OIDC uses discovery + PKCE (", (0,jsx_runtime.jsx)(_components.code, {
          children: "openid-client"
        }), "). The issuer must exactly match the\ndiscovery document's ", (0,jsx_runtime.jsx)(_components.code, {
          children: "issuer"
        }), " field."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "http://"
        }), " issuers fail closed: loopback only, ", (0,jsx_runtime.jsx)(_components.code, {
          children: "OIDC_ALLOW_HTTP=true"
        }), " only, and\n", (0,jsx_runtime.jsxs)(_components.strong, {
          children: ["rejected entirely when ", (0,jsx_runtime.jsx)(_components.code, {
            children: "NODE_ENV=production"
          })]
        }), ". This exists for sandbox Dex,\nnot for real IdPs."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "AUTH_DISABLED=true"
        }), " skips SSO with a mock admin. Local development only. The\n", (0,jsx_runtime.jsx)(_components.a, {
          href: "/api/config/",
          children: "public config endpoint"
        }), " exposes ", (0,jsx_runtime.jsx)(_components.code, {
          children: "authDisabled"
        }), " so deployments\ncan assert it is ", (0,jsx_runtime.jsx)(_components.code, {
          children: "false"
        }), "."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "authorization-rules",
      children: "Authorization rules"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ol, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Admins (", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_ADMIN_GROUPS"
        }), "/", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_ADMIN_USERS"
        }), ") always pass."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "A secret with explicit annotations is decided by those alone (override)."
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Otherwise the namespace fallback in ConfigMap ", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton-access"
        }), " applies."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "With no rules anywhere, the secret is visible to all authenticated users\n(open by default, restricted once rules are added)."
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Until any admin is configured, ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "every authenticated user is treated as admin"
      }), "\n(bootstrap mode) — set admins promptly. See\n", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/authorization/",
        children: "Authorization"
      }), " for the full matrix."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.strong, {
        children: "Managed-only mode"
      }), " (default, ", (0,jsx_runtime.jsx)(_components.code, {
        children: "KRYPTON_MANAGED_ONLY=true"
      }), "): secrets ", (0,jsx_runtime.jsx)(_components.em, {
        children: "without"
      }), "\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "krypton.io/managed-by: krypton"
      }), " are hidden entirely — excluded from lists, 404\non direct access (read, edit, delete, history, restore, restart) — so K8s-level\nsecrets created outside Krypton can't be touched by accident."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "concurrency-and-integrity",
      children: "Concurrency and integrity"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Writes require the current ", (0,jsx_runtime.jsx)(_components.code, {
          children: "metadata.resourceVersion"
        }), "; stale edits get ", (0,jsx_runtime.jsx)(_components.code, {
          children: "409"
        }), "\ninstead of silently clobbering a colleague's change."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Every overwrite snapshots first; every restore snapshots first. There is no\nwrite path that destroys the previous state without keeping a copy (within\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_HISTORY_LIMIT"
        }), ")."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Secret names must be DNS subdomains (validated by ", (0,jsx_runtime.jsx)(_components.code, {
          children: "k8sName"
        }), "); descriptions are\ncapped at 1024 chars; payloads are zod-validated before touching the API."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "least-privilege-rbac",
      children: "Least-privilege RBAC"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Default scope needs only ", (0,jsx_runtime.jsx)(_components.code, {
          children: "secrets"
        }), " (full verbs, own namespace) + ", (0,jsx_runtime.jsx)(_components.code, {
          children: "configmaps"
        }), "\n(read) — see ", (0,jsx_runtime.jsx)(_components.code, {
          children: "app/k8s/role.yaml"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["The ", (0,jsx_runtime.jsx)(_components.code, {
          children: "apps"
        }), " rule (deployments/statefulsets/daemonsets: get, list, watch, patch)\nis required ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "only"
        }), " when ", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_RESTART_ENABLED=true"
        }), ". It ships commented\nout; enabling the flag without the rule fails closed at the API."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Cluster scope additionally needs ", (0,jsx_runtime.jsx)(_components.code, {
          children: "namespaces"
        }), " (get, list, watch);\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_NAMESPACES"
        }), " narrows the blast radius."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Optional impersonation (", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_IMPERSONATION=true"
        }), ") requires the API server\nto trust the same OIDC issuer and grants the ", (0,jsx_runtime.jsx)(_components.code, {
          children: "impersonate"
        }), " verb — only enable\nit when you understand both sides."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "operational-checklist",
      children: "Operational checklist"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      className: "contains-task-list",
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        className: "task-list-item",
        children: [(0,jsx_runtime.jsx)(_components.input, {
          type: "checkbox",
          disabled: true
        }), " ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SESSION_SECRET"
        }), " is random, ≥32 chars, stored in a K8s Secret, never in git."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        className: "task-list-item",
        children: [(0,jsx_runtime.jsx)(_components.input, {
          type: "checkbox",
          disabled: true
        }), " ", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_ADMIN_GROUPS"
        }), "/", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_ADMIN_USERS"
        }), " are set (no bootstrap mode)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        className: "task-list-item",
        children: [(0,jsx_runtime.jsx)(_components.input, {
          type: "checkbox",
          disabled: true
        }), " ", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_ETCD_ENCRYPTED=true"
        }), " after verifying apiserver encryption."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        className: "task-list-item",
        children: [(0,jsx_runtime.jsx)(_components.input, {
          type: "checkbox",
          disabled: true
        }), " ", (0,jsx_runtime.jsx)(_components.code, {
          children: "AUTH_DISABLED=false"
        }), " and ", (0,jsx_runtime.jsx)(_components.code, {
          children: "OIDC_ALLOW_HTTP=false"
        }), " in real environments."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        className: "task-list-item",
        children: [(0,jsx_runtime.jsx)(_components.input, {
          type: "checkbox",
          disabled: true
        }), " ", "Ingress/Route uses TLS; OIDC redirect URI matches ", (0,jsx_runtime.jsx)(_components.code, {
          children: "https://<host>/api/auth/callback"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        className: "task-list-item",
        children: [(0,jsx_runtime.jsx)(_components.input, {
          type: "checkbox",
          disabled: true
        }), " ", (0,jsx_runtime.jsx)(_components.code, {
          children: "apps"
        }), " RBAC rule present ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "iff"
        }), " ", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_RESTART_ENABLED=true"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        className: "task-list-item",
        children: [(0,jsx_runtime.jsx)(_components.input, {
          type: "checkbox",
          disabled: true
        }), " ", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_MANAGED_ONLY=true"
        }), " (default) unless you need the legacy adoption flow."]
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