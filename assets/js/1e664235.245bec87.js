"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["516"], {
3100(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_guides_deploy_helm_mdx_1e6_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-guides-deploy-helm-mdx-1e6.json
var site_docs_guides_deploy_helm_mdx_1e6_namespaceObject = JSON.parse('{"id":"guides/deploy-helm","title":"Deploy with Helm","description":"The helm/main chart deploys K8ston via the helm/k8ston subchart, with","source":"@site/docs/guides/deploy-helm.mdx","sourceDirName":"guides","slug":"/guides/deploy-helm","permalink":"/guides/deploy-helm","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":3,"frontMatter":{"sidebar_label":"Deploy with Helm","sidebar_position":3},"sidebar":"guides","previous":{"title":"Deploy to Kubernetes","permalink":"/guides/deploy-kubernetes"},"next":{"title":"Configuration","permalink":"/guides/configuration"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.0_@docusaurus+types@3.10.0_@sw_d80ed93973d8fdb1b9e1067267ab632b/node_modules/@docusaurus/theme-classic/lib/theme/CodeBlock/index.js + 27 modules
var CodeBlock = __webpack_require__(4401);
;// CONCATENATED MODULE: ./node_modules/.pnpm/raw-loader@4.0.2_webpack@5.111.1_@swc+core@1.16.18_@swc+html@1.16.18_clean-css@5.3.3_cs_0a2048681882c260752bdc7655a466eb/node_modules/raw-loader/dist/cjs.js!./.samples/values-helm.yaml
/* export default */ const values_helm = ("# Minimal Helm values for K8ston (chart: helm/main, subchart: helm/k8ston).\n# Secret values (OIDC_CLIENT_SECRET, SESSION_SECRET) belong in a Kubernetes\n# Secret referenced by envSecretName — never in values files.\nglobal:\n  env: {}\n\nk8ston:\n  enabled: true\n  replicaCount: 2\n  # kubectl create secret generic k8ston-oidc -n k8ston \\\n  #   --from-literal=OIDC_CLIENT_SECRET='...' \\\n  #   --from-literal=SESSION_SECRET=\"$(openssl rand -hex 32)\"\n  envSecretName: k8ston-oidc\n  env:\n    K8STON_SCOPE: namespace\n    K8STON_ETCD_ENCRYPTED: 'false' # set 'true' once apiserver encryption is on\n    K8STON_ADMIN_GROUPS: k8ston-admin\n    OIDC_ISSUER: https://keycloak.example.com/realms/company\n    OIDC_CLIENT_ID: k8ston\n    OIDC_SCOPES: openid profile email groups\n    NEXT_PUBLIC_APP_URL: https://k8ston.example.com\n  # Derives the default K8STON_SCOPE (explicit entries must match):\n  # namespace (default) or cluster. Curated extras add a derived allowlist.\n  rbac:\n    create: true\n    scope: namespace\n  # \"Restart apps\" (API + UI + apps RBAC rule). Default false.\n  restartEnabled: false\n  # Namespace fallback rules (k8ston-access / access.json).\n  accessConfig:\n    enabled: false\n\nnetworkPolicy:\n  enabled: true\n  # MUST be true on OpenShift (routes arrive from openshift-ingress).\n  allowOpenShiftIngress: false\n");
;// CONCATENATED MODULE: ./docs/guides/deploy-helm.mdx


const frontMatter = {
	sidebar_label: 'Deploy with Helm',
	sidebar_position: 3
};
const contentTitle = 'Deploy with Helm';

const assets = {

};





const toc = [{
  "value": "Minimal values",
  "id": "minimal-values",
  "level": 2
}, {
  "value": "Key knobs",
  "id": "key-knobs",
  "level": 2
}, {
  "value": "RBAC scope",
  "id": "rbac-scope",
  "level": 2
}, {
  "value": "Restart + access config in one place",
  "id": "restart--access-config-in-one-place",
  "level": 2
}, {
  "value": "NetworkPolicy notes",
  "id": "networkpolicy-notes",
  "level": 2
}, {
  "value": "Installing with the chart Makefile",
  "id": "installing-with-the-chart-makefile",
  "level": 2
}, {
  "value": "OCI chart releases",
  "id": "oci-chart-releases",
  "level": 2
}, {
  "value": "Exposure and health",
  "id": "exposure-and-health",
  "level": 2
}, {
  "value": "Chart CI",
  "id": "chart-ci",
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
    pre: "pre",
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
        id: "deploy-with-helm",
        children: "Deploy with Helm"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The ", (0,jsx_runtime.jsx)(_components.code, {
        children: "helm/main"
      }), " chart deploys K8ston via the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "helm/k8ston"
      }), " subchart, with\ntemplated RBAC scope, restart wiring, access config, and NetworkPolicy."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "minimal-values",
      children: "Minimal values"
    }), "\n", "\n", (0,jsx_runtime.jsx)(CodeBlock/* ["default"] */.A, {
      language: "yaml",
      children: values_helm
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Create the referenced Secret out-of-band (never commit values):"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "kubectl create secret generic k8ston-oidc -n k8ston \\\n  --from-literal=OIDC_CLIENT_SECRET='...' \\\n  --from-literal=SESSION_SECRET=\"$(openssl rand -hex 32)\"\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "key-knobs",
      children: "Key knobs"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Value"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Purpose"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "k8ston.env"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Non-secret K8ston config (full reference: ", (0,jsx_runtime.jsx)(_components.code, {
              children: "app/.env.example"
            }), ")"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "k8ston.envSecretName"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["K8s Secret with ", (0,jsx_runtime.jsx)(_components.code, {
              children: "OIDC_CLIENT_SECRET"
            }), " + ", (0,jsx_runtime.jsx)(_components.code, {
              children: "SESSION_SECRET"
            })]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "k8ston.rbac.scope"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "namespace"
            }), " (default) or ", (0,jsx_runtime.jsx)(_components.code, {
              children: "cluster"
            }), " — the chart derives ", (0,jsx_runtime.jsx)(_components.code, {
              children: "K8STON_SCOPE"
            }), " from it (explicit entries must match)"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "k8ston.rbac.extraNamespaces"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Curated extra namespaces (namespace scope): Roles plus a derived ", (0,jsx_runtime.jsx)(_components.code, {
              children: "K8STON_NAMESPACES"
            }), " allowlist, no ClusterRole"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "k8ston.restartEnabled"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Single effective value wiring ", (0,jsx_runtime.jsx)(_components.code, {
              children: "K8STON_RESTART_ENABLED"
            }), " ", (0,jsx_runtime.jsx)(_components.strong, {
              children: "and"
            }), " the ", (0,jsx_runtime.jsx)(_components.code, {
              children: "apps"
            }), " RBAC rule together"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "k8ston.accessConfig.enabled"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Renders the access ConfigMap ", (0,jsx_runtime.jsx)(_components.strong, {
              children: "and"
            }), " derives ", (0,jsx_runtime.jsx)(_components.code, {
              children: "K8STON_ACCESS_CONFIGMAP"
            }), " from its name (", (0,jsx_runtime.jsx)(_components.code, {
              children: "access.json"
            }), " key)"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "k8ston.replicaCount"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Stateless — more than one replica is always safe (default 2)"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "k8ston.ingress.enabled"
            }), " / ", (0,jsx_runtime.jsx)(_components.code, {
              children: "route.enabled"
            }), " / ", (0,jsx_runtime.jsx)(_components.code, {
              children: "httpRoute.enabled"
            })]
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Expose via Ingress / OpenShift Route / Gateway API HTTPRoute"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "networkPolicy.enabled"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Locks down pod traffic (DNS + K8s API egress allowed)"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "networkPolicy.allowOpenShiftIngress"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsxs)(_components.strong, {
              children: ["Must be ", (0,jsx_runtime.jsx)(_components.code, {
                children: "true"
              }), " on OpenShift"]
            }), " (routes arrive from ", (0,jsx_runtime.jsx)(_components.code, {
              children: "openshift-ingress"
            }), ")"]
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["See ", (0,jsx_runtime.jsx)(_components.code, {
        children: "helm/main/values-example.yaml"
      }), " and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "helm/main/values-k8s-prod.example.yaml"
      }), "\nfor fuller examples, including topology spread and IdP egress CIDRs."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "rbac-scope",
      children: "RBAC scope"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["One effective configuration (", (0,jsx_runtime.jsx)(_components.code, {
        children: "k8ston.effectiveConfig"
      }), " in the subchart) derives\nthe chart-managed runtime env from the RBAC/feature values, so the rendered\nDeployment env, Role/ClusterRole scope, subjects, and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "apps"
      }), " permissions always\nagree. Local ", (0,jsx_runtime.jsx)(_components.code, {
        children: "k8ston.env"
      }), " wins over ", (0,jsx_runtime.jsx)(_components.code, {
        children: "global.env"
      }), " per key. Omit the managed keys\n(", (0,jsx_runtime.jsx)(_components.code, {
        children: "K8STON_SCOPE"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "K8STON_NAMESPACES"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "K8STON_RESTART_ENABLED"
      }), ",\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "K8STON_ACCESS_CONFIGMAP"
      }), ") to use the derived defaults; an explicit entry must\nequal the derived effective value, otherwise rendering fails with actionable\nguidance instead of deploying disagreeing runtime/RBAC behavior."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "namespace"
        }), ": own namespace only (least privilege, the default). The chart\nderives ", (0,jsx_runtime.jsx)(_components.code, {
          children: "K8STON_SCOPE=namespace"
        }), " and renders a Role + RoleBinding."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "namespace"
        }), " + ", (0,jsx_runtime.jsx)(_components.code, {
          children: "k8ston.rbac.extraNamespaces: [team-a]"
        }), ": curated\nmulti-namespace access. The chart renders a Role + RoleBinding pair per entry\n(subject stays this release's ServiceAccount) and derives\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "K8STON_SCOPE=cluster"
        }), " with the bounded allowlist\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "K8STON_NAMESPACES=<release-namespace>,team-a"
        }), " — served by these namespaced\nRoles only, no ClusterRole is rendered. Previously the extra Roles were\nunusable because the namespace runtime scope only exposed the pod namespace."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "cluster"
        }), ": centralized dashboard (", (0,jsx_runtime.jsx)(_components.code, {
          children: "K8STON_SCOPE=cluster"
        }), "); narrow with\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "K8STON_NAMESPACES=\"team-a,team-b\""
        }), " in ", (0,jsx_runtime.jsx)(_components.code, {
          children: "k8ston.env"
        }), ". ", (0,jsx_runtime.jsx)(_components.code, {
          children: "extraNamespaces"
        }), " is\nrejected with cluster scope."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "rbac.create: false"
        }), ": RBAC is managed out-of-band. Set ", (0,jsx_runtime.jsx)(_components.code, {
          children: "K8STON_SCOPE"
        }), " /\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "K8STON_NAMESPACES"
        }), " in ", (0,jsx_runtime.jsx)(_components.code, {
          children: "k8ston.env"
        }), " yourself to match your external grants\n(", (0,jsx_runtime.jsx)(_components.code, {
          children: "rbac.scope"
        }), "/", (0,jsx_runtime.jsx)(_components.code, {
          children: "extraNamespaces"
        }), " are then ignored), and grant the ", (0,jsx_runtime.jsx)(_components.code, {
          children: "apps"
        }), "\npermissions yourself to match ", (0,jsx_runtime.jsx)(_components.code, {
          children: "k8ston.restartEnabled"
        }), "."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "restart--access-config-in-one-place",
      children: "Restart + access config in one place"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Unlike the raw manifests (where the flag and the RBAC rule are separate manual\nsteps), the chart wires them together: ", (0,jsx_runtime.jsx)(_components.code, {
        children: "k8ston.restartEnabled"
      }), " is the single\neffective value driving ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "both"
      }), " the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "K8STON_RESTART_ENABLED"
      }), " runtime flag\n", (0,jsx_runtime.jsx)(_components.strong, {
        children: "and"
      }), " the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "apps"
      }), " RBAC rule (an explicit env entry must parse to the same\nvalue — runtime truthy strings are ", (0,jsx_runtime.jsx)(_components.code, {
        children: "1/true/yes/on"
      }), " — or rendering fails).\nSimilarly, ", (0,jsx_runtime.jsx)(_components.code, {
        children: "k8ston.accessConfig.enabled"
      }), " renders the namespace fallback\nConfigMap instead of applying ", (0,jsx_runtime.jsx)(_components.code, {
        children: "app/k8s/configmap-access.yaml"
      }), " by hand, ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "and"
      }), "\nderives ", (0,jsx_runtime.jsx)(_components.code, {
        children: "K8STON_ACCESS_CONFIGMAP"
      }), " from ", (0,jsx_runtime.jsx)(_components.code, {
        children: "accessConfig.name"
      }), " so the runtime\npolicy reader finds it. The key must stay ", (0,jsx_runtime.jsx)(_components.code, {
        children: "access.json"
      }), " (hardcoded by the\nreader); with ", (0,jsx_runtime.jsx)(_components.code, {
        children: "accessConfig.enabled: false"
      }), ", point ", (0,jsx_runtime.jsx)(_components.code, {
        children: "K8STON_ACCESS_CONFIGMAP"
      }), "\nat an externally managed ConfigMap. Each namespace entry accepts ", (0,jsx_runtime.jsx)(_components.code, {
        children: "groups"
      }), ",\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "users"
      }), ", and an optional ", (0,jsx_runtime.jsx)(_components.code, {
        children: "teams"
      }), " array (see\n", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/authorization/#teams",
        children: "Authorization"
      }), "); deploy the app before adding\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "teams"
      }), ", since older releases reject the unknown field. ", (0,jsx_runtime.jsx)(_components.code, {
        children: "extraEnv"
      }), " entries must\nnot set managed keys (they render last and would shadow the derived values)."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "networkpolicy-notes",
      children: "NetworkPolicy notes"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Pod DNS (UDP/TCP 53) is allowed for both upstream Kubernetes (", (0,jsx_runtime.jsx)(_components.code, {
          children: "kube-system"
        }), ")\nand OpenShift (", (0,jsx_runtime.jsx)(_components.code, {
          children: "openshift-dns"
        }), ")."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Egress to the Kubernetes API (", (0,jsx_runtime.jsx)(_components.code, {
          children: "https://kubernetes.default.svc"
        }), ", a ClusterIP)\nis allowed on ports 443/6443 via ", (0,jsx_runtime.jsx)(_components.code, {
          children: "allowKubeApiEgress"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Standard NetworkPolicy cannot match DNS names: add your IdP's CIDR ranges\nunder ", (0,jsx_runtime.jsx)(_components.code, {
          children: "networkPolicy.k8ston.idpEgressIpBlocks"
        }), " when you tighten API egress."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["On OpenShift, ", (0,jsx_runtime.jsx)(_components.code, {
          children: "allowOpenShiftIngress"
        }), " must be ", (0,jsx_runtime.jsx)(_components.code, {
          children: "true"
        }), " or all ingress is denied."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "installing-with-the-chart-makefile",
      children: "Installing with the chart Makefile"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "helm/main/Makefile"
      }), " wraps the standard flow. Secret values live in a\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "values-<namespace>.secret.yaml"
      }), " file (see ", (0,jsx_runtime.jsx)(_components.code, {
        children: "values-ai-poc.secret.yaml"
      }), " for the\nshape; never commit real ones):"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "cd helm/main\nmake upgrade NAMESPACE=k8ston IMAGE_TAG=0.1.0   # helm dependency update + upgrade --install\nmake lint NAMESPACE=k8ston IMAGE_TAG=0.1.0      # render + validate\nmake template NAMESPACE=k8ston IMAGE_TAG=0.1.0  # render to template.yaml\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The packaged subchart (", (0,jsx_runtime.jsx)(_components.code, {
        children: "helm/main/charts/k8ston-0.1.0.tgz"
      }), ") is refreshed by the\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "helm-dep"
      }), " step (", (0,jsx_runtime.jsx)(_components.code, {
        children: "helm dependency update"
      }), ") before every install, upgrade, lint,\nand template run."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "oci-chart-releases",
      children: "OCI chart releases"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Every ", (0,jsx_runtime.jsx)(_components.code, {
        children: "v*.*.*"
      }), " tag publishes the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "helm/k8ston"
      }), " chart to\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "oci://ghcr.io/egose/charts/k8ston"
      }), " (see the ", (0,jsx_runtime.jsx)(_components.em, {
        children: "Publish Helm chart"
      }), " workflow).\nChart ", (0,jsx_runtime.jsx)(_components.code, {
        children: "version"
      }), " and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "appVersion"
      }), " are both set from the release tag, so chart\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "1.2.3"
      }), " deploys app ", (0,jsx_runtime.jsx)(_components.code, {
        children: "1.2.3"
      }), " (", (0,jsx_runtime.jsx)(_components.code, {
        children: "ghcr.io/egose/k8ston:1.2.3"
      }), " by default —\noverride with ", (0,jsx_runtime.jsx)(_components.code, {
        children: "image.tag"
      }), ")."]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Install it directly, without the umbrella chart:"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "helm install k8ston oci://ghcr.io/egose/charts/k8ston --version 1.2.3 \\\n  --namespace k8ston --create-namespace\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Or consume it as a dependency (", (0,jsx_runtime.jsx)(_components.code, {
        children: "helm registry login ghcr.io"
      }), " first if the\npackage is private):"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-yaml",
        children: "# Chart.yaml\ndependencies:\n  - name: k8ston\n    version: '1.2.3'\n    repository: oci://ghcr.io/egose/charts\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-yaml",
        children: "# values.yaml\nk8ston:\n  enabled: true\n  env:\n    K8STON_SCOPE: namespace\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["See ", (0,jsx_runtime.jsx)(_components.code, {
        children: "helm/k8ston/README.md"
      }), " for the full values reference (image, exposure,\nautoscaling, PDB, security contexts, extra volumes)."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "exposure-and-health",
      children: "Exposure and health"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["One of ", (0,jsx_runtime.jsx)(_components.code, {
          children: "ingress"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "route"
        }), " (OpenShift), or ", (0,jsx_runtime.jsx)(_components.code, {
          children: "httpRoute"
        }), " (Gateway API) exposes\nthe ClusterIP Service — enable exactly what your platform provides."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Liveness and readiness probes hit ", (0,jsx_runtime.jsx)(_components.code, {
          children: "/api/config"
        }), ": unauthenticated and\nK8s/OIDC-free, so it is safe to probe (the raw manifests in ", (0,jsx_runtime.jsx)(_components.code, {
          children: "app/k8s/"
        }), "\nprobe the same endpoint)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["The ServiceAccount token ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "must"
        }), " stay auto-mounted\n(", (0,jsx_runtime.jsx)(_components.code, {
          children: "serviceAccount.automount: true"
        }), ") — K8ston talks to the Kubernetes API\nwith its own token."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "chart-ci",
      children: "Chart CI"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The ", (0,jsx_runtime.jsx)(_components.em, {
        children: "Helm"
      }), " workflow lints both charts and templates them on every ", (0,jsx_runtime.jsx)(_components.code, {
        children: "helm/**"
      }), "\nchange, including a full-flag matrix for the subchart (cluster scope,\nrestart, ingress + route + HTTPRoute, access config, autoscaling, PDB,\nexternal ServiceAccount) and both umbrella example values files. It also runs\nthe rendered-object regressions in ", (0,jsx_runtime.jsx)(_components.code, {
        children: "helm/k8ston/tests/render-regressions.sh"
      }), "\n(default, cluster, curated namespaces, local/global conflicts, false\noverrides, external RBAC, custom access config, and every contradiction\nerror). Run the same locally with ", (0,jsx_runtime.jsx)(_components.code, {
        children: "helm lint"
      }), " / ", (0,jsx_runtime.jsx)(_components.code, {
        children: "helm template"
      }), " and the\nregression script before opening a PR."]
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

}]);