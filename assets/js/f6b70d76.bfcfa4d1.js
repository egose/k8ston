"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["868"], {
2860(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_guides_consumer_restarts_mdx_f6b_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-guides-consumer-restarts-mdx-f6b.json
var site_docs_guides_consumer_restarts_mdx_f6b_namespaceObject = JSON.parse('{"id":"guides/consumer-restarts","title":"Consumer Restarts","description":"Editing a Secret does not automatically update the pods that consume it:","source":"@site/docs/guides/consumer-restarts.mdx","sourceDirName":"guides","slug":"/guides/consumer-restarts","permalink":"/guides/consumer-restarts","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":8,"frontMatter":{"sidebar_label":"Consumer Restarts","sidebar_position":8},"sidebar":"guides","previous":{"title":"Versioning & History","permalink":"/guides/versioning-history"},"next":{"title":"Troubleshooting","permalink":"/guides/troubleshooting"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
;// CONCATENATED MODULE: ./docs/guides/consumer-restarts.mdx


const frontMatter = {
	sidebar_label: 'Consumer Restarts',
	sidebar_position: 8
};
const contentTitle = 'Consumer Restarts';

const assets = {

};



const toc = [{
  "value": "Enabling the feature",
  "id": "enabling-the-feature",
  "level": 2
}, {
  "value": "What it scans",
  "id": "what-it-scans",
  "level": 2
}, {
  "value": "Trying it in the sandbox",
  "id": "trying-it-in-the-sandbox",
  "level": 2
}, {
  "value": "API contract",
  "id": "api-contract",
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
    ol: "ol",
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
        id: "consumer-restarts",
        children: "Consumer Restarts"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Editing a Secret does not automatically update the pods that consume it:"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Volume-mounted"
        }), " secrets sync automatically (kubelet delay, no action needed)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Environment-variable"
        }), " secrets are frozen at container start — those pods\nneed a rollout to see new values."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.em, {
        children: "Restart apps"
      }), " closes that gap: it finds the workloads referencing a secret and\ntriggers a rolling restart by patching their pod template with a\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "krypton.io/restarted-at"
      }), " annotation."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "enabling-the-feature",
      children: "Enabling the feature"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Disabled by default (least privilege). Enabling takes ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "both"
      }), " steps:"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.ol, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Set ", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_RESTART_ENABLED=true"
        }), " (or ", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton.restartEnabled: true"
        }), " in Helm,\nwhich also renders the RBAC rule)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Grant the ", (0,jsx_runtime.jsx)(_components.code, {
          children: "apps"
        }), " rule in ", (0,jsx_runtime.jsx)(_components.code, {
          children: "role.yaml"
        }), " / ", (0,jsx_runtime.jsx)(_components.code, {
          children: "clusterrole.yaml"
        }), " (ships commented out):"]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-yaml",
        children: "- apiGroups: [apps]\n  resources: [deployments, statefulsets, daemonsets]\n  verbs: [get, list, watch, patch]\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Without the flag, the UI button + hint are hidden and the API returns 403.\nWithout the rule, the API fails closed at the Kubernetes API."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "what-it-scans",
      children: "What it scans"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "In the secret's namespace, Krypton inspects Deployments, StatefulSets, and\nDaemonSets for references to the secret name across:"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsx)(_components.li, {
        children: (0,jsx_runtime.jsx)(_components.code, {
          children: "env[].valueFrom.secretKeyRef.name"
        })
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: (0,jsx_runtime.jsx)(_components.code, {
          children: "envFrom[].secretRef.name"
        })
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: (0,jsx_runtime.jsx)(_components.code, {
          children: "volumes[].secret.secretName"
        })
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Projected sources and friends via a conservative JSON string-scan fallback\n(", (0,jsx_runtime.jsx)(_components.code, {
          children: "\"secretName\":\"<name>\""
        }), " plus a name containment check)"]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Matching workloads are patched (strategic-merge on the pod template metadata)\nand reported back grouped by kind:"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{\n  \"deployments\": [\"api-server\"],\n  \"statefulSets\": [],\n  \"daemonSets\": [],\n  \"note\": \"Some apps pick up secret changes automatically, others need a restart to see the new values.\"\n}\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "trying-it-in-the-sandbox",
      children: "Trying it in the sandbox"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The sandbox sets ", (0,jsx_runtime.jsx)(_components.code, {
        children: "KRYPTON_RESTART_ENABLED=true"
      }), " and ships an ", (0,jsx_runtime.jsx)(_components.code, {
        children: "api-server"
      }), "\nDeployment consuming ", (0,jsx_runtime.jsx)(_components.code, {
        children: "database-credentials"
      }), " via env and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "feature-flags"
      }), " via volume:"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.ol, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Edit ", (0,jsx_runtime.jsx)(_components.code, {
          children: "database-credentials"
        }), " in the UI and hit ", (0,jsx_runtime.jsx)(_components.em, {
          children: "Restart apps"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "kubectl rollout history deploy/api-server -n krypton-test"
        }), " shows a new\nrevision with the fresh env value."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "api-contract",
      children: "API contract"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "POST /api/namespaces/:namespace/secrets/:name/restart-consumers"
      }), " — same\nnamespace, managed-only, and authz gates as every other secret route, plus the\nfeature flag. See the ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/api/restart-consumers/",
        children: "Restart API"
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