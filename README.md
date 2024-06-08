# @Omochice/renovate-config

[![Checks for push](https://github.com/Omochice/renovate-config/actions/workflows/push.yml/badge.svg)](https://github.com/Omochice/renovate-config/actions/workflows/push.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/Omochice/renovate-config/badge)](https://scorecard.dev/viewer/?uri=github.com/Omochice/renovate-config)

A configuration for Renovate.

## To use

Extends this configuration using by `extends` field.

If you use Renovate in a Deno project.

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
  - https://jsr.io
  - See [test case](./test/deno/) for supported syntax
- Dynamic import is not followed
- Cannot detect tag when "/" is included in it (github-tag source(pax.deno.dev and raw.githubusercontent.com))
- Cannot update `deno.lock`

## License

[zlib](./LICENSE)
