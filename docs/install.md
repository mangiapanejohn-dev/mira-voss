# Install Mira Voss

The CLI is distributed as [`mira-voss` on npm](https://www.npmjs.com/package/mira-voss); the npm page shows the current version.

## Requirements

- **macOS** on Apple silicon, **Windows 10/11** (x64), or **Linux** (x64 or arm64, glibc or musl). npm installs the package for your system by itself: `mira-voss-darwin-arm64`, `mira-voss-windows-x64`, `mira-voss-linux-x64` or `mira-voss-linux-arm64`, and on musl systems such as Alpine `mira-voss-linux-x64-musl` or `mira-voss-linux-arm64-musl`.
- **Node.js 22 or newer**, as the package README asks (its npm `engines` field says `>=18`), and npm for the commands below.
- **A model to work through**: a Claude plan (Pro, Max; Claude Code must be installed), a ChatGPT plan (Plus, Pro, Business; signed in through the MØBIUS kernel, which comes with the package on every system above, and by a code typed on another device where no browser can finish it), or an API key.

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
