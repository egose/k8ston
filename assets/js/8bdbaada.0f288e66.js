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
    strong: "strong",
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
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Same live-object visibility and authorization gates as reading the secret —\nhistory is only visible to readers of the ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "current live object"
      }), ". ", (0,jsx_runtime.jsx)(_components.code, {
        children: ":name"
      }), " must\nbe its live name: a snapshot name returns 404 in both managed-only modes, even\nfor admins. Copied historical ACLs cannot grant access after live ACL revocation.\nOnly validated immutable snapshots bound to this live ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "UID"
      }), " are returned. A\nsame-name replacement cannot read a predecessor's retained history. Unbound legacy\nand malformed snapshots are quarantined, including from admin access through this\nAPI; see the ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/versioning-history/#upgrade-and-operator-reviewed-recovery",
        children: "upgrade/recovery guide"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{\n  \"namespace\": \"krypton-test\",\n  \"name\": \"database-credentials\",\n  \"versions\": [\n    {\n      \"version\": 2,\n      \"snapshotName\": \"krypton-h-7b6ad742c31e4d37b5c8a90486d05a10-v2\",\n      \"snapshotAt\": \"2026-01-05T09:30:00Z\",\n      \"snapshotBy\": \"alice@company.com\",\n      \"keys\": [\"DATABASE_URL\"],\n      \"data\": { \"DATABASE_URL\": \"postgres://…\" },\n      \"binaryKeys\": [],\n      \"binaryData\": {}\n    }\n  ]\n}\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Versions sort by app counter descending. Each entry is a real immutable Opaque\nKubernetes Secret (", (0,jsx_runtime.jsx)(_components.code, {
        children: "krypton-h-<UID hash>-vN"
      }), ", labeled ", (0,jsx_runtime.jsx)(_components.code, {
        children: "krypton.io/kind=history"
      }), "),\nwith full source UID/resourceVersion/name/type annotations. Treat ", (0,jsx_runtime.jsx)(_components.code, {
        children: "snapshotName"
      }), "\nas an opaque returned identifier, not a name to reconstruct or use on live routes.\nThe response contains decoded DTOs, not internal raw/metadata storage records.\nResponse ", (0,jsx_runtime.jsx)(_components.code, {
        children: "data"
      }), " contains lossless text only; ", (0,jsx_runtime.jsx)(_components.code, {
        children: "binaryData"
      }), " holds\noriginal base64 for non-UTF-8/binary-control values, with names in ", (0,jsx_runtime.jsx)(_components.code, {
        children: "binaryKeys"
      }), ".\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "keys"
      }), " covers both maps. These use the same ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/api/secrets/",
        children: "data contract"
      }), " as the\nlive detail, and the UI offers masked, read-only base64 viewing/copying."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Restore uses the internal raw snapshot, not these decoded DTOs. Never construct\na plaintext PUT by dropping binary keys or pasting ", (0,jsx_runtime.jsx)(_components.code, {
        children: "binaryData"
      }), " into ", (0,jsx_runtime.jsx)(_components.code, {
        children: "data"
      }), "."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Retention is ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "1–100"
      }), " eligible snapshots per UID, default ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "20"
      }), ", applied during\nupdate/restore attempts. This endpoint does not truncate the inventory to hide a\ncleanup backlog. Failed cleanup can leave more records; failed live replacements\ncan leave pre-write snapshots, including one numbered like the current live state.\nHistory is not a complete log of successful commits or all external native edits.\nA failed Kubernetes list returns 503, not a misleading empty history. Every UID-bound\nhistory operation (including restore lookup, pruning, deletion, and final confirmation)\nuses the shared complete page reader. Raw inventories allow 1,000 objects / 160 MiB,\n100 objects per page and at most 100 pages. Metadata-only cleanup has an 8 MiB\nprojection budget and the same object/page caps, without visiting data values.\nOver-budget or malformed/repeated-token inventories fail explicitly; no partial\nhistory or guessed absence is returned. Full per-user options and UID selectors\nare preserved on every page. These are per-inventory application bounds, after SDK\nresponse decoding; see ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/api/overview/#request-and-collection-budgets",
        children: "collection budgets"
      }), ".\nThis value-bearing response and its errors send ", (0,jsx_runtime.jsx)(_components.code, {
        children: "Cache-Control: no-store"
      }), "."]
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