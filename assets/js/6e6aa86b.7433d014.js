"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["973"], {
4525(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_api_overview_mdx_6e6_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-api-overview-mdx-6e6.json
var site_docs_api_overview_mdx_6e6_namespaceObject = JSON.parse('{"id":"api/overview","title":"API Overview","description":"The API is plain REST over JSON, authenticated with the krypton_session","source":"@site/docs/api/overview.mdx","sourceDirName":"api","slug":"/api/overview","permalink":"/api/overview","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":0,"frontMatter":{"sidebar_label":"Overview","sidebar_position":0},"sidebar":"api","next":{"title":"Namespaces","permalink":"/api/namespaces"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.0_@docusaurus+types@3.10.0_@sw_d80ed93973d8fdb1b9e1067267ab632b/node_modules/@docusaurus/theme-classic/lib/theme/CodeBlock/index.js + 27 modules
var CodeBlock = __webpack_require__(4401);
;// CONCATENATED MODULE: ./node_modules/.pnpm/raw-loader@4.0.2_webpack@5.111.1_@swc+core@1.16.18_@swc+html@1.16.18_clean-css@5.3.3_cs_0a2048681882c260752bdc7655a466eb/node_modules/raw-loader/dist/cjs.js!./.samples/rest-lifecycle.sh
/* export default */ const rest_lifecycle = ("# Krypton REST lifecycle against the sandbox (make up + app/.env from app.env.sandbox).\n# Mint session JWTs directly — must match the app's SESSION_SECRET.\nALICE=$(node sandbox/scripts/mint-jwt.mjs --email alice@company.com --groups dev-team)\nBOB=$(node sandbox/scripts/mint-jwt.mjs --email bob@company.com --groups other-team)\n\nBASE=localhost:3000\nNS=krypton-test\n\n# 1. List namespaces and secrets (alice sees dev-team + open secrets)\ncurl --cookie \"krypton_session=$ALICE\" $BASE/api/namespaces\ncurl --cookie \"krypton_session=$ALICE\" $BASE/api/namespaces/$NS/secrets\n\n# 2. Negative case: bob is not in dev-team\ncurl --cookie \"krypton_session=$BOB\" \\\n  $BASE/api/namespaces/$NS/secrets/database-credentials # 403\n\n# 3. Create a secret (201; stamps krypton.io/managed-by + version=1)\ncurl --cookie \"krypton_session=$ALICE\" -X POST \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"name\":\"demo-secret\",\"data\":{\"API_KEY\":\"s3cr3t\"},\"description\":\"Demo\"}' \\ # pragma: allowlist secret\n  $BASE/api/namespaces/$NS/secrets\n\n# 4. Read it back (detail includes decoded data + resourceVersion)\ncurl --cookie \"krypton_session=$ALICE\" \\\n  $BASE/api/namespaces/$NS/secrets/demo-secret\n\n# 5. Update with optimistic concurrency (409 on resourceVersion mismatch)\nRV=$(curl -s --cookie \"krypton_session=$ALICE\" \\\n  $BASE/api/namespaces/$NS/secrets/demo-secret | jq -r .secret.resourceVersion)\ncurl --cookie \"krypton_session=$ALICE\" -X PUT \\\n  -H 'Content-Type: application/json' \\\n  -d \"{\\\"data\\\":{\\\"API_KEY\\\":\\\"r0tated\\\"},\\\"resourceVersion\\\":\\\"$RV\\\"}\" \\\n  $BASE/api/namespaces/$NS/secrets/demo-secret\n\n# 6. History + reversible restore (snapshots current state first)\ncurl --cookie \"krypton_session=$ALICE\" \\\n  $BASE/api/namespaces/$NS/secrets/demo-secret/versions\ncurl --cookie \"krypton_session=$ALICE\" -X POST \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"version\":1}' \\\n  $BASE/api/namespaces/$NS/secrets/demo-secret/restore\n\n# 7. Restart env-var consumers (needs KRYPTON_RESTART_ENABLED=true)\ncurl --cookie \"krypton_session=$ALICE\" -X POST \\\n  $BASE/api/namespaces/$NS/secrets/demo-secret/restart-consumers\n\n# 8. Delete (snapshots go too, unless ?keepHistory=true)\ncurl --cookie \"krypton_session=$ALICE\" -X DELETE \\\n  $BASE/api/namespaces/$NS/secrets/demo-secret\n");
;// CONCATENATED MODULE: ./docs/api/overview.mdx


const frontMatter = {
	sidebar_label: 'Overview',
	sidebar_position: 0
};
const contentTitle = 'API Overview';

const assets = {

};





const toc = [{
  "value": "Conventions",
  "id": "conventions",
  "level": 2
}, {
  "value": "Endpoint map",
  "id": "endpoint-map",
  "level": 2
}, {
  "value": "Scripted lifecycle",
  "id": "scripted-lifecycle",
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
        id: "api-overview",
        children: "API Overview"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The API is plain REST over JSON, authenticated with the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "krypton_session"
      }), "\ncookie (an HS256 session JWT minted at OIDC login). Values cross the API\nboundary as ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "plain strings"
      }), " — base64 stays inside Kubernetes."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "conventions",
      children: "Conventions"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Auth"
        }), ": every endpoint except ", (0,jsx_runtime.jsx)(_components.code, {
          children: "GET /api/config"
        }), " requires a session;\nunauthenticated calls get ", (0,jsx_runtime.jsx)(_components.code, {
          children: "401 { \"error\": \"Authentication required\" }"
        }), ".\n(The one exception is ", (0,jsx_runtime.jsx)(_components.code, {
          children: "GET /api/auth/me"
        }), ", which answers ", (0,jsx_runtime.jsx)(_components.code, {
          children: "401 { \"user\": null }"
        }), ".)"]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Errors"
        }), ": ", (0,jsx_runtime.jsx)(_components.code, {
          children: "{ \"error\": \"<message>\" }"
        }), " with the HTTP status. Zod validation\nfailures answer ", (0,jsx_runtime.jsx)(_components.code, {
          children: "400 { \"error\": \"Validation failed\", \"issues\": [...] }"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Gates"
        }), ": every secrets route enforces, in order, namespace scope →\nmanaged-only visibility (404) → hybrid authorization (403). See\n", (0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/authorization/",
          children: "Authorization"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Kubernetes failures"
        }), " surface as\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "Kubernetes API (<status>): <detail>"
        }), " — a 403 there means the app's\nServiceAccount lacks RBAC, not that the user failed Krypton authz."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "endpoint-map",
      children: "Endpoint map"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Method"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Path"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Page"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "GET"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/namespaces"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/namespaces/",
              children: "Namespaces"
            })
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "GET"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/namespaces/:ns/secrets"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/secrets/",
              children: "Secrets"
            })
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "POST"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/namespaces/:ns/secrets"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/secrets/",
              children: "Secrets"
            })
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "GET"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/namespaces/:ns/secrets/:name"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/secrets/",
              children: "Secrets"
            })
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "PUT"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/namespaces/:ns/secrets/:name"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/secrets/",
              children: "Secrets"
            })
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "DELETE"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/namespaces/:ns/secrets/:name"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/secrets/",
              children: "Secrets"
            })
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "GET"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/namespaces/:ns/secrets/:name/versions"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/versions/",
              children: "Versions"
            })
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "POST"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/namespaces/:ns/secrets/:name/restore"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/restore/",
              children: "Restore"
            })
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "POST"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/namespaces/:ns/secrets/:name/restart-consumers"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/restart-consumers/",
              children: "Restart"
            })
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "GET"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "/api/auth/login"
            }), ", ", (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/auth/callback"
            }), ", ", (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/auth/logout"
            }), ", ", (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/auth/me"
            })]
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/auth/",
              children: "Auth"
            })
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "GET"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/api/config"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.a, {
              href: "/api/config/",
              children: "Config"
            })
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "scripted-lifecycle",
      children: "Scripted lifecycle"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "The full flow — list, negative authz case, create, read, concurrent-safe\nupdate, versions, restore, restart, delete — against the sandbox:"
    }), "\n", "\n", (0,jsx_runtime.jsx)(CodeBlock/* ["default"] */.A, {
      language: "bash",
      children: rest_lifecycle
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Session cookies for scripts come from ", (0,jsx_runtime.jsx)(_components.code, {
        children: "sandbox/scripts/mint-jwt.mjs"
      }), " (must\nmatch the app's ", (0,jsx_runtime.jsx)(_components.code, {
        children: "SESSION_SECRET"
      }), "):"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "ALICE=$(node sandbox/scripts/mint-jwt.mjs --email alice@company.com --groups dev-team)\ncurl --cookie \"krypton_session=$ALICE\" localhost:3000/api/namespaces\n"
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

}]);