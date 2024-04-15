# @Omochice/renovate-config

[![basic ci](https://github.com/Omochice/renovate-config/actions/workflows/ci.yml/badge.svg)](https://github.com/Omochice/renovate-config/actions/workflows/ci.yml)

A configuration for Renovate.

## To use

Extends this configuration using by `extends` field.

```json
{
  "extends": [
    "github>Omochice/renovate-config"
  ]
}
```

If you use Renovate in Deno project.

```json
{
  "extends": [
    "github>Omochice/renovate-config:deno"
  ]
}
```

## Limitation

Currently, there are following limitions on Deno project:

- Only support some datasources
  - https://deno.land/std
  - https://deno.land/x
  - `npm:` specifier
  - https://esm.sh
  - https://pax.deno.dev
  - https://raw.githubusercontent.com
  - https://unpkg.com
  - https://cdn.skypack.dev
  - `jsr:` specifier
  - See [test case](./test/deno/) for supported syntax
- Dynamic import is not followed
- Cannot detect tag when "/" is included in it (github-tag source(pax.deno.dev and raw.githubusercontent.com))
- Cannot update `deno.lock`

## License

[zlib](./LICENSE)
