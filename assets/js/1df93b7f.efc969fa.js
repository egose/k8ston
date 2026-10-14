"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["452"], {
5146(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (Home)
});
/* import */ var react_jsx_runtime__rspack_import_0 = __webpack_require__(4686);
/* import */ var _docusaurus_Link__rspack_import_1 = __webpack_require__(4613);
/* import */ var _theme_Layout__rspack_import_2 = __webpack_require__(4655);



const GREEN = '!text-[#3ECF8E]';
function Icon({ path }) {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("path", {
                stroke: "none",
                d: "M0 0h24v24H0z",
                fill: "none"
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("path", {
                d: path
            })
        ]
    });
}
const ICONS = {
    table: 'M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14z M3 10h18 M10 3v18',
    history: 'M3 12a9 9 0 1 0 9 -9 M3 5v4h4 M12 7v5l3 2',
    lock: 'M5 11h14v10h-14z M8 11v-4a4 4 0 0 1 8 0v4',
    key: 'M15 9a4 4 0 1 0 -4 4 M15 9l6 0 M15 9l0 6 M11 13l-7 7',
    refresh: 'M21 12a9 9 0 1 1 -2.64 -6.36 M21 3v6h-6',
    terminal: 'M4 17l6 -6l-6 -6 M12 19h8'
};
function Eyebrow({ children }) {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("p", {
        className: `!text-[13px] !font-medium !tracking-wide ${GREEN}`,
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                className: "!mr-2 !inline-block !h-1.5 !w-1.5 !rounded-full !bg-[#3ECF8E]"
            }),
            children
        ]
    });
}
function SectionHeading({ children }) {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("h2", {
        className: "!mt-3 !max-w-xl !text-3xl !font-semibold !tracking-tight !text-white sm:!text-4xl",
        children: children
    });
}
function SectionSub({ children }) {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
        className: "!mt-3 !max-w-xl !text-[15px] !leading-7 !text-zinc-400",
        children: children
    });
}
function Card({ children, className = '' }) {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
        className: `!min-w-0 !rounded-xl !border !border-white/10 !bg-[#111111] !p-5 ${className}`,
        children: children
    });
}
function CardHeader({ icon, title, description }) {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                className: "!flex !items-center !gap-2 !text-zinc-200",
                children: [
                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                        className: `!inline-flex ${GREEN}`,
                        children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(Icon, {
                            path: icon
                        })
                    }),
                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("h3", {
                        className: "!m-0 !text-[15px] !font-semibold",
                        children: title
                    })
                ]
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                className: "!mt-2 !text-[13px] !leading-6 !text-zinc-500",
                children: description
            })
        ]
    });
}
function Hero() {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("section", {
        className: "!relative !overflow-hidden !border-b !border-white/5",
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                className: "!pointer-events-none !absolute !inset-x-0 !top-0 !h-72 !bg-[radial-gradient(ellipse_50%_100%_at_50%_0%,_rgba(62,207,142,0.09),_transparent)]"
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                className: "!relative !mx-auto !grid !max-w-6xl !gap-10 !px-6 !pb-14 !pt-16 lg:!grid-cols-[1.2fr_0.8fr] lg:!items-end lg:!px-8 lg:!pt-24",
                children: [
                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                        children: [
                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("h1", {
                                className: "!text-4xl !font-semibold !leading-[1.1] !tracking-tight !text-white sm:!text-5xl",
                                children: [
                                    "Manage Kubernetes secrets ",
                                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("br", {}),
                                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                        className: GREEN,
                                        children: "without touching kubectl."
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                className: "!mt-6 !flex !flex-wrap !gap-3",
                                children: [
                                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(_docusaurus_Link__rspack_import_1/* ["default"] */.A, {
                                        className: "!inline-flex !items-center !rounded-md !bg-[#3ECF8E] !px-4 !py-2 !text-sm !font-medium !text-black !no-underline !transition hover:!bg-[#4be19d]",
                                        to: "/about/quick-start/",
                                        children: "Open Quick Start"
                                    }),
                                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(_docusaurus_Link__rspack_import_1/* ["default"] */.A, {
                                        className: "!inline-flex !items-center !rounded-md !border !border-white/15 !bg-white/5 !px-4 !py-2 !text-sm !font-medium !text-zinc-200 !no-underline !transition hover:!bg-white/10",
                                        to: "/guides/sandbox/",
                                        children: "Try the Sandbox"
                                    })
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                        className: "!max-w-md !text-sm !leading-7 !text-zinc-400 lg:!justify-self-end",
                        children: "K8ston is a lightweight UI and API backed directly by native Secret objects. SSO proves who you are, annotations decide what you may see, and every change is versioned — with Velero, GitOps, and RBAC still in charge underneath."
                    })
                ]
            })
        ]
    });
}
function MaskedRow({ name, meta, revealed }) {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
        className: "!flex !items-center !justify-between !rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2",
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                className: "!min-w-0",
                children: [
                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                        className: "!truncate !font-mono !text-[11px] !text-zinc-300",
                        children: name
                    }),
                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                        className: "!font-mono !text-[11px] !text-zinc-600",
                        children: revealed ?? '••••••••••'
                    })
                ]
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                className: "!ml-3 !shrink-0 !font-mono !text-[10px] !text-zinc-500",
                children: meta
            })
        ]
    });
}
function BentoGrid() {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("section", {
        className: "!border-b !border-white/5",
        children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
            className: "!mx-auto !max-w-6xl !px-6 !py-14 lg:!px-8",
            children: [
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                    className: "!grid !gap-4 md:!grid-cols-2 lg:!grid-cols-3",
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)(Card, {
                            children: [
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(CardHeader, {
                                    icon: ICONS.table,
                                    title: "Secrets dashboard",
                                    description: "Browse namespaces, create and edit secrets with masked values until you reveal them."
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                    className: "!mt-4 !space-y-2",
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(MaskedRow, {
                                            name: "database-credentials",
                                            meta: "v3 \xb7 2 keys"
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(MaskedRow, {
                                            name: "feature-flags",
                                            meta: "v1 \xb7 5 keys",
                                            revealed: "postgres://…"
                                        })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)(Card, {
                            children: [
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(CardHeader, {
                                    icon: ICONS.history,
                                    title: "One-click rollbacks",
                                    description: "Every write snapshots first into <name>-vN. Restores are reversible by construction."
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                    className: "!mt-4 !space-y-2 !font-mono !text-[11px]",
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                            className: "!flex !items-center !justify-between !rounded-md !border !border-[#3ECF8E]/25 !bg-[#3ECF8E]/5 !px-3 !py-2",
                                            children: [
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: "!text-zinc-200",
                                                    children: "v3 \xb7 current"
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: GREEN,
                                                    children: "● live"
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                            className: "!flex !items-center !justify-between !rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2",
                                            children: [
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: "!text-zinc-500",
                                                    children: "v2 \xb7 alice \xb7 09:30"
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: "!text-zinc-600",
                                                    children: "restore →"
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                            className: "!flex !items-center !justify-between !rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2",
                                            children: [
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: "!text-zinc-500",
                                                    children: "v1 \xb7 bob \xb7 Tue"
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: "!text-zinc-600",
                                                    children: "restore →"
                                                })
                                            ]
                                        })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)(Card, {
                            children: [
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(CardHeader, {
                                    icon: ICONS.lock,
                                    title: "Hybrid authorization",
                                    description: "Per-secret annotations override one namespace fallback. Admins always pass."
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                    className: "!mt-4 !space-y-2 !font-mono !text-[11px]",
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                            className: "!rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2 !text-zinc-400",
                                            children: [
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: "!text-zinc-600",
                                                    children: "allowed-groups:"
                                                }),
                                                " dev-team"
                                            ]
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                            className: "!rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2 !text-zinc-400",
                                            children: [
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: "!text-zinc-600",
                                                    children: "allowed-users:"
                                                }),
                                                " alice@company.com"
                                            ]
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                                            className: "!rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2 !text-zinc-600",
                                            children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                children: "no rules → open to all authenticated"
                                            })
                                        })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)(Card, {
                            children: [
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(CardHeader, {
                                    icon: ICONS.key,
                                    title: "OIDC SSO",
                                    description: "Keycloak, Entra ID, Okta, Google, GitHub. Users never need cluster credentials."
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                    className: "!mt-4 !rounded-md !border !border-white/5 !bg-black/40 !p-3",
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                                            className: "!rounded-md !bg-[#3ECF8E] !px-3 !py-2 !text-center !text-[12px] !font-medium !text-black",
                                            children: "Continue with Keycloak"
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                                            className: "!mt-3 !flex !items-center !justify-center !gap-2",
                                            children: [
                                                'Entra ID',
                                                'Okta',
                                                'Google',
                                                'GitHub'
                                            ].map((p)=>/*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: "!rounded-full !border !border-white/10 !px-2 !py-0.5 !text-[10px] !text-zinc-500",
                                                    children: p
                                                }, p))
                                        })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)(Card, {
                            children: [
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(CardHeader, {
                                    icon: ICONS.refresh,
                                    title: "Consumer restarts",
                                    description: "Env-var consumers need a rollout after edits. Volume mounts sync on their own."
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                    className: "!mt-4 !space-y-2 !font-mono !text-[11px]",
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                            className: "!flex !items-center !justify-between !rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2",
                                            children: [
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: "!text-zinc-400",
                                                    children: "deploy/api-server"
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: GREEN,
                                                    children: "restarted ✓"
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                            className: "!flex !items-center !justify-between !rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2",
                                            children: [
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: "!text-zinc-400",
                                                    children: "sts/cache"
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: "!text-zinc-600",
                                                    children: "volume \xb7 auto-sync"
                                                })
                                            ]
                                        })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)(Card, {
                            children: [
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(CardHeader, {
                                    icon: ICONS.terminal,
                                    title: "REST API",
                                    description: "Drive everything from scripts: CRUD, versions, restores, restarts, auth, config."
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                    className: "!mt-4 !space-y-2 !font-mono !text-[11px]",
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                            className: "!flex !items-center !justify-between !rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2",
                                            children: [
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: "!text-zinc-400",
                                                    children: "GET /api/namespaces"
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: GREEN,
                                                    children: "200"
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                            className: "!flex !items-center !justify-between !rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2",
                                            children: [
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: "!text-zinc-400",
                                                    children: "PUT …/demo-secret"
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: GREEN,
                                                    children: "200"
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                            className: "!flex !items-center !justify-between !rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2",
                                            children: [
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: "!text-zinc-400",
                                                    children: "PUT …stale resourceVersion"
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: "!text-amber-400",
                                                    children: "409"
                                                })
                                            ]
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("p", {
                    className: "!mt-8 !text-center !text-sm !text-zinc-500",
                    children: [
                        "Use the UI, the API, or both. ",
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                            className: "!text-zinc-300",
                            children: "One platform over native Secrets."
                        })
                    ]
                })
            ]
        })
    });
}
function StackStrip() {
    const groups = [
        {
            label: 'Sign in with',
            items: [
                'Keycloak',
                'Entra ID',
                'Okta',
                'Google',
                'GitHub'
            ]
        },
        {
            label: 'Keeps working',
            items: [
                'kubectl',
                'Velero',
                'Argo CD',
                'RBAC',
                'Audit logs'
            ]
        }
    ];
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("section", {
        className: "!border-b !border-white/5 !bg-[#0a0a0a]",
        children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
            className: "!mx-auto !max-w-6xl !space-y-5 !px-6 !py-10 lg:!px-8",
            children: [
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                    className: "!text-center !text-[13px] !text-zinc-500",
                    children: "Plays nicely with your identity provider — and your platform"
                }),
                groups.map((group)=>/*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                        className: "!flex !flex-wrap !items-center !justify-center !gap-2",
                        children: [
                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                className: "!mr-2 !text-[11px] !uppercase !tracking-[0.18em] !text-zinc-600",
                                children: group.label
                            }),
                            group.items.map((item)=>/*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("span", {
                                    className: "!inline-flex !items-center !gap-2 !rounded-md !border !border-white/10 !bg-[#111111] !px-3 !py-1.5 !text-[13px] !text-zinc-300",
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                            className: "!h-1.5 !w-1.5 !rounded-full !bg-[#3ECF8E]"
                                        }),
                                        item
                                    ]
                                }, item))
                        ]
                    }, group.label))
            ]
        })
    });
}
function Dashboard() {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("section", {
        className: "!border-b !border-white/5",
        children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
            className: "!mx-auto !max-w-6xl !px-6 !py-16 lg:!px-8 lg:!py-24",
            children: [
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(Eyebrow, {
                    children: "Dashboard"
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(SectionHeading, {
                    children: "Stay productive without leaving the browser"
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(SectionSub, {
                    children: "Namespaces on the left, secrets in the middle, history one click away. Values stay masked until you reveal them — and the audit log only ever records key names."
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                    className: "!mt-10 !overflow-hidden !rounded-xl !border !border-white/10 !bg-[#0d0d0d] !shadow-[0_24px_80px_rgba(0,0,0,0.5)]",
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                            className: "!flex !items-center !gap-2 !border-b !border-white/10 !px-4 !py-3",
                            children: [
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                    className: "!h-2.5 !w-2.5 !rounded-full !bg-[#ff5f57]"
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                    className: "!h-2.5 !w-2.5 !rounded-full !bg-[#febc2e]"
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                    className: "!h-2.5 !w-2.5 !rounded-full !bg-[#28c840]"
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                    className: "!ml-3 !flex-1 !truncate !rounded-md !bg-white/5 !px-3 !py-1 !font-mono !text-[11px] !text-zinc-500",
                                    children: "k8ston.example.com/secrets/k8ston-test/database-credentials"
                                })
                            ]
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                            className: "!grid md:!grid-cols-[200px_1fr]",
                            children: [
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                    className: "!hidden !border-r !border-white/10 !p-4 md:!block",
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                                            className: "!text-[10px] !uppercase !tracking-[0.18em] !text-zinc-600",
                                            children: "Namespaces"
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                            className: "!mt-3 !space-y-1 !text-[13px]",
                                            children: [
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                                                    className: "!rounded-md !bg-white/5 !px-3 !py-2 !text-zinc-200",
                                                    children: "k8ston-test"
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                                                    className: "!rounded-md !px-3 !py-2 !text-zinc-500",
                                                    children: "frontend-ns"
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                                                    className: "!rounded-md !px-3 !py-2 !text-zinc-500",
                                                    children: "production"
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                            className: "!mt-6 !rounded-md !border !border-white/10 !p-3",
                                            children: [
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                                                    className: "!font-mono !text-[11px] !text-zinc-300",
                                                    children: "alice@company.com"
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                                                    className: `!mt-1 !font-mono !text-[10px] ${GREEN}`,
                                                    children: "dev-team \xb7 can edit"
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                    className: "!p-4 sm:!p-6",
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                            className: "!flex !flex-wrap !items-center !justify-between !gap-3",
                                            children: [
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                                    className: "!flex !items-center !gap-3",
                                                    children: [
                                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("h3", {
                                                            className: "!m-0 !font-mono !text-sm !text-white",
                                                            children: "database-credentials"
                                                        }),
                                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                            className: "!rounded-full !border !border-[#3ECF8E]/30 !bg-[#3ECF8E]/10 !px-2 !py-0.5 !font-mono !text-[10px] !text-[#3ECF8E]",
                                                            children: "v3"
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                                    className: "!flex !gap-2 !text-[12px]",
                                                    children: [
                                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                            className: "!rounded-md !bg-[#3ECF8E] !px-3 !py-1.5 !font-medium !text-black",
                                                            children: "Edit"
                                                        }),
                                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                            className: "!rounded-md !border !border-white/15 !px-3 !py-1.5 !text-zinc-300",
                                                            children: "History"
                                                        }),
                                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                            className: "!rounded-md !border !border-white/15 !px-3 !py-1.5 !text-zinc-300",
                                                            children: "Restart apps"
                                                        })
                                                    ]
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                            className: "!mt-4 !space-y-2",
                                            children: [
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                                    className: "!flex !items-center !justify-between !rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2.5",
                                                    children: [
                                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                            className: "!font-mono !text-[12px] !text-zinc-300",
                                                            children: "DATABASE_URL"
                                                        }),
                                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("span", {
                                                            className: "!flex !items-center !gap-3",
                                                            children: [
                                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                                    className: "!font-mono !text-[12px] !text-zinc-600",
                                                                    children: "••••••••••"
                                                                }),
                                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                                    className: `!font-mono !text-[11px] ${GREEN}`,
                                                                    children: "Reveal"
                                                                })
                                                            ]
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                                    className: "!flex !items-center !justify-between !rounded-md !border !border-white/5 !bg-black/40 !px-3 !py-2.5",
                                                    children: [
                                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                            className: "!font-mono !text-[12px] !text-zinc-300",
                                                            children: "DB_PASSWORD"
                                                        }),
                                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("span", {
                                                            className: "!flex !items-center !gap-3",
                                                            children: [
                                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                                    className: "!font-mono !text-[12px] !text-zinc-600",
                                                                    children: "••••••••••"
                                                                }),
                                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                                    className: `!font-mono !text-[11px] ${GREEN}`,
                                                                    children: "Reveal"
                                                                })
                                                            ]
                                                        })
                                                    ]
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                            className: "!mt-4 !flex !flex-wrap !gap-2 !font-mono !text-[10px]",
                                            children: [
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: "!rounded-full !border !border-white/10 !px-2 !py-1 !text-zinc-500",
                                                    children: "allowed-groups: dev-team"
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: "!rounded-full !border !border-white/10 !px-2 !py-1 !text-zinc-500",
                                                    children: "1 MiB guard \xb7 412 B"
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                    className: "!rounded-full !border !border-white/10 !px-2 !py-1 !text-zinc-500",
                                                    children: "etcd encrypted ✓"
                                                })
                                            ]
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            ]
        })
    });
}
const codeSample = `# Headless authz checks (no browser)
ALICE=$(node sandbox/scripts/mint-jwt.mjs \\
  --email alice@company.com --groups dev-team)

curl --cookie "k8ston_session=$ALICE" \\
  localhost:3000/api/namespaces/k8ston-test/secrets

# Optimistic-concurrency update (409 on drift)
curl --cookie "k8ston_session=$ALICE" -X PUT \\
  -H 'Content-Type: application/json' \\
  -d '{"data":{"API_KEY":"<rotated>"},"resourceVersion":"'$RV'"}' \\
  localhost:3000/api/namespaces/k8ston-test/secrets/demo-secret

# Reversible restore — snapshots current state first
curl --cookie "k8ston_session=$ALICE" -X POST \\
  -d '{"version":1}' \\
  localhost:3000/api/namespaces/k8ston-test/secrets/demo-secret/restore`;
function CodeSection() {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("section", {
        className: "!border-b !border-white/5 !bg-[#0a0a0a]",
        children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
            className: "!mx-auto !grid !max-w-6xl !items-center !gap-10 !px-6 !py-16 lg:!grid-cols-[0.9fr_1.1fr] lg:!px-8 lg:!py-24",
            children: [
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(Eyebrow, {
                            children: "Automation"
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(SectionHeading, {
                            children: "Drive K8ston from scripts"
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(SectionSub, {
                            children: "Plain REST over JSON with session-cookie auth. Values cross the API as plain strings — base64 stays inside Kubernetes."
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("ul", {
                            className: "!mt-6 !list-none !space-y-3 !p-0 !text-sm !text-zinc-400",
                            children: [
                                'CRUD plus versions, restores, and consumer restarts',
                                'resourceVersion writes: 409 instead of silent clobbers',
                                'Every restore snapshots first — rollbacks stay reversible'
                            ].map((item)=>/*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("li", {
                                    className: "!flex !items-start !gap-3",
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                            className: `!mt-1 ${GREEN}`,
                                            children: "✓"
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                            children: item
                                        })
                                    ]
                                }, item))
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(_docusaurus_Link__rspack_import_1/* ["default"] */.A, {
                            className: `!mt-6 !inline-block !text-sm !font-medium ${GREEN} hover:!underline`,
                            to: "/api/overview/",
                            children: "Read the API reference →"
                        })
                    ]
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                    className: "!min-w-0 !overflow-hidden !rounded-xl !border !border-white/10 !bg-[#0d0d0d]",
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                            className: "!flex !items-center !justify-between !border-b !border-white/10 !px-4 !py-2.5",
                            children: [
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                    className: "!flex !items-center !gap-2",
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                            className: "!h-2.5 !w-2.5 !rounded-full !bg-[#ff5f57]"
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                            className: "!h-2.5 !w-2.5 !rounded-full !bg-[#febc2e]"
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                            className: "!h-2.5 !w-2.5 !rounded-full !bg-[#28c840]"
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                    className: "!font-mono !text-[11px] !text-zinc-600",
                                    children: "bash"
                                })
                            ]
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("pre", {
                            className: "!m-0 !overflow-x-auto !border-0 !bg-transparent !p-5 !font-mono !text-[12px] !leading-6 !text-zinc-300",
                            children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("code", {
                                className: "!border-0 !bg-transparent !p-0",
                                children: codeSample
                            })
                        })
                    ]
                })
            ]
        })
    });
}
function DeployOptions() {
    const options = [
        {
            title: 'Sandbox',
            description: 'kind + Dex + seeded fixtures. Real SSO on localhost in one command.',
            snippet: 'make up',
            to: '/guides/sandbox/',
            link: 'Open the sandbox guide →'
        },
        {
            title: 'Raw manifests',
            description: 'Namespace Role by default, ClusterRole when you need the full dashboard.',
            snippet: 'kubectl apply -f app/k8s/',
            to: '/guides/deploy-kubernetes/',
            link: 'Deploy to Kubernetes →'
        },
        {
            title: 'Helm + OCI',
            description: 'Umbrella chart or direct OCI install. Chart version tracks the app release.',
            snippet: 'helm install k8ston oci://ghcr.io/egose/charts/k8ston',
            to: '/guides/deploy-helm/',
            link: 'Deploy with Helm →'
        }
    ];
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("section", {
        className: "!border-b !border-white/5",
        children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
            className: "!mx-auto !max-w-6xl !px-6 !py-16 lg:!px-8 lg:!py-24",
            children: [
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(Eyebrow, {
                    children: "Deployment"
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(SectionHeading, {
                    children: "Ship it your way"
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(SectionSub, {
                    children: "Stateless by design — all state lives in Kubernetes Secrets, so more than one replica is always safe."
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                    className: "!mt-10 !grid !gap-4 md:!grid-cols-3",
                    children: options.map((option)=>/*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)(Card, {
                            className: "!flex !flex-col",
                            children: [
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("h3", {
                                    className: "!text-[15px] !font-semibold !text-zinc-100",
                                    children: option.title
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                                    className: "!mt-2 !flex-1 !text-[13px] !leading-6 !text-zinc-500",
                                    children: option.description
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                                    className: "!mt-4 !overflow-x-auto !rounded-md !border !border-white/5 !bg-black/60 !px-3 !py-2.5",
                                    children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("code", {
                                        className: "!whitespace-nowrap !border-0 !bg-transparent !p-0 !font-mono !text-[11px] !text-zinc-300",
                                        children: [
                                            "$ ",
                                            option.snippet
                                        ]
                                    })
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(_docusaurus_Link__rspack_import_1/* ["default"] */.A, {
                                    className: `!mt-4 !text-[13px] !font-medium ${GREEN} hover:!underline`,
                                    to: option.to,
                                    children: option.link
                                })
                            ]
                        }, option.title))
                })
            ]
        })
    });
}
function OpenSource() {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("section", {
        className: "!border-b !border-white/5 !bg-[#0a0a0a]",
        children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
            className: "!mx-auto !grid !max-w-6xl !items-center !gap-8 !px-6 !py-16 lg:!grid-cols-2 lg:!px-8",
            children: [
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(Eyebrow, {
                            children: "Open source"
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(SectionHeading, {
                            children: "Open source from day one"
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(SectionSub, {
                            children: "Apache-2.0 licensed. No database to operate, no proprietary control plane — Kubernetes is the source of truth and the code stays boring on purpose."
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                            className: "!mt-6 !flex !flex-wrap !gap-3",
                            children: [
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(_docusaurus_Link__rspack_import_1/* ["default"] */.A, {
                                    className: "!inline-flex !items-center !rounded-md !border !border-white/15 !bg-white/5 !px-4 !py-2 !text-sm !font-medium !text-zinc-200 !no-underline !transition hover:!bg-white/10",
                                    to: "https://github.com/egose/k8ston",
                                    children: "Star on GitHub"
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(_docusaurus_Link__rspack_import_1/* ["default"] */.A, {
                                    className: `!inline-flex !items-center !rounded-md !px-4 !py-2 !text-sm !font-medium ${GREEN} hover:!underline`,
                                    to: "/about/security-model/",
                                    children: "Read the security model →"
                                })
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                    className: "!grid !grid-cols-3 !gap-4",
                    children: [
                        {
                            value: '0',
                            label: 'databases to operate'
                        },
                        {
                            value: '1',
                            label: 'ConfigMap for access rules'
                        },
                        {
                            value: 'N',
                            label: 'native Secrets, versioned'
                        }
                    ].map((stat)=>/*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                            className: "!rounded-xl !border !border-white/10 !bg-[#111111] !p-5 !text-center",
                            children: [
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                                    className: `!font-mono !text-3xl !font-semibold ${GREEN}`,
                                    children: stat.value
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                                    className: "!mt-2 !text-[12px] !leading-5 !text-zinc-500",
                                    children: stat.label
                                })
                            ]
                        }, stat.label))
                })
            ]
        })
    });
}
function FinalCta() {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("section", {
        children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
            className: "!mx-auto !max-w-4xl !px-6 !py-16 !text-center lg:!py-24",
            children: [
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("h2", {
                    className: "!text-3xl !font-semibold !tracking-tight !text-white sm:!text-4xl",
                    children: "Stop pasting secrets into chat."
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                    className: "!mx-auto !mt-4 !max-w-xl !text-[15px] !leading-7 !text-zinc-400",
                    children: "Give developers self-service secrets with SSO login, group-based access, and versioned history — while platform keeps RBAC, audit, and GitOps exactly as they are."
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                    className: "!mt-8 !flex !flex-wrap !justify-center !gap-3",
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(_docusaurus_Link__rspack_import_1/* ["default"] */.A, {
                            className: "!inline-flex !items-center !rounded-md !bg-[#3ECF8E] !px-4 !py-2 !text-sm !font-medium !text-black !no-underline !transition hover:!bg-[#4be19d]",
                            to: "/about/quick-start/",
                            children: "Open Quick Start"
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(_docusaurus_Link__rspack_import_1/* ["default"] */.A, {
                            className: "!inline-flex !items-center !rounded-md !border !border-white/15 !bg-white/5 !px-4 !py-2 !text-sm !font-medium !text-zinc-200 !no-underline !transition hover:!bg-white/10",
                            to: "/api/overview/",
                            children: "Browse API Reference"
                        })
                    ]
                })
            ]
        })
    });
}
function Home() {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(_theme_Layout__rspack_import_2/* ["default"] */.A, {
        title: "K8ston",
        description: "K8ston is a Kubernetes-native secret manager: SSO login, hybrid authorization, versioned history, and one-click rollbacks on top of native Secret objects.",
        children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("main", {
            className: "!bg-black",
            children: [
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(Hero, {}),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(BentoGrid, {}),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(StackStrip, {}),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(Dashboard, {}),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(CodeSection, {}),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(DeployOptions, {}),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(OpenSource, {}),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(FinalCta, {})
            ]
        })
    });
}


},

}]);