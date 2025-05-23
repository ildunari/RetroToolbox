# OpenAI Codex Integration Guide

This document explains how to use OpenAI Codex (cloud-based) with the RetroToolbox project through ChatGPT.

## What is OpenAI Codex?

OpenAI Codex is a cloud-based software engineering agent that can:
- Write features and fix bugs in your codebase
- Answer questions about your code
- Run tests and commands in a sandboxed environment  
- Create pull requests for review
- Work on multiple tasks in parallel

Codex is powered by codex-1, a version of OpenAI o3 optimized for software engineering.

## Prerequisites

### Access Requirements
- ChatGPT Pro, Team, or Enterprise subscription
- (Plus and Edu users coming soon)
- Multi-factor authentication enabled
- GitHub repository (already set up for this project)

### Project Setup
This RetroToolbox project is already configured for Codex with:
- ✅ Git repository initialized
- ✅ GitHub remote configured (`https://github.com/ildunari/RetroToolbox.git`)
- ✅ AGENTS.md file created (Codex guidance document)
- ✅ Startup service configured
- ✅ Project structure documented

## Getting Started with Codex

### Step 1: Access Codex in ChatGPT
1. Open ChatGPT (web or app)
2. Look for "Codex (beta)" in the left sidebar
3. Click it to open the agent dashboard
4. Complete MFA setup if prompted (scan QR code with authenticator app)

### Step 2: Connect Your Repository
1. In Codex interface, click "Add Repository"
2. Authorize GitHub access if needed
3. Select your repository: `ildunari/RetroToolbox`
4. Codex will clone and analyze your codebase

### Step 3: Start Working
You can now give Codex tasks like:
- "Implement the missing Tetris game"
- "Fix any TypeScript errors in the codebase"  
- "Add mobile touch controls to all games"
- "Create unit tests for the SoundManager"
- "Optimize the particle system performance"

## How Codex Works

### Task Execution
1. **Isolation**: Each task runs in a separate sandboxed environment
2. **Repository Access**: Your codebase is preloaded in each environment
3. **Commands**: Codex can read/edit files and run terminal commands
4. **Duration**: Tasks typically take 1-30 minutes depending on complexity
5. **Monitoring**: You can watch Codex work in real-time

### Evidence and Review
- Codex provides citations for all actions taken
- Terminal logs and test outputs are available for review
- You can request revisions before accepting changes
- Changes can be committed directly or via pull request

## Project-Specific Guidance

### AGENTS.md Configuration
The `AGENTS.md` file in this repository provides Codex with:
- Project structure and architecture overview
- Development setup instructions
- Code style guidelines
- Common tasks and patterns
- Testing procedures
- Deployment information

### Key Project Context for Codex

**Current Architecture:**
- Monolithic React component in `src/RetroGameToolbox.jsx`
- Working games: Snake++, Neon Pong, Brick Breaker
- Placeholder games: Tetris Remix, Space Defense
- Core systems: SoundManager, InputManager, ParticleSystem

**Priority Tasks for Codex:**
1. Implement missing Tetris and Space Invaders games
2. Extract games from monolithic file to modular components
3. Add comprehensive testing
4. Optimize performance and mobile experience
5. Enhance accessibility features

### Recommended Codex Commands

**For Development:**
```
"Implement the Tetris game following the pattern of existing games"
"Extract the Snake game from RetroGameToolbox.jsx to a separate component"
"Add comprehensive error handling to all game components"
"Create unit tests for the core systems"
```

**For Analysis:**
```
"Review the codebase and suggest performance improvements"
"Analyze the current architecture and recommend refactoring steps"
"Find any potential bugs or security issues"
"Check TypeScript configuration and fix any type errors"
```

**For Enhancement:**
```
"Add keyboard shortcuts for all games"
"Implement save/load functionality for game progress"
"Add analytics tracking for game usage"
"Create a responsive design system"
```

## Best Practices

### Working with Codex
1. **Be Specific**: Provide clear, detailed instructions
2. **Use Context**: Reference the AGENTS.md file and existing patterns
3. **Test Incremental**: Ask for smaller, testable changes
4. **Review Carefully**: Always review Codex's changes before merging
5. **Iterate**: Use follow-up prompts to refine implementations

### Repository Management
- Codex can create branches and pull requests
- Review all changes before merging to main
- Use the startup service to test changes locally
- Monitor the build process and fix any issues

### Development Workflow
1. Give Codex a task
2. Monitor progress in real-time
3. Review the implementation and test outputs
4. Request revisions if needed
5. Approve and merge or create PR for team review

## Local Development Integration

### Startup Service
Use the provided startup script to run the project locally:

```bash
# Initial setup (installs deps, builds, starts service)
./startup.sh

# Skip dependency installation
./startup.sh --skip-deps

# Show service information only
./startup.sh --info-only
```

### Service Management
```bash
# Start/stop/restart the service
./toolbox-service.sh start
./toolbox-service.sh stop  
./toolbox-service.sh restart

# Monitor service
./toolbox-service.sh status
./toolbox-service.sh logs
./toolbox-service.sh url
```

### Testing Codex Changes
1. Codex makes changes in cloud environment
2. Review and approve changes
3. Pull changes to local repository
4. Test using the startup service
5. Deploy if everything works correctly

## Troubleshooting

### Common Issues

**Codex can't access repository:**
- Ensure GitHub authorization is complete
- Check repository permissions
- Verify repository URL is correct

**Tasks are failing:**
- Check the AGENTS.md file is up to date
- Ensure project builds successfully locally
- Review task instructions for clarity

**Changes not working locally:**
- Pull latest changes from GitHub
- Restart the local service
- Check build process for errors

### Getting Help
- Review Codex's terminal logs and error messages
- Check the GitHub repository for any issues
- Use the local service logs for debugging
- Consult the AGENTS.md file for project context

## Security Considerations

### Sandboxed Environment
- Codex runs in isolated cloud environments
- Network access is controlled and secure
- Your codebase is only accessible during active tasks
- No persistent storage between tasks

### Repository Access
- Codex only accesses repositories you explicitly authorize
- All actions are logged and auditable
- You control what changes get merged
- GitHub permissions still apply

### Best Practices
- Review all changes before merging
- Use branches for experimental features
- Don't include sensitive data in repository
- Monitor Codex's actions during task execution

## Future Integration

OpenAI plans to add:
- API access for CI/CD integration
- Unified CLI and ChatGPT experience
- Enhanced project templates
- Advanced debugging capabilities

This RetroToolbox project is ready to take advantage of these features as they become available.

---

For more information about OpenAI Codex, visit the official documentation or refer to the research papers on AI-assisted software development.