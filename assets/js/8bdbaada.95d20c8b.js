"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["717"], {
5750(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_api_versions_mdx_8bd_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-api-versions-mdx-8bd.json
var site_docs_api_versions_mdx_8bd_namespaceObject = JSON.parse('{"id":"api/versions","title":"Versions API","description":"List versions","source":"@site/docs/api/versions.mdx","sourceDirName":"api","slug":"/api/versions","permalink":"/api/versions","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":3,"frontMatter":{"sidebar_label":"Versions","sidebar_position":3},"sidebar":"api","previous":{"title":"Secrets","permalink":"/api/secrets"},"next":{"title":"Restore","permalink":"/api/restore"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
;// CONCATENATED MODULE: ./docs/api/versions.mdx


const frontMatter = {
	sidebar_label: 'Versions',
	sidebar_position: 3
};
const contentTitle = 'Versions API';

const assets = {

};



const toc = [{
  "value": "List versions",
  "id": "list-versions",
  "level": 2
}];
function _createMdxContent(props) {
  const _components = {
    a: "a",
    code: "code",
    h1: "h1",
    h2: "h2",
    header: "header",
    p: "p",
    pre: "pre",
    ...(0,lib/* .useMDXComponents */.R)(),
    ...props.components
  };
  return (0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
    children: [(0,jsx_runtime.jsx)(_components.header, {
      children: (0,jsx_runtime.jsx)(_components.h1, {
        id: "versions-api",
        children: "Versions API"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "list-versions",
      children: "List versions"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-http",
        children: "GET /api/namespaces/:namespace/secrets/:name/versions\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Same namespace, managed-only, and authz gates as reading the secret — history\nis only visible to readers of the live object."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{\n  \"namespace\": \"krypton-test\",\n  \"name\": \"database-credentials\",\n  \"versions\": [\n    {\n      \"version\": 2,\n      \"snapshotName\": \"database-credentials-v2\",\n      \"snapshotAt\": \"2026-01-05T09:30:00Z\",\n      \"snapshotBy\": \"alice@company.com\",\n      \"keys\": [\"DATABASE_URL\"],\n      \"data\": { \"DATABASE_URL\": \"postgres://…\" }\n    }\n  ]\n}\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Versions sort newest-first and are pruned to ", (0,jsx_runtime.jsx)(_components.code, {
        children: "KRYPTON_HISTORY_LIMIT"
      }), "\n(default 20). Each entry is a real Kubernetes Secret\n(", (0,jsx_runtime.jsx)(_components.code, {
        children: "<name>-vN"
      }), ", labeled ", (0,jsx_runtime.jsx)(_components.code, {
        children: "krypton.io/kind=history"
      }), ") with decoded ", (0,jsx_runtime.jsx)(_components.code, {
        children: "data"
      }), " —\ninspectable via ", (0,jsx_runtime.jsx)(_components.code, {
        children: "kubectl"
      }), " as well as the API."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["See ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/versioning-history/",
        children: "Versioning & History"
      }), " for the snapshot model\nand ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/api/restore/",
        children: "Restore"
      }), " for rolling back."]
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