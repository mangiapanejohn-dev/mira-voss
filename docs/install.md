# Install Mira Voss

The CLI is distributed as [`mira-voss` on npm](https://www.npmjs.com/package/mira-voss). The current published version is **1.0.0**.

## Requirements

- **macOS on Apple silicon.** Version 1.0.0 is built for this system only: its one platform package is `mira-voss-darwin-arm64`. On any other system npm installs the package, but `mira` stops with a message that it is not made for that system yet.
- **Node.js 22 or newer**, as the package README asks (its npm `engines` field says `>=18`), and npm for the commands below.
- **A model to work through**: a Claude plan (Pro, Max; Claude Code must be installed), a ChatGPT plan (Plus, Pro, Business; signed in through the MØBIUS kernel, which comes with the package), or an API key.

## Install and start

```bash
npm install -g mira-voss
```

From the directory where you want to work:

```bash
mira
```

The published package also provides `mobius` as an alternate executable name. On first launch, follow the CLI's sign-in prompts; the [README](../README.md#sign-in) lists the plans and API-key services. Do not put credentials in public issues.

## Verify or troubleshoot

```bash
node --version
npm list -g mira-voss --depth=0
mira doctor
```

If `mira` is not found after installation, check that npm's global executable directory is on your `PATH`. Include the operating system, Node.js/npm versions, installed Mira version, and **redacted** error output in a [bug report](https://github.com/mangiapanejohn-dev/mira-voss/issues/new/choose).

## Update or remove

```bash
npm install -g mira-voss@latest
npm uninstall -g mira-voss
```

The public GitHub repository contains documentation, story, and art, not the proprietary CLI runtime.
