"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["989"], {
4536(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_api_secrets_mdx_b4f_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-api-secrets-mdx-b4f.json
var site_docs_api_secrets_mdx_b4f_namespaceObject = JSON.parse('{"id":"api/secrets","title":"Secrets API","description":"Text values cross the API boundary as plain strings. Non-text values have an","source":"@site/docs/api/secrets.mdx","sourceDirName":"api","slug":"/api/secrets","permalink":"/api/secrets","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":2,"frontMatter":{"sidebar_label":"Secrets","sidebar_position":2},"sidebar":"api","previous":{"title":"Namespaces","permalink":"/api/namespaces"},"next":{"title":"Versions","permalink":"/api/versions"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.3.0/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4686);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.3.0_react@19.3.0/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(3191);
;// CONCATENATED MODULE: ./docs/api/secrets.mdx


const frontMatter = {
	sidebar_label: 'Secrets',
	sidebar_position: 2
};
const contentTitle = 'Secrets API';

const assets = {

};



const toc = [{
  "value": "Shapes",
  "id": "shapes",
  "level": 2
}, {
  "value": "Shared key and type rules",
  "id": "shared-key-and-type-rules",
  "level": 3
}, {
  "value": "List secrets",
  "id": "list-secrets",
  "level": 2
}, {
  "value": "Create secret",
  "id": "create-secret",
  "level": 2
}, {
  "value": "Read secret",
  "id": "read-secret",
  "level": 2
}, {
  "value": "Update secret",
  "id": "update-secret",
  "level": 2
}, {
  "value": "Upgrade semantics",
  "id": "upgrade-semantics",
  "level": 3
}, {
  "value": "Delete secret",
  "id": "delete-secret",
  "level": 2
}, {
  "value": "Required query contract",
  "id": "required-query-contract",
  "level": 3
}, {
  "value": "Ordered cleanup and native preconditions",
  "id": "ordered-cleanup-and-native-preconditions",
  "level": 3
}, {
  "value": "Result union",
  "id": "result-union",
  "level": 3
}, {
  "value": "Upgrade and UI recovery",
  "id": "upgrade-and-ui-recovery",
  "level": 3
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
    h3: "h3",
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
    ul: "ul",
    ...(0,lib/* .useMDXComponents */.R)(),
    ...props.components
  };
  return (0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
    children: [(0,jsx_runtime.jsx)(_components.header, {
      children: (0,jsx_runtime.jsx)(_components.h1, {
        id: "secrets-api",
        children: "Secrets API"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Text values cross the API boundary as ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "plain strings"
      }), ". Non-text values have an\nexplicit ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "base64"
      }), " representation in authorized detail/history responses.\nAll routes require a session and enforce namespace scope. Named-secret\nroutes then enforce live visibility (404 for history objects in either mode, and\nfor unmanaged secrets when ", (0,jsx_runtime.jsx)(_components.code, {
        children: "KRYPTON_MANAGED_ONLY=true"
      }), ") → hybrid authorization\n(403 for denied rules; 503 if required namespace policy is unavailable).\nSuccess and error responses use ", (0,jsx_runtime.jsx)(_components.code, {
        children: "Cache-Control: no-store"
      }), ". Shared\n", (0,jsx_runtime.jsx)(_components.a, {
        href: "/api/overview/#request-and-collection-budgets",
        children: "request/collection budgets"
      }), " apply."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "shapes",
      children: "Shapes"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "SecretSummary"
      }), " (lists, creates):"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{\n  \"namespace\": \"krypton-test\",\n  \"name\": \"database-credentials\",\n  \"type\": \"Opaque\",\n  \"keys\": [\"DATABASE_URL\", \"DB_PASSWORD\"],\n  \"keyCount\": 2,\n  \"description\": \"Primary database credentials\",\n  \"version\": 3,\n  \"resourceVersion\": \"123456\",\n  \"creationTimestamp\": \"2026-01-04T12:00:00Z\",\n  \"allowedGroups\": [\"dev-team\"],\n  \"allowedUsers\": [],\n  \"managedByKrypton\": true,\n  \"immutable\": false,\n  \"binaryKeys\": []\n}\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "SecretDetail"
      }), " (read, update, restore) adds disjoint value maps:"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{\n  \"secret\": {\n    \"...summary fields\": \"...\",\n    \"keys\": [\"DATABASE_URL\", \"archive.bin\"],\n    \"binaryKeys\": [\"archive.bin\"],\n    \"data\": { \"DATABASE_URL\": \"postgres://…\" },\n    \"binaryData\": { \"archive.bin\": \"AP8=\" }\n  }\n}\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "data"
      }), " contains only losslessly decoded Unicode text. Non-UTF-8 bytes and binary\ncontrols (U+0000–0008, U+000B–000C, U+000E–001F, U+007F) appear only in\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "binaryData"
      }), ", using their original Kubernetes base64. Tabs, CR/LF, Unicode BOMs,\nempty strings, and literal ", (0,jsx_runtime.jsx)(_components.code, {
        children: "�"
      }), " remain text. ", (0,jsx_runtime.jsx)(_components.code, {
        children: "keys"
      }), "/", (0,jsx_runtime.jsx)(_components.code, {
        children: "keyCount"
      }), " cover both maps;\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "binaryKeys"
      }), " names the latter. Summaries include ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "no values"
      }), " in either encoding.\nThe UI masks both kinds and provides an explicitly labeled read-only base64\nviewer/copy control for binary data.\nSummary/detail responses also include optional ", (0,jsx_runtime.jsx)(_components.code, {
        children: "deletionTimestamp"
      }), " while Kubernetes\ndeletion is pending. Its presence does not mean the Secret has disappeared."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "shared-key-and-type-rules",
      children: "Shared key and type rules"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Keys are 1–253 ASCII characters from letters, digits, ", (0,jsx_runtime.jsx)(_components.code, {
        children: "."
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "_"
      }), ", and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "-"
      }), ". ", (0,jsx_runtime.jsx)(_components.code, {
        children: "."
      }), " and\nkeys beginning with ", (0,jsx_runtime.jsx)(_components.code, {
        children: ".."
      }), " are invalid. The valid keys ", (0,jsx_runtime.jsx)(_components.code, {
        children: "__proto__"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "constructor"
      }), ",\nand ", (0,jsx_runtime.jsx)(_components.code, {
        children: "toString"
      }), " are preserved as own properties through JSON, validation, encoding,\nand forms. Client code should use ", (0,jsx_runtime.jsx)(_components.code, {
        children: "Object.hasOwn"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "Object.entries"
      }), ", and safe map\nconstruction instead of inherited-property checks or prototype-setting assignment."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Type"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Data requirements (on create, update, and restore)"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "Opaque"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "No additional constraints"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "kubernetes.io/basic-auth"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["At least one of ", (0,jsx_runtime.jsx)(_components.code, {
              children: "username"
            }), " or ", (0,jsx_runtime.jsx)(_components.code, {
              children: "password"
            }), "; empty is valid"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "kubernetes.io/ssh-auth"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Nonempty ", (0,jsx_runtime.jsx)(_components.code, {
              children: "ssh-privatekey"
            })]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "kubernetes.io/tls"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Both ", (0,jsx_runtime.jsx)(_components.code, {
              children: "tls.crt"
            }), " and ", (0,jsx_runtime.jsx)(_components.code, {
              children: "tls.key"
            }), "; empty is valid, contents are not verified"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "kubernetes.io/dockerconfigjson"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: ".dockerconfigjson"
            }), ": a JSON object or ", (0,jsx_runtime.jsx)(_components.code, {
              children: "null"
            })]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "kubernetes.io/dockercfg"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: ".dockercfg"
            }), ": a JSON object or ", (0,jsx_runtime.jsx)(_components.code, {
              children: "null"
            })]
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["These checks match native Kubernetes data rules, not credential validity.\nAdditional keys are allowed. Custom types have no application allowlist or\n64-character cap; bootstrap token types retain Kubernetes' unconstrained data\nsemantics. Empty create types default to ", (0,jsx_runtime.jsx)(_components.code, {
        children: "Opaque"
      }), "."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "kubernetes.io/service-account-token"
      }), " ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "creation, editing, and restore are unsupported"
      }), ".\nCreate, PUT (even metadata-only), and restore return 422 with TokenRequest/controller guidance\nbefore history or live writes. Their controller-owned lifecycle must be managed\nthrough native token APIs/controllers; the Opaque archive format does not enable\ntoken mutation support. Deletion retains the normal authorization policy."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "list-secrets",
      children: "List secrets"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-http",
        children: "GET /api/namespaces/:namespace/secrets\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{\n  \"namespace\": \"krypton-test\",\n  \"secrets\": [{ \"...\": \"SecretSummary[]\" }],\n  \"canCreate\": true\n}\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["History snapshots are excluded ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "at Kubernetes"
      }), " with ", (0,jsx_runtime.jsx)(_components.code, {
        children: "<annotation-prefix>/kind!=history"
      }), ".\nThe server follows all pages within 5,000 objects / 32 MiB / 100 pages, keeping\ncomplete per-user options. Annotation-only managed Secrets remain eligible: the\nselector does not require a managed label. Current live ACLs and the ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "managed-by\nannotation"
      }), " are checked after collection, including in legacy mode. Identical\nduplicates appear once; failed/inconsistent/over-budget lists return an error, not\na truncated result. Unmanaged secrets are excluded when\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "KRYPTON_MANAGED_ONLY=true"
      }), ". ", (0,jsx_runtime.jsx)(_components.code, {
        children: "canCreate"
      }), " is a UX hint (namespace rules only) —\nPOST still enforces server-side.\nFor non-admins, an unavailable/invalid namespace policy returns\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "503 { \"error\": \"Namespace access policy is unavailable\" }"
      }), " for the whole list,\neven if there are no items or all items have explicit ACLs: ", (0,jsx_runtime.jsx)(_components.code, {
        children: "canCreate"
      }), " requires\nnamespace policy. No partial list or guessed creation hint is returned."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "create-secret",
      children: "Create secret"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-http",
        children: "POST /api/namespaces/:namespace/secrets\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{\n  \"name\": \"demo-secret\",\n  \"type\": \"Opaque\",\n  \"data\": { \"API_KEY\": \"<api-key-value>\" },\n  \"description\": \"Demo\",\n  \"allowedGroups\": [\"dev-team\"],\n  \"allowedUsers\": []\n}\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "name"
        }), " must be a DNS subdomain (lowercase, ", (0,jsx_runtime.jsx)(_components.code, {
          children: "a-z0-9-."
        }), "); ", (0,jsx_runtime.jsx)(_components.code, {
          children: "type"
        }), " defaults to\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "Opaque"
        }), "; ", (0,jsx_runtime.jsx)(_components.code, {
          children: "data"
        }), " defaults to ", (0,jsx_runtime.jsx)(_components.code, {
          children: "{}"
        }), "; an extra ", (0,jsx_runtime.jsx)(_components.code, {
          children: "stringData"
        }), " map is merged in,\ntaking precedence for overlapping keys. Both maps are ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "plaintext"
        }), ", not base64."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Invalid Unicode, binary controls, and invalid keys return 400; built-in data\nrequirements are checked after the merge and return 422. Use Kubernetes tooling\nwith base64 ", (0,jsx_runtime.jsx)(_components.code, {
          children: "data"
        }), " to create/change binary values."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "binaryData"
        }), " is a read-only response field; including it in a write request\nreturns 400 rather than silently ignoring the intended values."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "allowedGroups"
        }), " and ", (0,jsx_runtime.jsx)(_components.code, {
          children: "allowedUsers"
        }), " each allow at most 256 entries of at most\n256 UTF-8 bytes ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "before trimming"
        }), ", including surrounding whitespace. Entries\nare trimmed; comma-containing, empty, whitespace-only, or oversized entries return\n", (0,jsx_runtime.jsx)(_components.strong, {
          children: "400 before writes"
        }), ", without echoing values. Internal whitespace/case and array\norder/duplicates are preserved. Groups match exactly; user emails ignore case.\nNative annotations are comma-separated with no comma quoting/escaping, so\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "[\"team-a,team-b\"]"
        }), " is rejected rather than expanded into two principals."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Omitted create ACLs default to ", (0,jsx_runtime.jsx)(_components.code, {
          children: "[]"
        }), "; empty arrays store empty annotations. If both\nare empty, namespace fallback applies and may intentionally be open."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Creation is gated by ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "namespace rules alone"
        }), " (the secret has no annotations\nyet) → ", (0,jsx_runtime.jsx)(_components.code, {
          children: "403"
        }), " when excluded, ", (0,jsx_runtime.jsx)(_components.code, {
          children: "503"
        }), " when required policy is unavailable or invalid."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Answers ", (0,jsx_runtime.jsx)(_components.code, {
          children: "201 { \"secret\": SecretSummary }"
        }), ", stamping\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton.io/managed-by: krypton"
        }), " and ", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton.io/version: 1"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "409"
        }), " when the name already exists; ", (0,jsx_runtime.jsx)(_components.code, {
          children: "400"
        }), " on invalid individual data maps or\nmalformed JSON/UTF-8; ", (0,jsx_runtime.jsx)(_components.code, {
          children: "413"
        }), " on an over-16-MiB stream/envelope or an oversized\nmerged data map. The native/conservative data limit remains separate from JSON\nescaping overhead; see the shared budgets."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "read-secret",
      children: "Read secret"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-http",
        children: "GET /api/namespaces/:namespace/secrets/:name\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Answers ", (0,jsx_runtime.jsx)(_components.code, {
        children: "{ \"secret\": SecretDetail }"
      }), " — text ", (0,jsx_runtime.jsx)(_components.code, {
        children: "data"
      }), " and base64 ", (0,jsx_runtime.jsx)(_components.code, {
        children: "binaryData"
      }), " included. ", (0,jsx_runtime.jsx)(_components.code, {
        children: "403"
      }), " when the\nuser fails the secret / namespace rules. Admins and explicit live ACLs take\nprecedence over namespace policy availability; fallback decisions return ", (0,jsx_runtime.jsx)(_components.code, {
        children: "503"
      }), "\non policy failure. Only confirmed 404 absence or valid empty rules are open."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Using a snapshot name as ", (0,jsx_runtime.jsx)(_components.code, {
        children: ":name"
      }), " returns ", (0,jsx_runtime.jsx)(_components.code, {
        children: "404"
      }), " for every named-secret operation,\nincluding history, restore, and restart. Use the live name's ", (0,jsx_runtime.jsx)(_components.code, {
        children: "/versions"
      }), " or\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "/restore"
      }), " endpoint; authorization always uses the current live object."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "update-secret",
      children: "Update secret"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-http",
        children: "PUT /api/namespaces/:namespace/secrets/:name\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{\n  \"data\": { \"API_KEY\": \"<rotated-value>\" },\n  \"description\": \"Demo\",\n  \"allowedGroups\": [\"dev-team\"],\n  \"allowedUsers\": [],\n  \"resourceVersion\": \"123456\"\n}\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "resourceVersion"
        }), " is ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "required"
        }), " (optimistic concurrency): a mismatch with\nthe live object is ", (0,jsx_runtime.jsx)(_components.code, {
          children: "409"
        }), " with a reload prompt, and a true write race at the\nK8s API is a second ", (0,jsx_runtime.jsx)(_components.code, {
          children: "409"
        }), " path. Omitted ", (0,jsx_runtime.jsx)(_components.code, {
          children: "description"
        }), "/", (0,jsx_runtime.jsx)(_components.code, {
          children: "allowedGroups"
        }), "/\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "allowedUsers"
        }), " keep their previous values."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Submitted ACL arrays use the same validation and trimming as create, before any\nsnapshot or live write. ", (0,jsx_runtime.jsx)(_components.code, {
          children: "[]"
        }), " clears just that annotation; omitted fields retain\ntheir stored values without rewriting them. Clearing both selects namespace fallback."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Omit ", (0,jsx_runtime.jsx)(_components.code, {
          children: "data"
        }), " to update metadata while preserving ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "all"
        }), " stored bytes. If\nsupplied, ", (0,jsx_runtime.jsx)(_components.code, {
          children: "data"
        }), " replaces the entire data map; ", (0,jsx_runtime.jsx)(_components.code, {
          children: "{}"
        }), " clears a mutable text Secret.\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "binaryData"
        }), " is a response field, not a write input (400 if supplied); the\ncreate-only ", (0,jsx_runtime.jsx)(_components.code, {
          children: "stringData"
        }), " alias is also rejected on PUT. A Secret containing binary\nvalues rejects any plaintext ", (0,jsx_runtime.jsx)(_components.code, {
          children: "data"
        }), " replacement with 422; its UI data controls\nare read-only and metadata saves omit ", (0,jsx_runtime.jsx)(_components.code, {
          children: "data"
        }), "."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "Immutable Secrets accept metadata-only updates or byte-identical data.\nAdditions, removals, and changed values return 422 before snapshots/writes.\nCreate a new Secret and update consumers to change immutable data."
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "Preserves live type, UID, owner references, finalizers, immutable state, and\nother native lifecycle metadata. The API does not expose a way to unset immutable."
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["After validation, snapshots the current state (reversible history), then replaces the\nlive object with a bumped ", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton.io/version"
        }), " and ", (0,jsx_runtime.jsx)(_components.code, {
          children: "last-modified-by"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Snapshots are immutable Opaque archives bound to the ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "live UID and exact source\nresourceVersion"
        }), ", with raw native data and the original type annotation. A\ncreate 409 is accepted only after verifying the occupied archive's binding and\nactual immutable content. Different-source/unrelated collisions return 409\nbefore replacement; history creation/pruning failures return 503 before replacement.\nSnapshot/pruning effects can remain if the subsequent live CAS write fails."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Adoption treats an absent/old-zero counter as v1: first edit saves v1 and writes\nv2, next edit saves v2 and writes v3. Native intermediate edits are not watched.\nA native edit after a failed snapshot-backed write can require reviewed counter\nrecovery; see ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/versioning-history/",
          children: "history semantics"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Answers ", (0,jsx_runtime.jsx)(_components.code, {
          children: "{ \"secret\": SecretDetail }"
        }), "; the shared input/data budgets apply before\nsnapshots or writes, including streamed 400/413 handling."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Metadata-only example:"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{ \"description\": \"Updated operator notes\", \"resourceVersion\": \"123456\" }\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "upgrade-semantics",
      children: "Upgrade semantics"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Re-fetch DTOs after upgrading. Clients that assume every ", (0,jsx_runtime.jsx)(_components.code, {
        children: "keys"
      }), " entry exists in\nplaintext ", (0,jsx_runtime.jsx)(_components.code, {
        children: "data"
      }), " must handle ", (0,jsx_runtime.jsx)(_components.code, {
        children: "binaryKeys"
      }), "/", (0,jsx_runtime.jsx)(_components.code, {
        children: "binaryData"
      }), "; they must not submit those\nbase64 values as plaintext. Omit ", (0,jsx_runtime.jsx)(_components.code, {
        children: "data"
      }), " for binary/immutable metadata edits.\nPreviously unchecked built-in payloads now fail before side effects, and\ncontroller-owned service-account token writes fail explicitly. The upgrade does\nnot rewrite existing bytes; earlier lossy writes require an intact history copy\nor external backup for recovery."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Previously accepted comma-containing and whitespace-only ACL entries now return\n400. Existing annotations retain their CSV split/trim/drop-blank read semantics;\nthere is no format migration or automatic recovery of earlier array intent. Review\naffected live ACLs and update API callers/all writer replicas. Namespace ConfigMap\nJSON arrays still support exact comma-containing principals. The UI still parses\ncomma-list text into separate nonblank entries; see\n", (0,jsx_runtime.jsx)(_components.a, {
        href: "/guides/authorization/#per-secret-annotations",
        children: "ACL representation and upgrade details"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "delete-secret",
      children: "Delete secret"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-http",
        children: "DELETE /api/namespaces/:namespace/secrets/:name?resourceVersion=123456[&keepHistory=true]\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "required-query-contract",
      children: "Required query contract"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "resourceVersion"
        }), ": ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "required"
        }), ", nonblank opaque string from the loaded live\ndetail. URL-encode it; do not send the app-level ", (0,jsx_runtime.jsx)(_components.code, {
          children: "version"
        }), " counter or a DELETE\nbody. Missing/blank or duplicate values return 400."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "keepHistory"
        }), ": optional ", (0,jsx_runtime.jsx)(_components.code, {
          children: "true"
        }), " or ", (0,jsx_runtime.jsx)(_components.code, {
          children: "false"
        }), ", default false; other or duplicate\nvalues return 400. ", (0,jsx_runtime.jsx)(_components.code, {
          children: "true"
        }), " skips all history listing/deletion and retains copies\nfor operator recovery."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["After live authorization, a stale revision returns ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "409 before history access\nor any mutation"
        }), ". Each retry must be an explicit intent based on reloaded data.\nA fresh authorization denial still returns 403; hidden live objects return 404."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "ordered-cleanup-and-native-preconditions",
      children: "Ordered cleanup and native preconditions"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ol, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["List only eligible bound snapshots for the authorized ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "live UID"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Recheck that live UID/resourceVersion before each snapshot delete. Delete each\nsnapshot with ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "its own UID/resourceVersion preconditions"
        }), ", then confirm absence.\nA final eligible inventory must be empty before proceeding."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Recheck the authorized live revision, then DELETE with ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "live UID and\nresourceVersion preconditions"
        }), ". These protect a concurrent ACL/data change or\nsame-name replacement even if it races the recheck."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "Confirm live absence by reading the name. A successful Kubernetes DELETE alone\nis insufficient: finalizers may leave a terminating Secret."
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["History list/delete/absence-check failures, still-present snapshots, or newly added\nhistory return ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "503"
      }), " without attempting live deletion. Snapshot precondition\nconflicts and changed/disappeared live objects during the operation return ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "409"
      }), ".\nCleanup may already be partial, but this request leaves the live authorization\nobject available if cleanup fails, allowing a fresh request to retry remaining work.\nIf a live deletion itself fails or cannot be confirmed, the result is an error;\nits outcome may be uncertain, so reload before retrying."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "result-union",
      children: "Result union"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.strong, {
        children: "200"
      }), ", confirmed absent after deletion:"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{ \"status\": \"deleted\", \"name\": \"demo-secret\", \"deleted\": \"demo-secret\", \"uid\": \"source-uid\", \"history\": \"cleaned\" }\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.strong, {
        children: "202"
      }), ", deletion requested but the same UID is still present:"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-json",
        children: "{ \"status\": \"pending\", \"name\": \"demo-secret\", \"uid\": \"source-uid\", \"resourceVersion\": \"123457\", \"deletionTimestamp\": \"2026-10-12T12:00:00.000Z\", \"history\": \"cleaned\" }\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "deletionTimestamp"
      }), " is optional. The pending result has ", (0,jsx_runtime.jsxs)(_components.strong, {
        children: ["no ", (0,jsx_runtime.jsx)(_components.code, {
          children: "deleted"
        }), " field"]
      }), ";\nclients must not report permanent deletion or remove the live row on 202. GET/list\nalso report the optional timestamp. Reload to check progress and obtain the latest\nresourceVersion, including changes caused by finalizers. A different UID observed\nafter the accepted DELETE returns 409 rather than reporting that replacement as deleted."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "history"
      }), " is ", (0,jsx_runtime.jsx)(_components.code, {
        children: "\"retained\""
      }), " for ", (0,jsx_runtime.jsx)(_components.code, {
        children: "keepHistory=true"
      }), ", otherwise ", (0,jsx_runtime.jsx)(_components.code, {
        children: "\"cleaned\""
      }), ". ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "Cleaned\nmeans the eligible inventory was confirmed empty before live deletion, not an\natomic erase of all copies."
      }), " Snapshot cleanup and live deletion are separate\nKubernetes requests. Earlier deletions are not rolled back after a later conflict;\na concurrent writer holding an earlier live read may create history after the\nlast inventory, even after live deletion. Rechecks do not lock authorization\nacross objects. Such leftovers need operator cleanup if the live object is gone.\nPredecessor UIDs, kept history, quarantined legacy/malformed objects, and external\nbackups are outside this cleanup. Retained snapshots never attach to a recreated name."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "upgrade-and-ui-recovery",
      children: "Upgrade and UI recovery"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Older clients must supply the expected revision and handle the 200/202 result\nunion. The UI offers ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "Reload latest"
      }), " on errors: it fetches fresh live ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "and"
      }), "\nhistory data, then closes the confirmation for review; a failed reload retains\nthe error. Confirmed deletion cancels outstanding reads, removes the relevant\ndetail/history caches, and refreshes the namespace list. Pending deletion refreshes\nthose queries and remains visible as pending."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "related-pages",
      children: "Related pages"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/api/versions/",
          children: "Versions"
        }), " and ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/api/restore/",
          children: "Restore"
        }), " for history."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/guides/authorization/",
          children: "Authorization"
        }), " for the 403/404 gating order."]
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