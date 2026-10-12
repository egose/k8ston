"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["593"], {
2334(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_guides_authentication_mdx_ef4_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-guides-authentication-mdx-ef4.json
var site_docs_guides_authentication_mdx_ef4_namespaceObject = JSON.parse('{"id":"guides/authentication","title":"Authentication","description":"Users sign in via generic OIDC SSO — Keycloak, Entra ID, Okta, Google, GitHub,","source":"@site/docs/guides/authentication.mdx","sourceDirName":"guides","slug":"/guides/authentication","permalink":"/guides/authentication","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":5,"frontMatter":{"sidebar_label":"Authentication","sidebar_position":5},"sidebar":"guides","previous":{"title":"Configuration","permalink":"/guides/configuration"},"next":{"title":"Authorization","permalink":"/guides/authorization"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
;// CONCATENATED MODULE: ./docs/guides/authentication.mdx


const frontMatter = {
	sidebar_label: 'Authentication',
	sidebar_position: 5
};
const contentTitle = 'Authentication';

const assets = {

};



const toc = [{
  "value": "How login works",
  "id": "how-login-works",
  "level": 2
}, {
  "value": "Claim mapping",
  "id": "claim-mapping",
  "level": 2
}, {
  "value": "Issuer rules",
  "id": "issuer-rules",
  "level": 2
}, {
  "value": "Dev bypass and headless sessions",
  "id": "dev-bypass-and-headless-sessions",
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
        id: "authentication",
        children: "Authentication"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Users sign in via generic OIDC SSO — Keycloak, Entra ID, Okta, Google, GitHub,\nor anything speaking discovery + PKCE. Users never need cluster credentials;\nthe app's ServiceAccount executes the K8s calls."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "how-login-works",
      children: "How login works"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-text",
        children: "Browser ──GET /api/auth/login──▶ Krypton ──discovery──▶ OIDC issuer\n   │                                  │ PKCE + nonce + state cookies\n   │◀──────── redirect to IdP ────────┘\n   │── user authenticates ──▶ IdP ──code──▶ /api/auth/callback\n                                                   │ code exchange, claim mapping\n                                                   ▼\n                                          krypton_session cookie (HS256 JWT, 8h)\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.ol, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "GET /api/auth/login"
        }), " builds the authorization URL (PKCE ", (0,jsx_runtime.jsx)(_components.code, {
          children: "S256"
        }), ", nonce,\nstate) and redirects to the IdP."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "GET /api/auth/callback"
        }), " exchanges the code, reads claims, and mints a\nstateless session JWT in an ", (0,jsx_runtime.jsx)(_components.code, {
          children: "HttpOnly"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "Secure"
        }), "-in-production,\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "SameSite=Lax"
        }), " cookie."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "GET /api/auth/me"
        }), " returns the current ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SessionUser"
        }), " (", (0,jsx_runtime.jsx)(_components.code, {
          children: "sub"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "email"
        }), ",\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "name"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "groups"
        }), ") or ", (0,jsx_runtime.jsx)(_components.code, {
          children: "401"
        }), " with ", (0,jsx_runtime.jsx)(_components.code, {
          children: "{ user: null }"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "GET /api/auth/logout"
        }), " clears the session cookie."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["See the ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/api/auth/",
        children: "Auth API"
      }), " for exact shapes."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "claim-mapping",
      children: "Claim mapping"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Variable"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Default"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Maps to"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "OIDC_GROUPS_CLAIM"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "groups"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "SessionUser.groups"
            }), " (authz input)"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "OIDC_USERNAME_CLAIM"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "email"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "SessionUser.email"
            }), " (identity)"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "OIDC_NAME_CLAIM"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "name"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "SessionUser.name"
            }), " (display)"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "OIDC_SCOPES"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "openid profile email groups"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Requested scopes"
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "email"
      }), " is the identity: admin matching, ", (0,jsx_runtime.jsx)(_components.code, {
        children: "allowed-users"
      }), ", and\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "last-modified-by"
      }), " all key off it (lowercased). ", (0,jsx_runtime.jsx)(_components.code, {
        children: "groups"
      }), " is the authorization\ninput for ", (0,jsx_runtime.jsx)(_components.code, {
        children: "allowed-groups"
      }), ", namespace rules, and admin groups."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "issuer-rules",
      children: "Issuer rules"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "OIDC_ISSUER"
        }), " is the issuer identifier, ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "not"
        }), " the discovery URL — the app\nappends ", (0,jsx_runtime.jsx)(_components.code, {
          children: "/.well-known/openid-configuration"
        }), " itself and requires an exact\nmatch with the document's ", (0,jsx_runtime.jsx)(_components.code, {
          children: "issuer"
        }), " field."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Redirect URI defaults to ", (0,jsx_runtime.jsx)(_components.code, {
          children: "<NEXT_PUBLIC_APP_URL>/api/auth/callback"
        }), "\n(override with ", (0,jsx_runtime.jsx)(_components.code, {
          children: "OIDC_REDIRECT_URI"
        }), "); register the same value at your IdP."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "OIDC configuration is cached per process — restart the app after Dex/IdP\nrestarts or issuer changes."
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "http://"
        }), " issuers fail closed: loopback hostnames only, explicit\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "OIDC_ALLOW_HTTP=true"
        }), " only, and rejected entirely when\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "NODE_ENV=production"
        }), "."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "dev-bypass-and-headless-sessions",
      children: "Dev bypass and headless sessions"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "AUTH_DISABLED=true"
        }), " returns a mock admin (", (0,jsx_runtime.jsx)(_components.code, {
          children: "dev@krypton.local"
        }), ") for every\nrequest. Local development only — assert ", (0,jsx_runtime.jsx)(_components.code, {
          children: "authDisabled: false"
        }), " via\n", (0,jsx_runtime.jsx)(_components.a, {
          href: "/api/config/",
          children: (0,jsx_runtime.jsx)(_components.code, {
            children: "GET /api/config"
          })
        }), " in real environments."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "sandbox/scripts/mint-jwt.mjs"
        }), " mints session JWTs directly (must match\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "SESSION_SECRET"
        }), ") for headless authz checks:"]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "ALICE=$(node sandbox/scripts/mint-jwt.mjs --email alice@company.com --groups dev-team)\ncurl --cookie \"krypton_session=$ALICE\" localhost:3000/api/auth/me\n"
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