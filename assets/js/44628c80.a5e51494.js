"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["937"], {
6861(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_guides_configuration_mdx_446_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-guides-configuration-mdx-446.json
var site_docs_guides_configuration_mdx_446_namespaceObject = JSON.parse('{"id":"guides/configuration","title":"Configuration","description":"Everything is environment-driven (lib/config.ts), resolved at request time —","source":"@site/docs/guides/configuration.mdx","sourceDirName":"guides","slug":"/guides/configuration","permalink":"/guides/configuration","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":4,"frontMatter":{"sidebar_label":"Configuration","sidebar_position":4},"sidebar":"guides","previous":{"title":"Deploy with Helm","permalink":"/guides/deploy-helm"},"next":{"title":"Authentication","permalink":"/guides/authentication"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
;// CONCATENATED MODULE: ./docs/guides/configuration.mdx


const frontMatter = {
	sidebar_label: 'Configuration',
	sidebar_position: 4
};
const contentTitle = 'Configuration';

const assets = {

};



const toc = [{
  "value": "Reference",
  "id": "reference",
  "level": 2
}, {
  "value": "Flags that deserve a second thought",
  "id": "flags-that-deserve-a-second-thought",
  "level": 2
}, {
  "value": "Public-safe client config",
  "id": "public-safe-client-config",
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
        id: "configuration",
        children: "Configuration"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Everything is environment-driven (", (0,jsx_runtime.jsx)(_components.code, {
        children: "lib/config.ts"
      }), "), resolved at request time —\none image runs in many clusters. Non-secret values go in ", (0,jsx_runtime.jsx)(_components.code, {
        children: "krypton-config"
      }), ";\nsecrets (", (0,jsx_runtime.jsx)(_components.code, {
        children: "OIDC_CLIENT_SECRET"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "SESSION_SECRET"
      }), ") go in the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "krypton-oidc"
      }), " Secret."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "reference",
      children: "Reference"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Variable"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Default"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Purpose"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "KRYPTON_SCOPE"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "namespace"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "namespace"
            }), " (own NS only) or ", (0,jsx_runtime.jsx)(_components.code, {
              children: "cluster"
            })]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "KRYPTON_NAMESPACE"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "krypton"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Fallback for the app's own namespace (downward API wins in-cluster)"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "KRYPTON_NAMESPACES"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "—"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Comma allowlist for cluster scope"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "KRYPTON_HISTORY_LIMIT"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "20"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Snapshots kept per secret"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "KRYPTON_MANAGED_ONLY"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "true"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Hide secrets without ", (0,jsx_runtime.jsx)(_components.code, {
              children: "managed-by=krypton"
            }), " (404)"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "KRYPTON_ETCD_ENCRYPTED"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "false"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Set ", (0,jsx_runtime.jsx)(_components.code, {
              children: "true"
            }), " once apiserver encryption is on"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "KRYPTON_IMPERSONATION"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "false"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Forward SSO identity to K8s RBAC"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "KRYPTON_RESTART_ENABLED"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "false"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "true"
            }), " enables \"Restart apps\" (needs apps RBAC rule)"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "KRYPTON_ADMIN_GROUPS"
            }), " / ", (0,jsx_runtime.jsx)(_components.code, {
              children: "KRYPTON_ADMIN_USERS"
            })]
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "—"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Bootstrap admins (empty = everyone, lock down!)"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "KRYPTON_ANNOTATION_PREFIX"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "krypton.io"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Annotation/label prefix"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "KRYPTON_ACCESS_CONFIGMAP"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "krypton-access"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Namespace-rules ConfigMap name"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "AUTH_DISABLED"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "false"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "true"
            }), " = mock admin, local dev only"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SESSION_SECRET"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "—"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "≥32-char HMAC key for session JWTs"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SESSION_MAX_AGE"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "28800"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Session lifetime in seconds (8h)"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "OIDC_ISSUER"
            }), " / ", (0,jsx_runtime.jsx)(_components.code, {
              children: "OIDC_CLIENT_ID"
            }), " / ", (0,jsx_runtime.jsx)(_components.code, {
              children: "OIDC_CLIENT_SECRET"
            })]
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "—"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "SSO provider (discovery-based)"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "OIDC_REDIRECT_URI"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "<APP_URL>/api/auth/callback"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Override the derived redirect URI"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "OIDC_ALLOW_HTTP"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "false"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Allow ", (0,jsx_runtime.jsx)(_components.code, {
              children: "http://"
            }), " issuers — loopback + non-prod only (sandbox Dex)"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "OIDC_SCOPES"
            }), " / ", (0,jsx_runtime.jsx)(_components.code, {
              children: "OIDC_GROUPS_CLAIM"
            }), " / ", (0,jsx_runtime.jsx)(_components.code, {
              children: "OIDC_USERNAME_CLAIM"
            }), " / ", (0,jsx_runtime.jsx)(_components.code, {
              children: "OIDC_NAME_CLAIM"
            })]
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "openid profile email groups"
            }), " / ", (0,jsx_runtime.jsx)(_components.code, {
              children: "groups"
            }), " / ", (0,jsx_runtime.jsx)(_components.code, {
              children: "email"
            }), " / ", (0,jsx_runtime.jsx)(_components.code, {
              children: "name"
            })]
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Claim mapping"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "NEXT_PUBLIC_APP_URL"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "http://localhost:3000"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Public URL (derives OIDC redirect)"
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "flags-that-deserve-a-second-thought",
      children: "Flags that deserve a second thought"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsxs)(_components.strong, {
          children: [(0,jsx_runtime.jsx)(_components.code, {
            children: "KRYPTON_ADMIN_GROUPS"
          }), " / ", (0,jsx_runtime.jsx)(_components.code, {
            children: "KRYPTON_ADMIN_USERS"
          })]
        }), " — when both are empty,\nevery authenticated user is admin (bootstrap mode). Convenient for first\nlogin, dangerous to leave. Set at least one group."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: (0,jsx_runtime.jsx)(_components.code, {
            children: "KRYPTON_MANAGED_ONLY"
          })
        }), " — default ", (0,jsx_runtime.jsx)(_components.code, {
          children: "true"
        }), " hides any secret not created by\nKrypton (excluded from lists, 404 on direct access). Set ", (0,jsx_runtime.jsx)(_components.code, {
          children: "false"
        }), " only to show\neverything again (legacy adopt-on-edit: saving an external secret stamps\nKrypton annotations onto it)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: (0,jsx_runtime.jsx)(_components.code, {
            children: "KRYPTON_IMPERSONATION"
          })
        }), " — default ", (0,jsx_runtime.jsx)(_components.code, {
          children: "false"
        }), " (hybrid mode: the app\nServiceAccount executes, Krypton enforces authz itself). Set ", (0,jsx_runtime.jsx)(_components.code, {
          children: "true"
        }), " only when\nthe API server trusts the same OIDC issuer, so ", (0,jsx_runtime.jsx)(_components.code, {
          children: "Impersonate-User"
        }), "/", (0,jsx_runtime.jsx)(_components.code, {
          children: "Group"
        }), "\nheaders evaluate the ", (0,jsx_runtime.jsx)(_components.em, {
          children: "human's"
        }), " RBAC instead."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: (0,jsx_runtime.jsx)(_components.code, {
            children: "KRYPTON_RESTART_ENABLED"
          })
        }), " — default ", (0,jsx_runtime.jsx)(_components.code, {
          children: "false"
        }), " (button hidden, API 403, no\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "apps"
        }), " permissions needed). Enabling requires the ", (0,jsx_runtime.jsx)(_components.code, {
          children: "apps"
        }), " RBAC rule too."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: (0,jsx_runtime.jsx)(_components.code, {
            children: "OIDC_ALLOW_HTTP"
          })
        }), " — refused for non-loopback issuers and when\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "NODE_ENV=production"
        }), ", even if set. Sandbox Dex only."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "public-safe-client-config",
      children: "Public-safe client config"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "GET /api/config"
      }), " exposes the non-sensitive subset (", (0,jsx_runtime.jsx)(_components.code, {
        children: "scope"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "etcdEncrypted"
      }), ",\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "authDisabled"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "oidcConfigured"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "historyLimit"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "managedOnly"
      }), ",\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "restartEnabled"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "appNamespace"
      }), ") so the UI — and your deployment checks — can\nassert the effective configuration without secrets. See\n", (0,jsx_runtime.jsx)(_components.a, {
        href: "/api/config/",
        children: "Config API"
      }), "."]
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