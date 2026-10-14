"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["424"], {
4024(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_guides_deploy_kubernetes_mdx_1fb_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-guides-deploy-kubernetes-mdx-1fb.json
var site_docs_guides_deploy_kubernetes_mdx_1fb_namespaceObject = JSON.parse('{"id":"guides/deploy-kubernetes","title":"Deploy to Kubernetes","description":"Manifests live in app/k8s/. Two topologies: namespace-scoped (default, least","source":"@site/docs/guides/deploy-kubernetes.mdx","sourceDirName":"guides","slug":"/guides/deploy-kubernetes","permalink":"/guides/deploy-kubernetes","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":2,"frontMatter":{"sidebar_label":"Deploy to Kubernetes","sidebar_position":2},"sidebar":"guides","previous":{"title":"Sandbox","permalink":"/guides/sandbox"},"next":{"title":"Deploy with Helm","permalink":"/guides/deploy-helm"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
;// CONCATENATED MODULE: ./docs/guides/deploy-kubernetes.mdx


const frontMatter = {
	sidebar_label: 'Deploy to Kubernetes',
	sidebar_position: 2
};
const contentTitle = 'Deploy to Kubernetes';

const assets = {

};



const toc = [{
  "value": "Namespace scope (default)",
  "id": "namespace-scope-default",
  "level": 2
}, {
  "value": "Cluster scope (multi-namespace dashboard)",
  "id": "cluster-scope-multi-namespace-dashboard",
  "level": 2
}, {
  "value": "Enabling &quot;Restart apps&quot;",
  "id": "enabling-restart-apps",
  "level": 2
}, {
  "value": "Container image",
  "id": "container-image",
  "level": 2
}, {
  "value": "Prefer Helm?",
  "id": "prefer-helm",
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
    table: "table",
    tbody: "tbody",
    td: "td",
    th: "th",
    thead: "thead",
    tr: "tr",
    ...(0,lib/* .useMDXComponents */.R)(),
    ...props.components
  };
  return (0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
    children: [(0,jsx_runtime.jsx)(_components.header, {
      children: (0,jsx_runtime.jsx)(_components.h1, {
        id: "deploy-to-kubernetes",
        children: "Deploy to Kubernetes"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Manifests live in ", (0,jsx_runtime.jsx)(_components.code, {
        children: "app/k8s/"
      }), ". Two topologies: namespace-scoped (default, least\nprivilege) or cluster-wide (centralized multi-namespace dashboard)."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "namespace-scope-default",
      children: "Namespace scope (default)"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "kubectl apply -f app/k8s/namespace.yaml -f app/k8s/serviceaccount.yaml -f app/k8s/role.yaml\nkubectl apply -f app/k8s/configmap-access.yaml -f app/k8s/configmap-app.yaml\n# real secrets — never commit values:\nkubectl create secret generic k8ston-oidc -n k8ston \\\n  --from-literal=OIDC_CLIENT_SECRET='...' \\\n  --from-literal=SESSION_SECRET=\"$(openssl rand -hex 32)\"\nkubectl apply -f app/k8s/deployment.yaml\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "What you get:"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Manifest"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Purpose"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "namespace.yaml"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "k8ston"
            }), " namespace"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "serviceaccount.yaml"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "k8ston"
            }), " ServiceAccount (the identity that calls the K8s API)"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "role.yaml"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "secrets"
            }), " full verbs + ", (0,jsx_runtime.jsx)(_components.code, {
              children: "configmaps"
            }), " read, own namespace only"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "configmap-app.yaml"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Non-secret app config (", (0,jsx_runtime.jsx)(_components.code, {
              children: "K8STON_*"
            }), ", ", (0,jsx_runtime.jsx)(_components.code, {
              children: "OIDC_*"
            }), ", ", (0,jsx_runtime.jsx)(_components.code, {
              children: "NEXT_PUBLIC_*"
            }), ")"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "configmap-access.yaml"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Namespace fallback rules (", (0,jsx_runtime.jsx)(_components.code, {
              children: "access.json"
            }), ")"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "secret-oidc.yaml"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Template for ", (0,jsx_runtime.jsx)(_components.code, {
              children: "k8ston-oidc"
            }), " (create with real values instead)"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "deployment.yaml"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["App deployment (non-root ", (0,jsx_runtime.jsx)(_components.code, {
              children: "65532"
            }), ", read-only root FS, port 3000)"]
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Then expose via Ingress/Route with TLS and register the OIDC redirect URI\n(", (0,jsx_runtime.jsx)(_components.code, {
        children: "https://<host>/api/auth/callback"
      }), ")."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Liveness and readiness probes hit ", (0,jsx_runtime.jsx)(_components.code, {
        children: "/api/config"
      }), " — unauthenticated and free of\nK8s/OIDC calls, so it is safe to probe (the Helm chart probes the same endpoint)."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "cluster-scope-multi-namespace-dashboard",
      children: "Cluster scope (multi-namespace dashboard)"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Set ", (0,jsx_runtime.jsx)(_components.code, {
        children: "K8STON_SCOPE=cluster"
      }), " in ", (0,jsx_runtime.jsx)(_components.code, {
        children: "configmap-app.yaml"
      }), ", apply ", (0,jsx_runtime.jsx)(_components.code, {
        children: "clusterrole.yaml"
      }), "\n(instead of, or in addition to, ", (0,jsx_runtime.jsx)(_components.code, {
        children: "role.yaml"
      }), "), and optionally narrow with\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "K8STON_NAMESPACES=\"team-a,team-b\""
      }), ":"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "kubectl apply -f app/k8s/clusterrole.yaml\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The ClusterRole adds ", (0,jsx_runtime.jsx)(_components.code, {
        children: "namespaces"
      }), " (get, list, watch) on top of the namespace\npermissions. A configured ", (0,jsx_runtime.jsx)(_components.code, {
        children: "K8STON_NAMESPACES"
      }), " allowlist resolves/checks locally\nwithout namespace-list calls, so curated deployments can instead grant resource\npermissions in just those namespaces. Without an allowlist, failed/incomplete\nnamespace discovery returns an error; it no longer falls back to the pod namespace."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "enabling-restart-apps",
      children: "Enabling \"Restart apps\""
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The feature is disabled by default (least privilege). To enable it, do ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "both"
      }), ":"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.ol, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Set ", (0,jsx_runtime.jsx)(_components.code, {
          children: "K8STON_RESTART_ENABLED: 'true'"
        }), " in ", (0,jsx_runtime.jsx)(_components.code, {
          children: "configmap-app.yaml"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Uncomment the ", (0,jsx_runtime.jsx)(_components.code, {
          children: "apps"
        }), " rule (deployments/statefulsets/daemonsets: get, list,\nwatch, patch) in ", (0,jsx_runtime.jsx)(_components.code, {
          children: "role.yaml"
        }), " (or ", (0,jsx_runtime.jsx)(_components.code, {
          children: "clusterrole.yaml"
        }), ")."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Without the flag, the UI button + hint are hidden and the API returns 403.\nWithout the RBAC rule, the API fails closed at the Kubernetes API."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "container-image",
      children: "Container image"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The ", (0,jsx_runtime.jsx)(_components.code, {
        children: "Dockerfile"
      }), " (repo root, pnpm workspace context) builds\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "ghcr.io/egose/k8ston:<tag>"
      }), " — published on ", (0,jsx_runtime.jsx)(_components.code, {
        children: "v*.*.*"
      }), " tags by the\n", (0,jsx_runtime.jsx)(_components.em, {
        children: "Publish Docker image"
      }), " workflow:"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "docker build -t k8ston:sandbox -f Dockerfile .\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The image runs the Next.js standalone server (", (0,jsx_runtime.jsx)(_components.code, {
        children: "node app/server.js"
      }), ") as UID\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "65532"
      }), " on port 3000, matching ", (0,jsx_runtime.jsx)(_components.code, {
        children: "app/k8s/deployment.yaml"
      }), ". K8ston is stateless\n(all state lives in Kubernetes Secrets), so more than one replica is always safe."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "prefer-helm",
      children: "Prefer Helm?"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/deploy-helm/",
        children: "Helm guide"
      }), " covers the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "helm/main"
      }), " chart\n(", (0,jsx_runtime.jsx)(_components.code, {
        children: "helm/k8ston"
      }), " subchart, NetworkPolicy, OpenShift Routes). Prefer raw manifests\nwhen you want minimal moving parts; prefer Helm when you want templated RBAC\nscope, restart wiring, and access config in one values file."]
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