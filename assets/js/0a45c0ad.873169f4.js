"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["594"], {
8253(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_guides_authorization_mdx_0a4_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-guides-authorization-mdx-0a4.json
var site_docs_guides_authorization_mdx_0a4_namespaceObject = JSON.parse('{"id":"guides/authorization","title":"Authorization","description":"SSO proves who you are; per-secret annotations and one namespace-level","source":"@site/docs/guides/authorization.mdx","sourceDirName":"guides","slug":"/guides/authorization","permalink":"/guides/authorization","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":6,"frontMatter":{"sidebar_label":"Authorization","sidebar_position":6},"sidebar":"guides","previous":{"title":"Authentication","permalink":"/guides/authentication"},"next":{"title":"Versioning & History","permalink":"/guides/versioning-history"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.0_@docusaurus+types@3.10.0_@sw_d80ed93973d8fdb1b9e1067267ab632b/node_modules/@docusaurus/theme-classic/lib/theme/CodeBlock/index.js + 27 modules
var CodeBlock = __webpack_require__(4401);
;// CONCATENATED MODULE: ./node_modules/.pnpm/raw-loader@4.0.2_webpack@5.111.1_@swc+core@1.16.18_@swc+html@1.16.18_clean-css@5.3.3_cs_0a2048681882c260752bdc7655a466eb/node_modules/raw-loader/dist/cjs.js!./.samples/secret-annotated.yaml
/* export default */ const secret_annotated = ("# What a Krypton-managed Secret looks like in etcd.\n# Per-secret annotations override the namespace fallback in krypton-access.\napiVersion: v1\nkind: Secret\nmetadata:\n  name: database-credentials\n  namespace: krypton-test\n  labels:\n    krypton.io/managed-by: krypton\n  annotations:\n    krypton.io/managed-by: krypton\n    krypton.io/version: '3'\n    krypton.io/description: Primary database credentials\n    krypton.io/allowed-groups: dev-team, database-admins\n    krypton.io/allowed-users: alice@company.com\n    krypton.io/last-modified-by: alice@company.com\ntype: Opaque\ndata:\n  DATABASE_URL: cG9zdGdyZXM6Ly9kYjppbmZyYS1vbmx5QGtleXM= # illustrative base64, never plaintext # pragma: allowlist secret\n  DB_PASSWORD: czNjcjN0LW9ubHktaW4tZXhj bXBsZXM= # pragma: allowlist secret\n");
;// CONCATENATED MODULE: ./node_modules/.pnpm/raw-loader@4.0.2_webpack@5.111.1_@swc+core@1.16.18_@swc+html@1.16.18_clean-css@5.3.3_cs_0a2048681882c260752bdc7655a466eb/node_modules/raw-loader/dist/cjs.js!./.samples/access-config.json.txt
/* export default */ const access_config_json = ("{\n  \"frontend-ns\": {\n    \"groups\": [\"AzureAD-Frontend-Team\"],\n    \"users\": []\n  },\n  \"production\": {\n    \"groups\": [\"dev-team\", \"database-admins\"],\n    \"users\": [\"alice@company.com\"]\n  }\n}\n");
;// CONCATENATED MODULE: ./docs/guides/authorization.mdx


const frontMatter = {
	sidebar_label: 'Authorization',
	sidebar_position: 6
};
const contentTitle = 'Authorization';

const assets = {

};






const toc = [{
  "value": "Decision order",
  "id": "decision-order",
  "level": 2
}, {
  "value": "Per-secret annotations",
  "id": "per-secret-annotations",
  "level": 2
}, {
  "value": "Namespace fallback (<code>access.json</code>)",
  "id": "namespace-fallback-accessjson",
  "level": 2
}, {
  "value": "Creation is special",
  "id": "creation-is-special",
  "level": 2
}, {
  "value": "Managed-only mode",
  "id": "managed-only-mode",
  "level": 2
}, {
  "value": "Optional K8s-native impersonation",
  "id": "optional-k8s-native-impersonation",
  "level": 2
}, {
  "value": "Worked example (sandbox)",
  "id": "worked-example-sandbox",
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
        id: "authorization",
        children: "Authorization"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["SSO proves ", (0,jsx_runtime.jsx)(_components.em, {
        children: "who you are"
      }), "; per-secret annotations and one namespace-level\nConfigMap decide ", (0,jsx_runtime.jsx)(_components.em, {
        children: "what you may see"
      }), " (", (0,jsx_runtime.jsx)(_components.code, {
        children: "lib/authz.ts"
      }), "). The app's ServiceAccount\nexecutes the K8s calls, so SSO users need no cluster identity."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "decision-order",
      children: "Decision order"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ol, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Admins always pass"
        }), " — ", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_ADMIN_GROUPS"
        }), " / ", (0,jsx_runtime.jsx)(_components.code, {
          children: "KRYPTON_ADMIN_USERS"
        }), "\n(matched against SSO groups / lowercased email)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Per-secret annotations override everything below."
        }), " If a secret has any\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "allowed-groups"
        }), "/", (0,jsx_runtime.jsx)(_components.code, {
          children: "allowed-users"
        }), ", only those decide."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Namespace fallback"
        }), " in ConfigMap ", (0,jsx_runtime.jsx)(_components.code, {
          children: "<app-namespace>/krypton-access"
        }), ", key\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "access.json"
        }), " (cached 60s in memory)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "No rules anywhere → visible to all authenticated users"
        }), " (open by default,\nrestricted once rules are added)."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Until any admin is configured, every authenticated user is treated as admin\n(bootstrap mode — set admins promptly)."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "per-secret-annotations",
      children: "Per-secret annotations"
    }), "\n", "\n", (0,jsx_runtime.jsx)(CodeBlock/* ["default"] */.A, {
      language: "yaml",
      children: secret_annotated
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Managed in the UI on the secret form:"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-yaml",
        children: "metadata:\n  annotations:\n    krypton.io/allowed-groups: 'dev-team, database-admins'\n    krypton.io/allowed-users: 'alice@company.com'\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.h2, {
      id: "namespace-fallback-accessjson",
      children: ["Namespace fallback (", (0,jsx_runtime.jsx)(_components.code, {
        children: "access.json"
      }), ")"]
    }), "\n", "\n", (0,jsx_runtime.jsx)(CodeBlock/* ["default"] */.A, {
      language: "json",
      children: access_config_json
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Namespaces absent from the map are open to all authenticated users until\nrestricted. An invalid ", (0,jsx_runtime.jsx)(_components.code, {
        children: "access.json"
      }), " is ignored with a warning (fail-open to\nstep 4, not a crash); a missing ConfigMap simply means no namespace rules."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "creation-is-special",
      children: "Creation is special"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["A new secret has no annotations yet, so creating in a namespace is decided by\nthe ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "namespace rules alone"
      }), " — the per-secret allowed groups/users you set in\nthe form only take effect ", (0,jsx_runtime.jsx)(_components.em, {
        children: "after"
      }), " the secret exists. The secrets list response\nincludes ", (0,jsx_runtime.jsx)(_components.code, {
        children: "canCreate"
      }), " so the UI disables creation upfront when the rules exclude\nyou (POST still enforces server-side: ", (0,jsx_runtime.jsx)(_components.code, {
        children: "403"
      }), ")."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "managed-only-mode",
      children: "Managed-only mode"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Default ", (0,jsx_runtime.jsx)(_components.code, {
        children: "KRYPTON_MANAGED_ONLY=true"
      }), ": secrets ", (0,jsx_runtime.jsx)(_components.em, {
        children: "without"
      }), "\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "krypton.io/managed-by: krypton"
      }), " are hidden entirely — excluded from lists, 404\non direct access (read, edit, delete, history, restore, restart) — so K8s-level\nsecrets created outside Krypton can't be touched by accident. Set\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "KRYPTON_MANAGED_ONLY=false"
      }), " to show everything again (legacy adopt-on-edit:\nsaving an external secret stamps Krypton annotations onto it)."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "optional-k8s-native-impersonation",
      children: "Optional K8s-native impersonation"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["If your API server trusts the same OIDC issuer as the app, set\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "KRYPTON_IMPERSONATION=true"
      }), " and Krypton forwards\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "Impersonate-User"
      }), "/", (0,jsx_runtime.jsx)(_components.code, {
        children: "Impersonate-Group"
      }), " headers so the ", (0,jsx_runtime.jsx)(_components.em, {
        children: "human's"
      }), " RBAC is evaluated\ninstead of the ServiceAccount's. Default is ", (0,jsx_runtime.jsx)(_components.code, {
        children: "false"
      }), " (hybrid mode above)."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "worked-example-sandbox",
      children: "Worked example (sandbox)"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Secret"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Namespace"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Rule source"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "alice (dev-team)"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "bob (other-team)"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "carol (frontend-team)"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "admin"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "database-credentials"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "krypton-test"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["annotation ", (0,jsx_runtime.jsx)(_components.code, {
              children: "allowed-groups: dev-team,…"
            })]
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "✅"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "❌"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "❌"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "✅"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "feature-flags"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "krypton-test"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "none (open by default)"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "✅"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "✅"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "✅"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "✅"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "frontend-api-keys"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "frontend-ns"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["namespace fallback (", (0,jsx_runtime.jsx)(_components.code, {
              children: "frontend-team"
            }), ")"]
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "❌"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "❌"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "✅"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "✅"
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Recreate it headless with ", (0,jsx_runtime.jsx)(_components.code, {
        children: "sandbox/scripts/mint-jwt.mjs"
      }), " — see the\n", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/sandbox/",
        children: "Sandbox guide"
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

}]);