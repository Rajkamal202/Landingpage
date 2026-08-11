# Vendored fonts

`Geist-Variable.woff2` and `GeistMono-Variable.woff2` are the variable
weight axes (100–900) of **Geist** and **Geist Mono**, licensed under the
SIL Open Font License 1.1.

They are committed here rather than pulled from a package so that:

- the build has no runtime or install-time dependency on the `geist` npm
  package,
- there is no network font request at page load (SPEC §4.3),
- the exact binary is pinned, so type metrics — and therefore CLS — are
  reproducible across machines and CI.

To refresh: `pnpm add -D geist`, copy
`node_modules/geist/dist/fonts/geist-{sans,mono}/*-Variable.woff2` here,
then `pnpm remove geist`.
