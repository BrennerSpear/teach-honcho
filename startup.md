


This is what the biome.jsonc should look like
```json
{
  "$schema": "https://biomejs.dev/schemas/2.1.1/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": { "ignoreUnknown": false },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2 },
  "javascript": {
    "formatter": {
      "semicolons": "asNeeded"
    }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "style": {
        "noUnusedTemplateLiteral": "off"
      },
      "correctness": {
        "useExhaustiveDependencies": "off"
      },
      "nursery": {
        "useSortedClasses": {
          "level": "warn",
          "fix": "safe",
          "options": {
            "functions": ["clsx", "cva", "cn"]
          }
        }
      },
      "suspicious": {
        "noArrayIndexKey": "off"
      },
      "a11y": {
        "noSvgWithoutTitle": "off"
      },
      "recommended": true
    }
  }
}
```

this is what `.claude/settings.local.json` should look like

``` json
{
  "permissions": {
    "allow": [
      "mcp__*",
      "Bash(gh *)",
      "Bash(git *)",
      "Bash(pnpm *)",
      "WebFetch(domain:*)",
      "Bash(cp:*)",
      "Bash(pnpm exec prisma:*)",
      "Bash(pnpm list:*)",
      "Bash(git worktree:*)",
      "Bash(touch:*)",
      "Bash(pnpm lint:*)",
      "Bash(rm:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(pnpm install:*)"
    ],
    "deny": []
  }
}
```

updates to `package.json` (overwrite check:unsafe with lint)
```json
{
    "scripts": {
        "lint": "biome check --write --unsafe .",
        "precommit": "pnpm run typecheck &&pnpm run lint"
    }
}
```