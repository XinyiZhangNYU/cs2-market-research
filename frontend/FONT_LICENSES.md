# Web font provenance

The production frontend self-hosts the following variable web fonts through exact-version
Fontsource packages. Vite emits them under the site's own `/assets/` origin; the browser does
not contact Google Fonts or another font CDN at runtime.

| CSS family | Upstream family | Package | License |
|---|---|---|---|
| `Geist Variable` | Geist Sans | `@fontsource-variable/geist@5.3.0` | SIL Open Font License 1.1 |
| `Geist Mono Variable` | Geist Mono | `@fontsource-variable/geist-mono@5.3.0` | SIL Open Font License 1.1 |
| `Noto Sans SC Variable` | Noto Sans SC, the Google sibling of Adobe Source Han Sans | `@fontsource-variable/noto-sans-sc@5.3.0` | SIL Open Font License 1.1 |

The exact license text is included in each installed package as `LICENSE`, and the WOFF2 files
retain their upstream metadata. Noto Sans SC is split by Unicode range so a page downloads only
the Simplified Chinese slices needed for the characters it renders.
