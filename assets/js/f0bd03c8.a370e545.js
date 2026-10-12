"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["974"], {
1116(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_api_restart_consumers_mdx_f0b_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-api-restart-consumers-mdx-f0b.json
var site_docs_api_restart_consumers_mdx_f0b_namespaceObject = JSON.parse('{"id":"api/restart-consumers","title":"Restart Consumers API","description":"Restart workloads consuming a secret","source":"@site/docs/api/restart-consumers.mdx","sourceDirName":"api","slug":"/api/restart-consumers","permalink":"/api/restart-consumers","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":5,"frontMatter":{"sidebar_label":"Restart Consumers","sidebar_position":5},"sidebar":"api","previous":{"title":"Restore","permalink":"/api/restore"},"next":{"title":"Auth","permalink":"/api/auth"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
;// CONCATENATED MODULE: ./docs/api/restart-consumers.mdx


const frontMatter = {
	sidebar_label: 'Restart Consumers',
	sidebar_position: 5
};
const contentTitle = 'Restart Consumers API';

const assets = {

};



const toc = [{
  "value": "Restart workloads consuming a secret",
  "id": "restart-workloads-consuming-a-secret",
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
        id: "restart-consumers-api",
        children: "Restart Consumers API"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "restart-workloads-consuming-a-secret",
      children: "Restart workloads consuming a secret"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-http",
        children: "POST /api/namespaces/:namespace/secrets/:name/restart-consumers\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Triggers a rolling restart of the Deployments, StatefulSets, and DaemonSets in\nthe secret's namespace that reference it (env, envFrom, volumes, projected\nsources) by patching their pod template with a ", (0,jsx_runtime.jsx)(_components.code, {
        children: "krypton.io/restarted-at"
      }), "\nannotation. Required for env-var consumers; volume mounts sync via kubelet on\ntheir own."]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{\n  \"deployments\": [\"api-server\"],\n  \"statefulSets\": [],\n  \"daemonSets\": [],\n  \"note\": \"Some apps pick up secret changes automatically, others need a restart to see the new values.\"\n}\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Returns ", (0,jsx_runtime.jsx)(_components.code, {
          children: "403 { \"error\": \"Restarting apps is disabled on this deployment\" }"
        }), "\nunless ", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_RESTART_ENABLED=true"
        }), " (which also needs the ", (0,jsx_runtime.jsx)(_components.code, {
          children: "apps"
        }), " RBAC rule)."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "Same namespace, managed-only, and authz gates as updating the secret."
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "The restart is audit-logged with the targeted workload names."
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["See ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/consumer-restarts/",
        children: "Consumer Restarts"
      }), " for the scanning rules and\nthe sandbox walkthrough."]
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