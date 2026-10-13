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
var site_docs_guides_versioning_history_mdx_8bd_namespaceObject = JSON.parse('{"id":"guides/versioning-history","title":"Versioning & History","description":"Kubernetes overwrites Secrets in place. Before an update or restore, Krypton","source":"@site/docs/guides/versioning-history.mdx","sourceDirName":"guides","slug":"/guides/versioning-history","permalink":"/guides/versioning-history","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":7,"frontMatter":{"sidebar_label":"Versioning & History","sidebar_position":7},"sidebar":"guides","previous":{"title":"Authorization","permalink":"/guides/authorization"},"next":{"title":"Consumer Restarts","permalink":"/guides/consumer-restarts"}}')
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
  "value": "Verified retries and external changes",
  "id": "verified-retries-and-external-changes",
  "level": 3
}, {
  "value": "Retention and partial operations",
  "id": "retention-and-partial-operations",
  "level": 3
}, {
  "value": "Upgrade and operator-reviewed recovery",
  "id": "upgrade-and-operator-reviewed-recovery",
  "level": 2
}, {
  "value": "Delete and keep-history semantics",
  "id": "delete-and-keep-history-semantics",
  "level": 3
}, {
  "value": "Restores are reversible",
  "id": "restores-are-reversible",
  "level": 2
}, {
  "value": "Viewing text values",
  "id": "viewing-text-values",
  "level": 3
}, {
  "value": "Binary viewing and data-contract upgrade",
  "id": "binary-viewing-and-data-contract-upgrade",
  "level": 3
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
    h3: "h3",
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
        id: "versioning--history",
        children: "Versioning & History"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Kubernetes overwrites Secrets in place. Before an update or restore, Krypton\narchives the previous data in an immutable Secret bound to that live object's\nUID and exact resourceVersion. Restores preserve the original bytes and current\nlive access rules, with rollback available within the retained history."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "how-snapshots-work",
      children: "How snapshots work"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Created Secrets start at ", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton.io/version=1"
        }), ". An adopted Secret with no\ncounter (or the old ", (0,jsx_runtime.jsx)(_components.code, {
          children: "0"
        }), " counter) is logically ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "v1"
        }), ". Its first edit archives\nv1 and writes v2; its next archives v2 and writes v3. Snapshot vN is the state\nbeing replaced, not the new state. Invalid/exhausted counters are rejected."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Storage names are ", (0,jsx_runtime.jsx)(_components.code, {
          children: "krypton-h-<UID hash>-vN"
        }), ", at most ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "60 characters"
        }), " even for\n253-character live names. Hashes are the first 32 lowercase hex characters of\nSHA-256. The live name is stored in an annotation, never a label value."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Each snapshot is an ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "Opaque"
        }), " Secret with ", (0,jsx_runtime.jsx)(_components.strong, {
          children: (0,jsx_runtime.jsx)(_components.code, {
            children: "immutable: true"
          })
        }), " and a copy of\nnative base64 ", (0,jsx_runtime.jsx)(_components.code, {
          children: "data"
        }), ". Live owner references, finalizers, managed fields, and\ncontroller annotations are not copied, so the archive does not acquire the\nsource's controller lifecycle. Original type is retained for inspection."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Labels (using the configured annotation prefix) are ", (0,jsx_runtime.jsx)(_components.code, {
          children: "managed-by=krypton"
        }), ",\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "kind=history"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "source-uid=<UID hash>"
        }), ", and\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "source-resource-version=<resourceVersion hash>"
        }), ". Lists select by source UID\nand kind; returned objects must also pass full binding/format validation."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Annotations retain ", (0,jsx_runtime.jsx)(_components.code, {
          children: "history-format=uid-rv-v1"
        }), ", full ", (0,jsx_runtime.jsx)(_components.code, {
          children: "source-uid"
        }), " and\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "source-resource-version"
        }), ", readable ", (0,jsx_runtime.jsx)(_components.code, {
          children: "history-of"
        }), " name, ", (0,jsx_runtime.jsx)(_components.code, {
          children: "source-type"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "version"
        }), ",\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "snapshot-at"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "snapshot-by"
        }), ", and the source description/ACLs. Hashes are only\nindexing keys; a matching hash or name never proves identity on its own."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "verified-retries-and-external-changes",
      children: "Verified retries and external changes"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["A version slot is reserved for one exact source UID/resourceVersion. On snapshot\ncreate ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "409"
      }), ", Krypton reads the occupied object and verifies full identity,\nimmutable status, actual byte content and own keys, original type, and copied\nsource description/ACLs. A mutable fingerprint annotation is not sufficient.\nThe first successful snapshot's actor/time remain on exact-source retries.\nUnrelated objects, different source revisions, changed bytes, active controller\nownership, finalizers, or terminating snapshots block the live replacement.\nSuccessful create responses are checked too, including admission-altered content."]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Two replicas saving the same source can share one verified snapshot; the native\nlive UID/resourceVersion replacement preconditions still admit only one write.\nThere is no process-local counter or lock. ResourceVersions are treated as opaque\nstrings, not sorted or parsed as version numbers."
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Krypton does not watch every native edit: it captures the state visible when an\nupdate/restore is attempted. Normal external changes after a successful Krypton\nwrite are captured at their new resourceVersion. If a snapshot was saved but the\nlive write failed, an external change can leave the ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "same app counter with a\ndifferent resourceVersion"
      }), ". This returns a source-conflict 409, even for a\nmetadata-only external change, rather than discarding either rollback state.\nSee ", (0,jsx_runtime.jsx)(_components.a, {
        href: "#upgrade-and-operator-reviewed-recovery",
        children: "recovery"
      }), " below."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "retention-and-partial-operations",
      children: "Retention and partial operations"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "KRYPTON_HISTORY_LIMIT"
      }), " must be a decimal integer ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "1–100"
      }), ", default ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "20"
      }), " when\nunset. Empty, zero, negative, fractional, malformed (including whitespace/leading\nzeros), or out-of-range values produce 503 before history writes; ", (0,jsx_runtime.jsx)(_components.code, {
        children: "/api/config"
      }), "\nalso returns a configuration error. Zero is not a history-disable/unlimited mode."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["After saving or verifying a source snapshot, Krypton prunes the oldest eligible\nsnapshots for that ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "live UID"
      }), ", ordered by app counter. Cleanup reads only\nmetadata from the native records; it never decodes values into text/DTOs. Deletes\nare serial, with each snapshot's UID and resourceVersion preconditions. A 404 is\nalready absent; other failures or a still-present object (including finalizers)\nreturn ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "503"
      }), " with confirmed-absent/pending/failed counts and block the live\nreplacement. Exact-source retries retry pruning. A changed/missing source archive\nor a counter behind newer retained history blocks the write with 409."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["These are separate Kubernetes operations, not an atomic transaction. A failed\nreplacement can leave a snapshot, and pruning may already have removed older\nhistory. A snapshot can therefore have the same version as the current live\nobject: history is ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "pre-write captures, not a successful-commit log"
      }), ". Cleanup\nfailures can leave more than the configured limit until repaired. Retention is\napplied on update/restore attempts, not by a background sweeper. Legacy/quarantined\ncopies and retained predecessor UIDs are outside that automatic retention policy."]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Inspect them directly — they are ordinary Secrets:"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "kubectl get secret -n krypton-test -l krypton.io/kind=history\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["In Krypton's API, history is reached through the ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "live secret's"
      }), " ", (0,jsx_runtime.jsx)(_components.code, {
        children: "/versions"
      }), "\nand ", (0,jsx_runtime.jsx)(_components.code, {
        children: "/restore"
      }), " endpoints. Both authorize its current ACL before accessing any\nsnapshot. Snapshot names themselves return 404 on all named-secret routes, even\nfor admins and with ", (0,jsx_runtime.jsx)(_components.code, {
        children: "KRYPTON_MANAGED_ONLY=false"
      }), "; historical ACLs do not grant\ncurrent access."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The history panel distinguishes loading, a successfully empty history, permission\ndenial, and an unavailable response. ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "Retry history"
      }), " refetches after a failure;\nfailed refreshes do not display cached restore choices as current or imply that\nsnapshots were erased."]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Deleting and recreating the same live name produces a new UID and a separate\nhistory lifetime. Kept predecessor snapshots are neither listed/restored nor\npruned/deleted through the replacement's endpoints."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "upgrade-and-operator-reviewed-recovery",
      children: "Upgrade and operator-reviewed recovery"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Upgrade writer replicas together; mixed older/newer writers retain the old\nname-only behavior on the older replicas. Keep the annotation prefix, format,\nand retention settings consistent across replicas. The upgrade does not rewrite\nor relabel existing Secrets; changing the annotation prefix is a separate schema\nmigration, not an automatic way to transfer history."
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.strong, {
        children: "Legacy history is quarantined."
      }), " Old ", (0,jsx_runtime.jsx)(_components.code, {
        children: "<name>-vN"
      }), " snapshots do not prove a live\nUID or exact source revision and were not immutable. Objects missing the new\nbinding/format (including partially retagged objects) and malformed records are\nexcluded from automatic version listing, restore, pruning, and delete cleanup.\nThere is no legacy bypass, including for admins. An empty version list after an\nupgrade does not mean old copies were erased. Recreating a Secret, including\nthrough backup restore with a new UID, does not reattach those copies."]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "An operator with native Kubernetes access can recover reviewed data:"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ol, {
      children: ["\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "Inventory history metadata in the intended namespace. Establish provenance\nfrom trusted audit/backup records and the source object's lifetime. A recycled\nname, copied ACL, or timestamp alone is insufficient proof of ownership."
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Review the chosen raw values and destination type/access/lifecycle requirements.\nRecover only the approved native base64 ", (0,jsx_runtime.jsx)(_components.code, {
          children: "data"
        }), " into a reviewed live Secret.\nFor an existing target, use current UID/resourceVersion preconditions and\npreserve its ACLs, owners, finalizers, type, and immutable rules. Binary base64\nmust not be submitted to Krypton's plaintext ", (0,jsx_runtime.jsx)(_components.code, {
          children: "data"
        }), " input."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "Keep the original archive quarantined until explicit operator cleanup. Do not\ninvent source-UID/revision annotations or relabel legacy objects to force the\napp to accept them. Future Krypton edits create new bound snapshots of the\nrecovered live state; old app-version numbers are not automatically imported."
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["For a ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "different-source slot conflict"
      }), ", first reload and review the current live\nUID/RV and occupied snapshot's identity/content. Once its provenance is established,\nan operator can CAS-update only the live ", (0,jsx_runtime.jsx)(_components.code, {
        children: "version"
      }), " annotation to an unused positive\ncounter above that UID's retained history, then reload and retry. The next operation\narchives the current source at that new counter; existing archives stay intact.\nThe same review is needed for a reset/malformed counter. Resolve failed verification\nreads, admission changes, RBAC/quota errors, or finalizers at their cause rather than\noverwriting or retagging a conflicting archive. Snapshot immutability protects data,\nnot metadata or deletion by Kubernetes-authorized writers; it is not a signed backup."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "delete-and-keep-history-semantics",
      children: "Delete and keep-history semantics"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "DELETE"
      }), " requires the loaded live ", (0,jsx_runtime.jsx)(_components.code, {
        children: "resourceVersion"
      }), " as a URL-encoded query parameter.\nA stale revision conflicts before history access or writes. Eligible snapshots for\nthat ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "live UID"
      }), " are cleaned up ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "first"
      }), ", unless ", (0,jsx_runtime.jsx)(_components.code, {
        children: "keepHistory=true"
      }), ". The live\nauthorization object is rechecked before each cleanup mutation; each snapshot\ndelete has its own UID/RV preconditions and absence check. A final history inventory\nmust be empty, and a final live recheck precedes the UID/RV-conditional live DELETE.\nChanged live objects and snapshot precondition conflicts return 409; failed/pending\nhistory cleanup returns 503 without attempting live deletion, so it can be retried."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsxs)(_components.strong, {
        children: ["200 ", (0,jsx_runtime.jsx)(_components.code, {
          children: "status: \"deleted\""
        })]
      }), " confirms live absence after deletion. ", (0,jsx_runtime.jsxs)(_components.strong, {
        children: ["202\n", (0,jsx_runtime.jsx)(_components.code, {
          children: "status: \"pending\""
        })]
      }), " means the same live UID remains, commonly due to finalizers.\nThe UI stays on the Secret and reports pending status instead of permanent deletion.\nLive GET/list DTOs include optional ", (0,jsx_runtime.jsx)(_components.code, {
        children: "deletionTimestamp"
      }), "; reload for current data and\nresourceVersion before retrying. A failed confirmation returns an error rather than\nguessing success. See the ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/api/secrets/#delete-secret",
        children: "DELETE request/result contract"
      }), "."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Kubernetes provides no atomic transaction across live/history objects. Earlier\ncleanup is not rolled back after a later conflict or failure; a recheck does not\nlock authorization across objects. ", (0,jsx_runtime.jsx)(_components.code, {
        children: "history: \"cleaned\""
      }), " describes the eligible\ninventory checked before live deletion. An in-flight writer holding an earlier\nlive read can add history after that check, even after deletion. If the live object\nhas gone, an operator must remove such leftovers. Live-delete transport/confirmation\nfailures can have an uncertain outcome; reload before retrying. There is no claim\nof atomic erasure and no background cleanup job."]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Kept snapshots have no live owner reference and survive for operator forensics.\nThey cannot be accessed through a later same-name Secret. Legacy/quarantined\nobjects and predecessor lifetimes need explicit operator cleanup with their own\nUID/RV preconditions; deleting the current live name does not erase all such copies."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "restores-are-reversible",
      children: "Restores are reversible"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Restore requires both the target app ", (0,jsx_runtime.jsx)(_components.code, {
        children: "version"
      }), " and the expected live\n", (0,jsx_runtime.jsx)(_components.code, {
        children: "resourceVersion"
      }), ". It snapshots the ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "current"
      }), " state first, then replaces the live object\nwith the target version's data (bumping ", (0,jsx_runtime.jsx)(_components.code, {
        children: "krypton.io/version"
      }), " again). Rolling\nback never destroys the state you rolled back from — within the history limit."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Data is restored from the snapshot's ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "original base64"
      }), ", without a text\ndecode/re-encode. Binary bytes, Unicode BOMs, and special keys such as ", (0,jsx_runtime.jsx)(_components.code, {
        children: "__proto__"
      }), "\nsurvive. The current live type, UID, owner references, finalizers, immutable\nstate, description, and access rules remain in place; restoring data does not\nroll back ownership or access policy."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Native type/immutable checks run ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "before"
      }), " saving the current state. Immutable\nSecrets reject data changes (422) and have disabled UI restore controls;\nbyte-identical API restores are allowed. Their metadata can still be edited.\nService-account tokens cannot be created, edited, or restored through Krypton:\nuse Kubernetes TokenRequest or controller management instead of creating\nindependent snapshots."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "viewing-text-values",
      children: "Viewing text values"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.strong, {
        children: "Expand value"
      }), " on a live or historical text entry opens Preview; ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "Raw"
      }), " and\n", (0,jsx_runtime.jsx)(_components.strong, {
        children: "Copy"
      }), " provide the original full text. Markdown images appear as descriptive\ntext without loading embedded resources. Raw HTML stays inert, and safe links\nopen only when activated, in a new tab without an opener or referrer."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Values above ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "131,072 UTF-16 code units"
      }), " (", (0,jsx_runtime.jsx)(_components.code, {
        children: "String.length"
      }), ") fall back to escaped\nraw text before Markdown parsing or syntax highlighting, with a short notice.\nOrdinary Markdown/JSON/YAML/XML previews and plain PEM viewing remain available\nwithin that shared limit. The fallback does not truncate the value or alter\nhistory, Raw, or Copy. See ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/about/security-model/#local-value-previews",
        children: "Local value previews"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "binary-viewing-and-data-contract-upgrade",
      children: "Binary viewing and data-contract upgrade"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Live detail and history now separate lossless plaintext ", (0,jsx_runtime.jsx)(_components.code, {
        children: "data"
      }), " from original\nbase64 ", (0,jsx_runtime.jsx)(_components.code, {
        children: "binaryData"
      }), "; ", (0,jsx_runtime.jsx)(_components.code, {
        children: "binaryKeys"
      }), " names non-text entries and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "keys"
      }), " covers both.\nBinary values are masked and can be viewed/copied as base64. To edit a\nbinary-containing Secret, update metadata in Krypton or use Kubernetes tooling\nto change bytes. API metadata edits ", (0,jsx_runtime.jsxs)(_components.strong, {
        children: ["omit ", (0,jsx_runtime.jsx)(_components.code, {
          children: "data"
        })]
      }), ", preserving the entire raw map.\nDo not round-trip a DTO by submitting only its text subset or treating base64 as\nplaintext. Re-fetch client caches after upgrading. The upgrade itself does not\nrewrite stored data or repair bytes already lost by older lossy edits; recover\nthose from an intact snapshot or external backup."]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "curl --cookie \"krypton_session=$ALICE\" \\\n  localhost:3000/api/namespaces/krypton-test/secrets/database-credentials/versions\ncurl --cookie \"krypton_session=$ALICE\" -X POST \\\n  -H 'Content-Type: application/json' -d '{\"version\":1,\"resourceVersion\":\"123456\"}' \\\n  localhost:3000/api/namespaces/krypton-test/secrets/database-credentials/restore\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "optimistic-concurrency-409s",
      children: "Optimistic concurrency (409s)"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["For ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "PUT, restore, and DELETE"
      }), ", clients send the live ", (0,jsx_runtime.jsx)(_components.code, {
        children: "metadata.resourceVersion"
      }), "\nthey loaded; stale operations return 409 before history side effects. Native\nUID/resourceVersion CAS protects the eventual restore replacement or delete if\nanother writer changes the object after the read. History effects from an in-flight\noperation can remain after that later conflict."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["On the ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "edit form"
      }), ", the draft's fields and original resourceVersion stay pinned\ntogether, including across background refreshes, reconnects, and retained client\nnavigation. A newer query result does not silently authorize an old draft to\noverwrite it. ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "Reload latest"
      }), " explicitly refetches the live Secret: success resets\nall fields, pending bulk text, value visibility, and the revision together. Review\nthe loaded state and re-apply your changes before saving. Failure preserves the\ndraft and original revision and offers another reload attempt. Successful saves\nupdate the retained form baseline to the returned Secret. Drafts remain in memory,\nnot browser storage, and may be lost on a full reload or when the retained page is\nevicted."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["For restore/delete, ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "Reload latest"
      }), " fetches fresh live and history data, then\ncloses the confirmation so the new state can be reviewed. Failed reloads retain\nthe error and do not retry the mutation. After upgrading, older restore/delete\nclients must send the expected revision and distinguish pending from confirmed\ndeletion. A pending Secret cannot be restored."]
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
      }), "). History\nsnapshots count as separate objects and consume namespace storage/quota. Snapshot\ncreation or cleanup failure blocks the live replacement.\nRaw restores and metadata-only updates use Kubernetes' decoded-data size bound,\nso valid native binary data is not rejected merely for base64 inflation."]
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