"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["989"], {
4536(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_api_secrets_mdx_b4f_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-api-secrets-mdx-b4f.json
var site_docs_api_secrets_mdx_b4f_namespaceObject = JSON.parse('{"id":"api/secrets","title":"Secrets API","description":"Values cross the API boundary as plain strings; base64 stays inside","source":"@site/docs/api/secrets.mdx","sourceDirName":"api","slug":"/api/secrets","permalink":"/api/secrets","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":2,"frontMatter":{"sidebar_label":"Secrets","sidebar_position":2},"sidebar":"api","previous":{"title":"Namespaces","permalink":"/api/namespaces"},"next":{"title":"Versions","permalink":"/api/versions"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
;// CONCATENATED MODULE: ./docs/api/secrets.mdx


const frontMatter = {
	sidebar_label: 'Secrets',
	sidebar_position: 2
};
const contentTitle = 'Secrets API';

const assets = {

};



const toc = [{
  "value": "Shapes",
  "id": "shapes",
  "level": 2
}, {
  "value": "List secrets",
  "id": "list-secrets",
  "level": 2
}, {
  "value": "Create secret",
  "id": "create-secret",
  "level": 2
}, {
  "value": "Read secret",
  "id": "read-secret",
  "level": 2
}, {
  "value": "Update secret",
  "id": "update-secret",
  "level": 2
}, {
  "value": "Delete secret",
  "id": "delete-secret",
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
    h1: "h1",
    h2: "h2",
    header: "header",
    li: "li",
    p: "p",
    pre: "pre",
    strong: "strong",
    ul: "ul",
    ...(0,lib/* .useMDXComponents */.R)(),
    ...props.components
  };
  return (0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
    children: [(0,jsx_runtime.jsx)(_components.header, {
      children: (0,jsx_runtime.jsx)(_components.h1, {
        id: "secrets-api",
        children: "Secrets API"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Values cross the API boundary as ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "plain strings"
      }), "; base64 stays inside\nKubernetes. All routes require a session and enforce namespace scope →\nmanaged-only visibility (404 for unmanaged secrets when\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "KRYPTON_MANAGED_ONLY=true"
      }), ") → hybrid authorization (403)."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "shapes",
      children: "Shapes"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "SecretSummary"
      }), " (lists, creates):"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{\n  \"namespace\": \"krypton-test\",\n  \"name\": \"database-credentials\",\n  \"type\": \"Opaque\",\n  \"keys\": [\"DATABASE_URL\", \"DB_PASSWORD\"],\n  \"keyCount\": 2,\n  \"description\": \"Primary database credentials\",\n  \"version\": 3,\n  \"resourceVersion\": \"123456\",\n  \"creationTimestamp\": \"2026-01-04T12:00:00Z\",\n  \"allowedGroups\": [\"dev-team\"],\n  \"allowedUsers\": [],\n  \"managedByKrypton\": true\n}\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "SecretDetail"
      }), " (read, update, restore) adds decoded values:"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{ \"secret\": { \"...summary fields\": \"...\", \"data\": { \"DATABASE_URL\": \"postgres://…\" } } }\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "list-secrets",
      children: "List secrets"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-http",
        children: "GET /api/namespaces/:namespace/secrets\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{\n  \"namespace\": \"krypton-test\",\n  \"secrets\": [{ \"...\": \"SecretSummary[]\" }],\n  \"canCreate\": true\n}\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["History snapshots are always excluded; unmanaged secrets are excluded too when\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "KRYPTON_MANAGED_ONLY=true"
      }), ". ", (0,jsx_runtime.jsx)(_components.code, {
        children: "canCreate"
      }), " is a UX hint (namespace rules only) —\nPOST still enforces server-side."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "create-secret",
      children: "Create secret"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-http",
        children: "POST /api/namespaces/:namespace/secrets\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{\n  \"name\": \"demo-secret\",\n  \"type\": \"Opaque\",\n  \"data\": { \"API_KEY\": \"<api-key-value>\" },\n  \"description\": \"Demo\",\n  \"allowedGroups\": [\"dev-team\"],\n  \"allowedUsers\": []\n}\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "name"
        }), " must be a DNS subdomain (lowercase, ", (0,jsx_runtime.jsx)(_components.code, {
          children: "a-z0-9-."
        }), "); ", (0,jsx_runtime.jsx)(_components.code, {
          children: "type"
        }), " defaults to\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "Opaque"
        }), "; ", (0,jsx_runtime.jsx)(_components.code, {
          children: "data"
        }), " defaults to ", (0,jsx_runtime.jsx)(_components.code, {
          children: "{}"
        }), "; an extra ", (0,jsx_runtime.jsx)(_components.code, {
          children: "stringData"
        }), " map is merged in."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Creation is gated by ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "namespace rules alone"
        }), " (the secret has no annotations\nyet) → ", (0,jsx_runtime.jsx)(_components.code, {
          children: "403"
        }), " when excluded."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Answers ", (0,jsx_runtime.jsx)(_components.code, {
          children: "201 { \"secret\": SecretSummary }"
        }), ", stamping\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton.io/managed-by: krypton"
        }), " and ", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton.io/version: 1"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "409"
        }), " when the name already exists; ", (0,jsx_runtime.jsx)(_components.code, {
          children: "413"
        }), " over ~1 MiB; ", (0,jsx_runtime.jsx)(_components.code, {
          children: "400"
        }), " on validation."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "read-secret",
      children: "Read secret"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-http",
        children: "GET /api/namespaces/:namespace/secrets/:name\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Answers ", (0,jsx_runtime.jsx)(_components.code, {
        children: "{ \"secret\": SecretDetail }"
      }), " — decoded ", (0,jsx_runtime.jsx)(_components.code, {
        children: "data"
      }), " included. ", (0,jsx_runtime.jsx)(_components.code, {
        children: "403"
      }), " when the\nuser fails the secret / namespace rules."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "update-secret",
      children: "Update secret"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-http",
        children: "PUT /api/namespaces/:namespace/secrets/:name\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{\n  \"data\": { \"API_KEY\": \"<rotated-value>\" },\n  \"description\": \"Demo\",\n  \"allowedGroups\": [\"dev-team\"],\n  \"allowedUsers\": [],\n  \"resourceVersion\": \"123456\"\n}\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "resourceVersion"
        }), " is ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "required"
        }), " (optimistic concurrency): a mismatch with\nthe live object is ", (0,jsx_runtime.jsx)(_components.code, {
          children: "409"
        }), " with a reload prompt, and a true write race at the\nK8s API is a second ", (0,jsx_runtime.jsx)(_components.code, {
          children: "409"
        }), " path. Omitted ", (0,jsx_runtime.jsx)(_components.code, {
          children: "description"
        }), "/", (0,jsx_runtime.jsx)(_components.code, {
          children: "allowedGroups"
        }), "/\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "allowedUsers"
        }), " keep their previous values."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Snapshots the current state first (reversible history), then replaces the\nlive object with a bumped ", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton.io/version"
        }), " and ", (0,jsx_runtime.jsx)(_components.code, {
          children: "last-modified-by"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Answers ", (0,jsx_runtime.jsx)(_components.code, {
          children: "{ \"secret\": SecretDetail }"
        }), "; ", (0,jsx_runtime.jsx)(_components.code, {
          children: "413"
        }), " over ~1 MiB."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "delete-secret",
      children: "Delete secret"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-http",
        children: "DELETE /api/namespaces/:namespace/secrets/:name[?keepHistory=true]\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Answers ", (0,jsx_runtime.jsx)(_components.code, {
        children: "{ \"deleted\": \"<name>\" }"
      }), ". Snapshots are deleted too, unless\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "?keepHistory=true"
      }), " keeps them for forensics."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "related-pages",
      children: "Related pages"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/api/versions/",
          children: "Versions"
        }), " and ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/api/restore/",
          children: "Restore"
        }), " for history."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/authorization/",
          children: "Authorization"
        }), " for the 403/404 gating order."]
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