"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["909"], {
4826(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_guides_versioning_history_mdx_8bd_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-guides-versioning-history-mdx-8bd.json
var site_docs_guides_versioning_history_mdx_8bd_namespaceObject = JSON.parse('{"id":"guides/versioning-history","title":"Versioning & History","description":"Kubernetes overwrites Secrets in place. Krypton keeps the past anyway: before","source":"@site/docs/guides/versioning-history.mdx","sourceDirName":"guides","slug":"/guides/versioning-history","permalink":"/guides/versioning-history","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":7,"frontMatter":{"sidebar_label":"Versioning & History","sidebar_position":7},"sidebar":"guides","previous":{"title":"Authorization","permalink":"/guides/authorization"},"next":{"title":"Consumer Restarts","permalink":"/guides/consumer-restarts"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
;// CONCATENATED MODULE: ./docs/guides/versioning-history.mdx


const frontMatter = {
	sidebar_label: 'Versioning & History',
	sidebar_position: 7
};
const contentTitle = 'Versioning & History';

const assets = {

};



const toc = [{
  "value": "How snapshots work",
  "id": "how-snapshots-work",
  "level": 2
}, {
  "value": "Restores are reversible",
  "id": "restores-are-reversible",
  "level": 2
}, {
  "value": "Optimistic concurrency (409s)",
  "id": "optimistic-concurrency-409s",
  "level": 2
}, {
  "value": "Size guard (1 MiB)",
  "id": "size-guard-1-mib",
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
        id: "versioning--history",
        children: "Versioning & History"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Kubernetes overwrites Secrets in place. Krypton keeps the past anyway: before\nevery write it snapshots the previous state into a separate Secret, so\nrollbacks are one click and every restore is reversible."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "how-snapshots-work",
      children: "How snapshots work"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Every live secret carries ", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton.io/version"
        }), " (app counter, starts at 1)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Before an update, the current state is persisted as ", (0,jsx_runtime.jsx)(_components.code, {
          children: "<name>-vN"
        }), " with labels\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton.io/history-of=<name>"
        }), " / ", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton.io/kind=history"
        }), " and annotations\nfor version, ", (0,jsx_runtime.jsx)(_components.code, {
          children: "snapshot-at"
        }), " timestamp, ", (0,jsx_runtime.jsx)(_components.code, {
          children: "snapshot-by"
        }), " actor, plus the live\ndescription and access rules at snapshot time."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Snapshots are pruned to ", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_HISTORY_LIMIT"
        }), " (default 20, newest kept)."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "Snapshot name length is capped to the 253-char K8s limit (base trimmed)."
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Deleting a secret deletes its snapshots too, unless ", (0,jsx_runtime.jsx)(_components.code, {
          children: "?keepHistory=true"
        }), "."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Inspect them directly — they are ordinary Secrets:"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "kubectl get secret -n krypton-test -l krypton.io/kind=history\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "restores-are-reversible",
      children: "Restores are reversible"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Restore snapshots the ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "current"
      }), " state first, then replaces the live object\nwith the target version's data (bumping ", (0,jsx_runtime.jsx)(_components.code, {
        children: "krypton.io/version"
      }), " again). Rolling\nback never destroys the state you rolled back from — within the history limit."]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "curl --cookie \"krypton_session=$ALICE\" \\\n  localhost:3000/api/namespaces/krypton-test/secrets/database-credentials/versions\ncurl --cookie \"krypton_session=$ALICE\" -X POST \\\n  -H 'Content-Type: application/json' -d '{\"version\":1}' \\\n  localhost:3000/api/namespaces/krypton-test/secrets/database-credentials/restore\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "optimistic-concurrency-409s",
      children: "Optimistic concurrency (409s)"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The UI sends back the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "metadata.resourceVersion"
      }), " it loaded; if the live object\nmoved on, the write is rejected with ", (0,jsx_runtime.jsx)(_components.code, {
        children: "409"
      }), " and a reload prompt instead of\nsilently clobbering a colleague's change. A second 409 path covers a true race\nbetween the read and the replace at the Kubernetes API."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Try it: open the same secret's edit page in two tabs, save both — the second\nsave gets the conflict prompt. See ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/api/secrets/",
        children: "Update secret"
      }), " for the API\ncontract."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "size-guard-1-mib",
      children: "Size guard (1 MiB)"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["K8s enforces ~1 MiB per Secret object. Krypton estimates conservatively\n(UTF-8 bytes × 1.4 for base64 inflation) and enforces the limit client-side\n(the form meter blocks) and server-side (", (0,jsx_runtime.jsx)(_components.code, {
        children: "413 Secret is too large"
      }), "). History\nsnapshots count as separate objects, so deep history never breaks the live write."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "related-pages",
      children: "Related pages"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/api/versions/",
          children: "Versions API"
        }), " and ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/api/restore/",
          children: "Restore API"
        })]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/api/secrets/",
          children: "Secrets API"
        }), " for create/update/delete semantics"]
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