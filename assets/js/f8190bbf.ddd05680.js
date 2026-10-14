"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["778"], {
8360(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_api_namespaces_mdx_f81_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-api-namespaces-mdx-f81.json
var site_docs_api_namespaces_mdx_f81_namespaceObject = JSON.parse('{"id":"api/namespaces","title":"Namespaces API","description":"List allowed namespaces","source":"@site/docs/api/namespaces.mdx","sourceDirName":"api","slug":"/api/namespaces","permalink":"/api/namespaces","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":1,"frontMatter":{"sidebar_label":"Namespaces","sidebar_position":1},"sidebar":"api","previous":{"title":"Overview","permalink":"/api/overview"},"next":{"title":"Secrets","permalink":"/api/secrets"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
;// CONCATENATED MODULE: ./docs/api/namespaces.mdx


const frontMatter = {
	sidebar_label: 'Namespaces',
	sidebar_position: 1
};
const contentTitle = 'Namespaces API';

const assets = {

};



const toc = [{
  "value": "List allowed namespaces",
  "id": "list-allowed-namespaces",
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
        id: "namespaces-api",
        children: "Namespaces API"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "list-allowed-namespaces",
      children: "List allowed namespaces"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-http",
        children: "GET /api/namespaces\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Returns the namespaces the app may operate in, plus the effective scope:"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{ \"scope\": \"cluster\", \"namespaces\": [\"frontend-ns\", \"k8ston-test\"] }\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Behavior (", (0,jsx_runtime.jsx)(_components.code, {
        children: "lib/namespaces.ts"
      }), "):"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "namespace"
        }), " scope: exactly ", (0,jsx_runtime.jsx)(_components.code, {
          children: "[<pod-own-namespace>]"
        }), " — by design."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "cluster"
        }), " scope with ", (0,jsx_runtime.jsx)(_components.code, {
          children: "K8STON_NAMESPACES"
        }), ": returns the configured names,\ndeduplicated and sorted, with ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "zero Kubernetes namespace-list requests"
        }), ".\nExistence and Kubernetes permission are checked by the actual resource operations."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "cluster"
        }), " scope with an empty allowlist: completes paginated namespace discovery\nusing the effective Kubernetes identity. All pages preserve per-user options.\nThe ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/api/overview/#request-and-collection-budgets",
          children: "collection budgets"
        }), " apply."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Failed/incomplete discovery is an error. ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "Upgrade:"
        }), " the old own-namespace\nfallback on cluster-list errors has been removed to avoid a misleading subset.\nConfigure an explicit allowlist when namespace-list RBAC is not granted."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Every ", (0,jsx_runtime.jsx)(_components.code, {
        children: ":ns"
      }), " route below re-validates the namespace with\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "assertNamespaceAllowed()"
      }), " — a namespace outside the list is ", (0,jsx_runtime.jsx)(_components.code, {
        children: "403"
      }), ":"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{ \"error\": \"Namespace is outside the configured application scope\" }\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Allowlist checks also use no network. Responses, including errors, use\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "Cache-Control: no-store"
      }), ". Namespace names such as ", (0,jsx_runtime.jsx)(_components.code, {
        children: "constructor"
      }), " are looked up as\nown policy properties; intentionally absent/empty rules retain open access."]
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