# Install Mira Voss

The CLI is distributed as [`mira-voss` on npm](https://www.npmjs.com/package/mira-voss). The current published version is **1.0.0**.

## Requirements

- **Node.js 22 or newer** is recommended by the published package README. Its npm `engines` field currently says `>=18`; follow the publisher's more specific installation guidance until that metadata is reconciled.
- npm is required for the installation command below.
- The optional prebuilt MØBIUS kernel for ChatGPT plan sign-in is supplied in this release for **macOS on Apple silicon**. The package README describes other sign-in options for other platforms. Check that README for current platform details.

## Install and start

```bash
npm install -g mira-voss
```

From the directory where you want to work:

```bash
mira
```

The published package also provides `mobius` as an alternate executable name. On first launch, follow the CLI's sign-in prompts. The [published package README](https://www.npmjs.com/package/mira-voss) explains the available plan and API-key options; do not put credentials in public issues.

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
