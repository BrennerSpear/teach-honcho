## Working Directory Structure

- `teach-honcho/` - the main git working directory. You *DO NOT* do your work here. You create git worktrees from here.
- `<task name>/` - worktree directories for each task branch.
- `<task name>/.task.md` - where you store information about the task and the status. this is gitignored.

## Working on tasks or a new feature

- When you are given a task, if a task branch name is not specified, create a git worktree from the main git working directory, and do your work in that worktree. Use the `-b` flag on the `git worktree add` command to create the branch.
- Before starting work, read the CLAUDE.md in the worktree (if not already read) for more context and instructions.
- copy over the .env file from the main git working directory: cp personality-explorer/.env {some-new-feature}/.env
- run `pnpm install` in the feature's folder
- When you finish the task, push the branch and create a PR using the `gh` tool.
- Name the branches with the prefix `claude`, ie. `claude/some-new-feature`.
- When the user asks you to cleanup a task, remove the worktree and delete the local branch for that task.
- As you finish work, add information about your plan, work done, etc. to the task file in the worktree directory.
- If continuing a task that has work in it already, read the `.task.md` in the task worktree directory to pick up context on work done.
- If you are given external references to read, files or URLs, read them before starting the task.