"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["601"], {
2856(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_api_auth_mdx_0e1_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-api-auth-mdx-0e1.json
var site_docs_api_auth_mdx_0e1_namespaceObject = JSON.parse('{"id":"api/auth","title":"Auth API","description":"Generic OIDC (discovery + PKCE) with stateless HS256 session JWTs. See","source":"@site/docs/api/auth.mdx","sourceDirName":"api","slug":"/api/auth","permalink":"/api/auth","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":6,"frontMatter":{"sidebar_label":"Auth","sidebar_position":6},"sidebar":"api","previous":{"title":"Restart Consumers","permalink":"/api/restart-consumers"},"next":{"title":"Config","permalink":"/api/config"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
;// CONCATENATED MODULE: ./docs/api/auth.mdx


const frontMatter = {
	sidebar_label: 'Auth',
	sidebar_position: 6
};
const contentTitle = 'Auth API';

const assets = {

};



const toc = [{
  "value": "Start login",
  "id": "start-login",
  "level": 2
}, {
  "value": "OIDC callback",
  "id": "oidc-callback",
  "level": 2
}, {
  "value": "Current user",
  "id": "current-user",
  "level": 2
}, {
  "value": "Logout",
  "id": "logout",
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
    ul: "ul",
    ...(0,lib/* .useMDXComponents */.R)(),
    ...props.components
  };
  return (0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
    children: [(0,jsx_runtime.jsx)(_components.header, {
      children: (0,jsx_runtime.jsx)(_components.h1, {
        id: "auth-api",
        children: "Auth API"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Generic OIDC (discovery + PKCE) with stateless HS256 session JWTs. See\n", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/authentication/",
        children: "Authentication"
      }), " for the design."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "start-login",
      children: "Start login"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-http",
        children: "GET /api/auth/login\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["With ", (0,jsx_runtime.jsx)(_components.code, {
          children: "AUTH_DISABLED=true"
        }), ", short-circuits to a dev session and redirects to ", (0,jsx_runtime.jsx)(_components.code, {
          children: "/"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Without OIDC configured, answers ", (0,jsx_runtime.jsx)(_components.code, {
          children: "501"
        }), " (operator must set\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "OIDC_ISSUER"
        }), "/", (0,jsx_runtime.jsx)(_components.code, {
          children: "OIDC_CLIENT_ID"
        }), ", or ", (0,jsx_runtime.jsx)(_components.code, {
          children: "AUTH_DISABLED=true"
        }), " for local dev)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Otherwise redirects to the IdP authorization endpoint. When the IdP is\nunreachable, answers ", (0,jsx_runtime.jsx)(_components.code, {
          children: "502"
        }), " with the issuer, cause code, and hint (logged\nserver-side with hostname detail)."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "oidc-callback",
      children: "OIDC callback"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-http",
        children: "GET /api/auth/callback?code=…&state=…\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Exchanges the code, maps claims (", (0,jsx_runtime.jsx)(_components.code, {
        children: "email"
      }), " identity, ", (0,jsx_runtime.jsx)(_components.code, {
        children: "groups"
      }), " authz input,\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "name"
      }), " display), sets the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "krypton_session"
      }), " cookie (", (0,jsx_runtime.jsx)(_components.code, {
        children: "HttpOnly"
      }), ",\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "Secure"
      }), " in production, ", (0,jsx_runtime.jsx)(_components.code, {
        children: "SameSite=Lax"
      }), ", 8h default), and redirects to ", (0,jsx_runtime.jsx)(_components.code, {
        children: "/"
      }), "."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["On failure (including IdP verdicts like ", (0,jsx_runtime.jsx)(_components.code, {
        children: "invalid_grant"
      }), " from a redirect-URI\nmismatch), redirects to ", (0,jsx_runtime.jsx)(_components.code, {
        children: "/login?auth=error"
      }), " carrying the short ", (0,jsx_runtime.jsx)(_components.code, {
        children: "idp_error"
      }), "\ncode — the single-use code and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "error_description"
      }), " stay out of URLs and logs."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "current-user",
      children: "Current user"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-http",
        children: "GET /api/auth/me\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{ \"user\": { \"sub\": \"…\", \"email\": \"alice@company.com\", \"name\": \"Alice\", \"groups\": [\"dev-team\"] } }\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Answers ", (0,jsx_runtime.jsx)(_components.code, {
        children: "401 { \"user\": null }"
      }), " when unauthenticated — the one endpoint that\ndoes not use the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "{ \"error\": … }"
      }), " shape."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "logout",
      children: "Logout"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-http",
        children: "GET /api/auth/logout\nPOST /api/auth/logout\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Both clear the session cookie. ", (0,jsx_runtime.jsx)(_components.code, {
        children: "GET"
      }), " redirects to ", (0,jsx_runtime.jsx)(_components.code, {
        children: "/login"
      }), "; ", (0,jsx_runtime.jsx)(_components.code, {
        children: "POST"
      }), " answers\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "{ \"ok\": true }"
      }), " for fetch-based sign-out buttons."]
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