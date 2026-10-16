"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["671"], {
4223(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_guides_sandbox_mdx_78b_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-guides-sandbox-mdx-78b.json
var site_docs_guides_sandbox_mdx_78b_namespaceObject = JSON.parse('{"id":"guides/sandbox","title":"Sandbox","description":"Local end-to-end environment: a kind Kubernetes cluster with seeded","source":"@site/docs/guides/sandbox.mdx","sourceDirName":"guides","slug":"/guides/sandbox","permalink":"/guides/sandbox","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":1,"frontMatter":{"sidebar_label":"Sandbox","sidebar_position":1},"sidebar":"guides","previous":{"title":"Local Development","permalink":"/guides/local-development"},"next":{"title":"Deploy to Kubernetes","permalink":"/guides/deploy-kubernetes"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
;// CONCATENATED MODULE: ./docs/guides/sandbox.mdx


const frontMatter = {
	sidebar_label: 'Sandbox',
	sidebar_position: 1
};
const contentTitle = 'Sandbox';

const assets = {

};



const toc = [{
  "value": "Prerequisites",
  "id": "prerequisites",
  "level": 2
}, {
  "value": "Quickstart",
  "id": "quickstart",
  "level": 2
}, {
  "value": "Layout",
  "id": "layout",
  "level": 2
}, {
  "value": "Fixture map + expected visibility matrix",
  "id": "fixture-map--expected-visibility-matrix",
  "level": 2
}, {
  "value": "Test scenarios",
  "id": "test-scenarios",
  "level": 2
}, {
  "value": "Headless authz checks (no browser)",
  "id": "headless-authz-checks-no-browser",
  "level": 2
}, {
  "value": "Validating the in-cluster path (ServiceAccount + RBAC)",
  "id": "validating-the-in-cluster-path-serviceaccount--rbac",
  "level": 2
}, {
  "value": "Troubleshooting",
  "id": "troubleshooting",
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
        id: "sandbox",
        children: "Sandbox"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Local end-to-end environment: a ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "kind"
      }), " Kubernetes cluster with seeded\nfixtures plus ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "Dex"
      }), " as a throwaway OIDC provider — everything K8ston needs,\nnothing else (no database; Kubernetes ", (0,jsx_runtime.jsx)(_components.em, {
        children: "is"
      }), " the datastore)."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "prerequisites",
      children: "Prerequisites"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "Docker with Compose v2, GNU Make, and Bash"
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "https://kind.sigs.k8s.io/docs/user/quick-start/#installation",
          children: (0,jsx_runtime.jsx)(_components.code, {
            children: "kind"
          })
        }), " (any recent release; validated with v0.33.0)"]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "kubectl"
        }), " and ", (0,jsx_runtime.jsx)(_components.code, {
          children: "curl"
        })]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Node 22.22 (the Docker build version) or the developer/CI version in\n", (0,jsx_runtime.jsx)(_components.a, {
          href: "https://github.com/egose/k8ston/blob/main/.tool-versions",
          children: (0,jsx_runtime.jsx)(_components.code, {
            children: ".tool-versions"
          })
        }), ";\ncurrent dependencies require at least Node 22.19."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["The pnpm version selected by ", (0,jsx_runtime.jsx)(_components.code, {
          children: "packageManager"
        }), " in\n", (0,jsx_runtime.jsx)(_components.a, {
          href: "https://github.com/egose/k8ston/blob/main/package.json",
          children: "package.json"
        }), "."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "quickstart",
      children: "Quickstart"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "# from the repo root\npnpm install --frozen-lockfile\nmake up          # kind cluster + Dex + fixtures\ncp -n sandbox/app.env.sandbox app/.env\npnpm --dir app dev --hostname 127.0.0.1   # http://localhost:3000\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The app runs on the host, not in Compose. ", (0,jsx_runtime.jsx)(_components.code, {
        children: "cp -n"
      }), " preserves an existing ", (0,jsx_runtime.jsx)(_components.code, {
        children: "app/.env"
      }), ";\nupdate it deliberately if you previously used a different configuration.\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "make up"
      }), " selects ", (0,jsx_runtime.jsx)(_components.code, {
        children: "kind-k8ston-sandbox"
      }), " before seeding fixtures."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Sign in with any sandbox user (password is ", (0,jsx_runtime.jsx)(_components.code, {
        children: "password"
      }), " for all). These credentials\nand the sandbox signing key are public test fixtures, never production credentials:"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "User"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Groups"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Expected access"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "alice@company.com"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "dev-team"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["can manage ", (0,jsx_runtime.jsx)(_components.code, {
              children: "database-credentials"
            })]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "bob@company.com"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "other-team"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "denied restricted Secrets; can manage open fixtures"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "carol@company.com"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "frontend-team"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["can manage namespace-fallback Secrets in ", (0,jsx_runtime.jsx)(_components.code, {
              children: "frontend-ns"
            })]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "admin@company.com"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "k8ston-admin"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "application ACL bypass, within scope/visibility and Kubernetes RBAC"
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "An application grant permits reading and managing a Secret; these are not read-only roles."
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Tear down: ", (0,jsx_runtime.jsx)(_components.code, {
        children: "make down"
      }), " (stops Dex, keeps kind for fast iteration),\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "make destroy"
      }), " (removes Dex volumes ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "and"
      }), " all kind cluster data), or ", (0,jsx_runtime.jsx)(_components.code, {
        children: "make reset"
      }), "\n(destroy and recreate). ", (0,jsx_runtime.jsx)(_components.code, {
        children: "make seed"
      }), " reapplies fixtures and can overwrite fixture edits."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "layout",
      children: "Layout"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-text",
        children: "sandbox/\n  docker-compose.yml   Dex (OIDC); kind is Makefile-managed, not composed\n  .env.example         compose-side overrides (cp to .env; all optional)\n  app.env.sandbox      ready-made app/.env for sandbox mode\n  dex/config.yaml      static clients/users/groups (in-memory, no DB)\n  kind/config.yaml     kind cluster definition\n  kind/fixtures/       namespaces, secrets, access ConfigMap, consumer Deployment\n  scripts/             seed.sh, wait-for-dex.sh, mint-jwt.mjs\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Dex binds to ", (0,jsx_runtime.jsx)(_components.code, {
        children: "127.0.0.1:5556"
      }), "; the dev command above binds the app to ", (0,jsx_runtime.jsx)(_components.code, {
        children: "127.0.0.1:3000"
      }), ".\nKind assigns a host API port recorded in its kubeconfig; do not assume host port ", (0,jsx_runtime.jsx)(_components.code, {
        children: "6443"
      }), ".\nChanging ", (0,jsx_runtime.jsx)(_components.code, {
        children: "DEX_PORT"
      }), " requires changing the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "issuer"
      }), " in\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "dex/config.yaml"
      }), " and the app's ", (0,jsx_runtime.jsx)(_components.code, {
        children: "OIDC_ISSUER"
      }), " together — the issuer URL embeds\nthe port."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["There is intentionally no ", (0,jsx_runtime.jsx)(_components.code, {
        children: "docker-compose.prod.yml"
      }), " overlay: production K8ston\nuses reviewed ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/deploy-kubernetes/",
        children: "manifests"
      }), " or the ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/deploy-helm/",
        children: "Helm chart"
      }), ", not this Compose setup."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "fixture-map--expected-visibility-matrix",
      children: "Fixture map + expected visibility matrix"
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
            children: "alice"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "bob"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "carol"
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
            children: "k8ston-test"
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
            children: "k8ston-test"
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
              children: "legacy-external"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "k8ston-test"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "none + unmanaged (\"external\" badge)¹"
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
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "frontend-ns"
      }), " is governed by ", (0,jsx_runtime.jsx)(_components.code, {
        children: "k8ston-access"
      }), " in ", (0,jsx_runtime.jsx)(_components.code, {
        children: "k8ston-test"
      }), " (the app's own\nnamespace); ", (0,jsx_runtime.jsx)(_components.code, {
        children: "k8ston-test"
      }), " is deliberately absent from it (open by default).\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "api-server"
      }), " (Deployment) consumes ", (0,jsx_runtime.jsx)(_components.code, {
        children: "database-credentials"
      }), " via env and\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "feature-flags"
      }), " via volume for restart-consumer testing."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["¹ The sandbox sets ", (0,jsx_runtime.jsx)(_components.code, {
        children: "K8STON_MANAGED_ONLY=false"
      }), " so ", (0,jsx_runtime.jsx)(_components.code, {
        children: "legacy-external"
      }), " stays\nvisible for the adoption demo. With the production default (", (0,jsx_runtime.jsx)(_components.code, {
        children: "true"
      }), "),\nunmanaged secrets are hidden entirely (excluded from lists, 404 on access)."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "test-scenarios",
      children: "Test scenarios"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Walk the matrix above by logging in as each user. Then:"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Versioning"
        }), ": edit ", (0,jsx_runtime.jsx)(_components.code, {
          children: "database-credentials"
        }), " twice → UID-bound v1/v2 snapshots\nnamed ", (0,jsx_runtime.jsx)(_components.code, {
          children: "k8ston-h-<UID hash>-vN"
        }), " appear\n(", (0,jsx_runtime.jsx)(_components.code, {
          children: "kubectl --context kind-k8ston-sandbox get secret -n k8ston-test -l k8ston.io/kind=history"
        }), ").\nRestoring v1 captures the current live state before replacing its data; recovery\ndepends on retained history. These are pre-write captures, not an atomic backup log."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "409 conflicts"
        }), ": open the same secret's edit page in two tabs/sessions, save\nboth — the second gets the resourceVersion-mismatch prompt."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Size guards"
        }), ": paste oversized data — the form blocks it and the API rejects\nit too (400 for data validation or 413 for payload-size guards, depending on the input)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Restart consumers"
        }), ": edit ", (0,jsx_runtime.jsx)(_components.code, {
          children: "database-credentials"
        }), ", hit ", (0,jsx_runtime.jsx)(_components.em, {
          children: "Restart apps"
        }), ",\nthen inspect ", (0,jsx_runtime.jsx)(_components.code, {
          children: "kubectl --context kind-k8ston-sandbox rollout status deploy/api-server -n k8ston-test"
        }), " and\nrollout history. The UI confirms the request only; verify application credential\nuptake separately without printing values (the sandbox sets\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "K8STON_RESTART_ENABLED=true"
        }), "; the default is ", (0,jsx_runtime.jsx)(_components.code, {
          children: "false"
        }), ")."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Redaction"
        }), ": inspect app audit/error diagnostics — action metadata and key names,\nnot Secret values."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "External adoption"
        }), " (", (0,jsx_runtime.jsx)(_components.code, {
          children: "K8STON_MANAGED_ONLY=false"
        }), " only): editing\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "legacy-external"
        }), " stamps K8ston annotations on it."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "headless-authz-checks-no-browser",
      children: "Headless authz checks (no browser)"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Keep ", (0,jsx_runtime.jsx)(_components.code, {
        children: "AUTH_DISABLED=false"
      }), " and mint sandbox session JWTs with the app's matching\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "SESSION_SECRET"
      }), ". The helper defaults to the public sandbox key, not a production key.\nWith auth disabled, cookies are ignored and every request is the mock admin, so a\nnegative per-user check cannot work. Print only HTTP status codes, not response values:"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "ALICE=$(node sandbox/scripts/mint-jwt.mjs --email alice@company.com --groups dev-team)\nBOB=$(node sandbox/scripts/mint-jwt.mjs --email bob@company.com --groups other-team)\ncurl --silent --show-error --output /dev/null --write-out '%{http_code}\\n' \\\n  --cookie \"k8ston_session=$ALICE\" http://localhost:3000/api/namespaces/k8ston-test/secrets/database-credentials  # 200\ncurl --silent --show-error --output /dev/null --write-out '%{http_code}\\n' \\\n  --cookie \"k8ston_session=$BOB\" http://localhost:3000/api/namespaces/k8ston-test/secrets/database-credentials    # 403\ncurl --silent --show-error --output /dev/null --write-out '%{http_code}\\n' \\\n  --cookie \"k8ston_session=$BOB\" http://localhost:3000/api/namespaces/k8ston-test/secrets/feature-flags          # 200\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The full scripted lifecycle (create → update → versions → restore → restart →\ndelete) lives in the ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/api/overview/",
        children: "API overview"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "validating-the-in-cluster-path-serviceaccount--rbac",
      children: "Validating the in-cluster path (ServiceAccount + RBAC)"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The host dev server uses your selected kubeconfig (typically admin in kind), not\nthe app's ServiceAccount or Role. The following ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "local-only"
      }), " setup validates that\nidentity in namespace ", (0,jsx_runtime.jsx)(_components.code, {
        children: "k8ston"
      }), ", not the host fixture namespaces. It prepares a\nminimal auth-disabled ConfigMap and a local image before applying the Deployment;\nno host-side Dex connection is needed:"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "# from the repo root, with the kind cluster from `make up` running\nSANDBOX_CONTEXT=kind-k8ston-sandbox\ndocker build -t k8ston:sandbox -f Dockerfile .\nkind load docker-image k8ston:sandbox --name k8ston-sandbox\nkubectl --context \"$SANDBOX_CONTEXT\" apply \\\n  -f app/k8s/namespace.yaml -f app/k8s/serviceaccount.yaml -f app/k8s/role.yaml\nkubectl --context \"$SANDBOX_CONTEXT\" apply -f app/k8s/configmap-access.yaml\nkubectl --context \"$SANDBOX_CONTEXT\" -n k8ston create configmap k8ston-config \\\n  --from-literal=AUTH_DISABLED=true \\\n  --from-literal=APP_URL=http://127.0.0.1:3300 \\\n  --from-literal=K8STON_ADMIN_GROUPS=k8ston-admin \\\n  --dry-run=client -o yaml | kubectl --context \"$SANDBOX_CONTEXT\" apply -f -\nkubectl --context \"$SANDBOX_CONTEXT\" -n k8ston create secret generic k8ston-oidc \\\n  --from-literal=SESSION_SECRET='sandbox-only-session-secret-32chars!!!' \\\n  --dry-run=client -o yaml | kubectl --context \"$SANDBOX_CONTEXT\" apply -f -\nsed 's|image: ghcr.io/egose/k8ston:latest|image: k8ston:sandbox|' app/k8s/deployment.yaml \\\n  | kubectl --context \"$SANDBOX_CONTEXT\" apply -f -\nkubectl --context \"$SANDBOX_CONTEXT\" -n k8ston rollout status deploy/k8ston\nkubectl --context \"$SANDBOX_CONTEXT\" -n k8ston port-forward --address 127.0.0.1 svc/k8ston 3300:80\n# → http://127.0.0.1:3300, namespace scope over `k8ston` only\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["In another terminal, prove least privilege (Role allows ", (0,jsx_runtime.jsx)(_components.code, {
        children: "k8ston"
      }), " only, no namespace listing):"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "kubectl --context kind-k8ston-sandbox auth can-i create secrets -n k8ston \\\n  --as=system:serviceaccount:k8ston:k8ston       # yes\nkubectl --context kind-k8ston-sandbox auth can-i list secrets -n k8ston-test \\\n  --as=system:serviceaccount:k8ston:k8ston       # no\nkubectl --context kind-k8ston-sandbox auth can-i list namespaces \\\n  --as=system:serviceaccount:k8ston:k8ston       # no\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["With cluster scope but only this namespace Role, set an explicit\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "K8STON_NAMESPACES=k8ston"
      }), " allowlist to avoid namespace discovery. An empty allowlist\nrequires namespace-list RBAC and returns an error on discovery failure; there is\nno fallback to the pod namespace. The allowlist does not grant extra Kubernetes access."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Auth-disabled runs validate ServiceAccount access, ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "not per-user ACLs"
      }), ".\nFor headless in-cluster session checks, use ", (0,jsx_runtime.jsx)(_components.code, {
        children: "AUTH_DISABLED=false"
      }), ", the matching\nsession key, and managed test Secrets in ", (0,jsx_runtime.jsx)(_components.code, {
        children: "k8ston"
      }), "; the unchanged Role cannot manage\nthe ", (0,jsx_runtime.jsx)(_components.code, {
        children: "k8ston-test"
      }), " fixtures. Session fixtures do not exercise OIDC sign-in. For real\nin-cluster SSO, use an HTTPS provider reachable by both the browser and pod — a\npod's ", (0,jsx_runtime.jsx)(_components.code, {
        children: "localhost"
      }), " is not host-side Dex, and HTTP issuers are rejected in production."]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Cheap static checks that need no cluster at all:"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "make verify-sandbox   # compose config + offline manifest validation (no cluster needed)\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "This structural check needs Python 3/PyYAML and does not replace API-server validation."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "troubleshooting",
      children: "Troubleshooting"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "kind: command not found"
        }), " → install kind (see Prerequisites); ", (0,jsx_runtime.jsx)(_components.code, {
          children: "make kind-up"
        }), "\nfails closed with instructions."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Wrong cluster (", (0,jsx_runtime.jsx)(_components.code, {
          children: "kubectl config current-context"
        }), " should be\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "kind-k8ston-sandbox"
        }), ") → ", (0,jsx_runtime.jsx)(_components.code, {
          children: "make kind-up"
        }), " re-selects it; never seed prod."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Dex unhealthy → ", (0,jsx_runtime.jsx)(_components.code, {
          children: "make logs"
        }), " / ", (0,jsx_runtime.jsx)(_components.code, {
          children: "docker compose -f sandbox/docker-compose.yml ps"
        }), ";\ndiscovery doc must answer at ", (0,jsx_runtime.jsx)(_components.code, {
          children: "http://localhost:5556/dex/.well-known/openid-configuration"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["App shows login errors → check ", (0,jsx_runtime.jsx)(_components.code, {
          children: "OIDC_ISSUER"
        }), "/", (0,jsx_runtime.jsx)(_components.code, {
          children: "OIDC_ALLOW_HTTP=true"
        }), " in\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "app/.env"
        }), " and that Dex is up before the app boots (OIDC config is cached\nper process — restart ", (0,jsx_runtime.jsx)(_components.code, {
          children: "pnpm dev"
        }), " after Dex restarts)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Stale fixtures → ", (0,jsx_runtime.jsx)(_components.code, {
          children: "make seed"
        }), " reapplies them and can overwrite edits; ", (0,jsx_runtime.jsx)(_components.code, {
          children: "make reset"
        }), "\ndestroys all cluster data before recreating the sandbox."]
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