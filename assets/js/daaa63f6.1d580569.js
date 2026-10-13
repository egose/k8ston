"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["798"], {
327(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_api_restore_mdx_daa_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-api-restore-mdx-daa.json
var site_docs_api_restore_mdx_daa_namespaceObject = JSON.parse('{"id":"api/restore","title":"Restore API","description":"Restore a version","source":"@site/docs/api/restore.mdx","sourceDirName":"api","slug":"/api/restore","permalink":"/api/restore","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":4,"frontMatter":{"sidebar_label":"Restore","sidebar_position":4},"sidebar":"api","previous":{"title":"Versions","permalink":"/api/versions"},"next":{"title":"Restart Consumers","permalink":"/api/restart-consumers"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
;// CONCATENATED MODULE: ./docs/api/restore.mdx


const frontMatter = {
	sidebar_label: 'Restore',
	sidebar_position: 4
};
const contentTitle = 'Restore API';

const assets = {

};



const toc = [{
  "value": "Restore a version",
  "id": "restore-a-version",
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
        id: "restore-api",
        children: "Restore API"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "restore-a-version",
      children: "Restore a version"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-http",
        children: "POST /api/namespaces/:namespace/secrets/:name/restore\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{ \"version\": 1, \"resourceVersion\": \"123456\" }\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "version"
        }), " is the app-level ", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton.io/version"
        }), " number from the\n", (0,jsx_runtime.jsx)(_components.a, {
          href: "/api/versions/",
          children: "versions list"
        }), " (positive integer, required)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "resourceVersion"
        }), " is the ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "required"
        }), ", nonblank opaque revision from the loaded\n", (0,jsx_runtime.jsx)(_components.strong, {
          children: "live"
        }), " Secret. Missing/invalid input returns 400. After current live\nauthorization, a mismatch returns ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "409 before history reads, snapshots, pruning,\nor live writes"
        }), ". A terminating live Secret also returns 409 before history access."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["The target must be a validated immutable snapshot bound to the current live\n", (0,jsx_runtime.jsx)(_components.strong, {
          children: "UID"
        }), ". Predecessor lifetimes and unbound legacy snapshots are never adopted by\nname; their recovery requires ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/versioning-history/#upgrade-and-operator-reviewed-recovery",
          children: "operator review"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Validates the target data against the ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "live"
        }), " type and immutable state before\nany snapshot/write. Then snapshots the ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "current"
        }), " state so the restore itself\nis reversible, and replaces the live object with the target snapshot's data (bumping\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton.io/version"
        }), " again, stamped with the restoring user)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Copies ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "raw base64"
        }), " byte-for-byte, including binary and special-key values;\nit never decodes/re-encodes through text. Live UID, owner references, finalizers,\nimmutable state, type, description, and ACLs are retained. Snapshot lifecycle\nmetadata/type is not adopted."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "Immutable Secrets reject changed bytes/keys with 422 before side effects.\nByte-identical restores are allowed by the API; UI restores are disabled for\nimmutable Secrets. Create a new Secret to change immutable data."
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "Controller-owned service-account token restores and invalid built-in type data\nreturn 422 before snapshots or mutation; use TokenRequest/controller management\nfor service-account tokens."
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "Same namespace, managed-only, and authz gates as updating the secret.\nAuthorization uses the current live ACL, never a snapshot's historical rules.\nSnapshot names themselves return 404 on live routes."
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Answers ", (0,jsx_runtime.jsx)(_components.code, {
          children: "{ \"secret\": SecretDetail }"
        }), " with text ", (0,jsx_runtime.jsx)(_components.code, {
          children: "data"
        }), " and base64 ", (0,jsx_runtime.jsx)(_components.code, {
          children: "binaryData"
        }), "\nfor the restored live object (see ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/api/secrets/",
          children: "Secrets API"
        }), ")."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "404"
        }), " when no eligible UID-bound snapshot exists for the requested version."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "409"
        }), " if the expected revision is stale, the live object is terminating, the\ncurrent-state snapshot slot cannot be verified as the same source\nUID/resourceVersion and actual immutable content, or the live replacement races\nanother write. ", (0,jsx_runtime.jsx)(_components.code, {
          children: "503"
        }), " if snapshot creation or required pruning fails. Failed or\npending pruning blocks replacement and can leave a saved source snapshot."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Snapshot and pruning operations are non-atomic with the live replacement;\nolder history may already have been pruned if the later replacement fails.\nThe handler rechecks the authorized live UID/resourceVersion after reading the\ntarget, then saves the current state. Replacement carries the original ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "live\nUID and resourceVersion"
        }), ", so a later ACL/data change or same-name replacement\nconflicts at Kubernetes CAS. Rechecks are not a cross-object lock; earlier\nsnapshot/pruning effects can survive the conflict."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.strong, {
        children: "Upgrade:"
      }), " older ", (0,jsx_runtime.jsx)(_components.code, {
        children: "{ \"version\": N }"
      }), " requests now fail with 400. Send both fields\nfrom the reviewed live/history state. On 409, ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "Reload latest"
      }), " fetches actual live\nand history queries and closes the dialog only after both succeed; review and\nconfirm again. Failed reloads keep the error visible. Success immediately installs\nthe returned live detail/revision and refreshes history and the namespace list.\nNo automatic restore retry is performed with a silently updated revision."]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "curl --cookie \"krypton_session=$ALICE\" -X POST \\\n  -H 'Content-Type: application/json' -d '{\"version\":1,\"resourceVersion\":\"123456\"}' \\\n  localhost:3000/api/namespaces/krypton-test/secrets/database-credentials/restore\n"
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