# skill-get

The package manager for AI agent skills. Install skills for Claude Code, Cursor, Windsurf, and other AI coding assistants.

## Installation

```bash
npm install -g skill-get
```

## Quick Start

```bash
# Search for skills
skill-get search code-review

# Install a skill
skill-get install pdf

# List installed skills
skill-get list

# Show skill information
skill-get info frontend-design

# Remove a skill
skill-get remove pdf
```

## Popular Skills

| Skill | Description | Install |
|-------|-------------|---------|
| `pdf` | Create and edit PDF documents | `skill-get install pdf` |
| `code-review` | Comprehensive code review | `skill-get install code-review` |
| `frontend-design` | Create production-grade UIs | `skill-get install frontend-design` |
| `docx` | Create Word documents | `skill-get install docx` |
| `xlsx` | Create Excel spreadsheets | `skill-get install xlsx` |

## Commands

### `skill-get install <name>`

Install a skill by name.

```bash
skill-get install pdf
skill-get install code-review
```

### `skill-get search <query>`

Search for skills matching a query.

```bash
skill-get search document
skill-get search code
```

### `skill-get list`

List all installed skills.

```bash
skill-get list
```

### `skill-get info <name>`

Show detailed information about a skill.

```bash
skill-get info pdf
```

### `skill-get remove <name>`

Remove an installed skill.

```bash
skill-get remove pdf
```

### `skill-get update [name]`

Update installed skills. Update a specific skill or all skills.

```bash
skill-get update          # Update all
skill-get update pdf      # Update specific skill
```

## Installation Paths

Skills are installed to your AI agent's skill directory:

| Agent | Path |
|-------|------|
| Claude Code | `~/.claude/skills/` |
| Cursor | `~/.cursor/skills/` |
| Windsurf | `~/.windsurf/skills/` |
| Default | `~/.ai-skills/` |

## API

skill-get uses the MCPSkills registry API at `https://api.mcpskills.dev/api/v1`

## Links

- **Website:** [mcpskills.pages.dev](https://mcpskills.pages.dev)
- **API:** [api.mcpskills.dev](https://api.mcpskills.dev/api/v1)
- **GitHub:** [github.com/mcpskills/skill-get](https://github.com/mcpskills/skill-get)

## License

MIT
