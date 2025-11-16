# CI/CD Pipeline Documentation

## Overview

CSS Academy uses a fully automated CI/CD pipeline powered by GitHub Actions. The pipeline automatically validates, merges, and deploys code changes without manual intervention.

## Pipeline Architecture

```
┌─────────────────────┐
│  Push to Branch     │
│  (claude/*, etc.)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  CI Checks          │
│  - HTML validation  │
│  - JS syntax check  │
│  - CSS validation   │
│  - Security scan    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Auto-Merge         │
│  - Create PR        │
│  - Merge to main    │
│  - Delete branch    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Deploy to Pages    │
│  - Validate files   │
│  - Build artifact   │
│  - Deploy live      │
└─────────────────────┘
```

## Workflows

### 1. CI Checks (ci-checks.yml)

**Triggers:**
- Push to any branch
- Pull request to main

**Jobs:**
- **Code Quality Checks**
  - HTML structure validation
  - JavaScript syntax checking
  - CSS brace balancing
  - File structure verification
  - Security issue detection
  - Code size reporting

- **Link Checker**
  - Validates resource paths
  - Checks CSS/JS links

- **Summary**
  - Aggregates all check results
  - Reports overall status

### 2. Auto Merge (auto-merge.yml)

**Triggers:**
- Push to branches matching:
  - `claude/**`
  - `feature/**`
  - `dev/**`

**Jobs:**

#### Validate
- HTML syntax validation
- JavaScript syntax checking
- CSS file verification
- Required files check

#### Auto-Merge
- Creates pull request automatically
- Merges to main branch
- Pushes changes

#### Cleanup
- Deletes merged branch
- Maintains clean repository

**Features:**
- ✅ Automatic PR creation
- ✅ Zero-touch merging
- ✅ Branch cleanup
- ✅ Status notifications

### 3. Deploy to GitHub Pages (static.yml)

**Triggers:**
- Push to main branch
- Manual workflow dispatch
- After auto-merge completion

**Jobs:**

#### Deploy
- Validates deployment files
- Configures GitHub Pages
- Uploads artifact
- Deploys to live site
- Sends notifications

## Branch Strategy

### Protected Branches
- `main` - Production branch (auto-deployed)

### Development Branches
- `claude/*` - Claude AI development branches (auto-merge enabled)
- `feature/*` - Feature branches (auto-merge enabled)
- `dev/*` - Development branches (auto-merge enabled)

## Automated Merge Process

### Step-by-Step Flow

1. **Developer pushes to branch**
   ```bash
   git push origin claude/my-feature
   ```

2. **CI Checks run automatically**
   - Validates code quality
   - Checks for errors
   - Runs security scans

3. **Auto-Merge workflow triggered**
   - Creates PR with descriptive title
   - Adds automated labels
   - Waits for validation

4. **Automatic merge to main**
   - No manual approval needed
   - Merge commit created
   - Original branch deleted

5. **Deployment to GitHub Pages**
   - Triggered automatically
   - Validates files
   - Deploys to production
   - Site goes live!

## Configuration

### Required Secrets
None! The pipeline uses `GITHUB_TOKEN` which is automatically provided by GitHub Actions.

### Required Permissions

The workflows require these permissions:
```yaml
permissions:
  contents: write
  pull-requests: write
  pages: write
  id-token: write
```

## Safety Features

### Validation Checks
- ✅ HTML structure validation
- ✅ JavaScript syntax checking
- ✅ CSS validation
- ✅ Security scanning
- ✅ File existence checks
- ✅ Resource path validation

### Rollback Strategy
If deployment fails:
1. Previous version remains live
2. Error notifications are sent
3. Git history allows easy revert:
   ```bash
   git revert HEAD
   git push origin main
   ```

## Monitoring & Notifications

### GitHub Actions UI
- View all workflow runs in the Actions tab
- Check logs for each step
- Monitor deployment status

### Notifications
- ✅ Success: Green checkmark in commits
- ❌ Failure: Red X with error details
- 📍 Deployment URL in workflow logs

## Usage Examples

### Example 1: Feature Development
```bash
# Create feature branch
git checkout -b claude/add-dark-mode

# Make changes
git add .
git commit -m "Add dark mode toggle"

# Push to trigger pipeline
git push origin claude/add-dark-mode

# ✨ Pipeline automatically:
# 1. Validates code
# 2. Creates PR
# 3. Merges to main
# 4. Deploys to GitHub Pages
# 5. Deletes branch
```

### Example 2: Quick Fix
```bash
# Create fix branch
git checkout -b feature/fix-css-bug

# Fix bug
git add c.css
git commit -m "Fix CSS path bug"

# Push and relax!
git push origin feature/fix-css-bug

# Everything else is automated! ☕
```

## Troubleshooting

### Pipeline Fails at Validation
**Problem:** Code doesn't pass quality checks

**Solution:**
1. Check Actions tab for error details
2. Fix the issues locally
3. Push again - pipeline reruns automatically

### Merge Conflicts
**Problem:** Cannot auto-merge due to conflicts

**Solution:**
1. Manually resolve conflicts
2. Push resolution
3. Pipeline continues automatically

### Deployment Fails
**Problem:** GitHub Pages deployment failed

**Solution:**
1. Check if required files exist
2. Verify GitHub Pages is enabled in repo settings
3. Re-run workflow manually from Actions tab

## Best Practices

### Commit Messages
Use clear, descriptive commit messages:
- ✅ `Add auto-save functionality`
- ✅ `Fix CSS path for GitHub Pages`
- ❌ `update`
- ❌ `fix bug`

### Branch Naming
Follow the naming conventions:
- `claude/*` - For Claude AI work
- `feature/*` - For new features
- `dev/*` - For development work

### Testing Locally
Before pushing:
1. Open `css.html` in browser
2. Test all functionality
3. Check browser console for errors

## Pipeline Metrics

### Typical Execution Times
- CI Checks: ~30 seconds
- Auto-Merge: ~20 seconds
- Deployment: ~1-2 minutes
- **Total: ~3 minutes from push to live!** 🚀

### Resource Usage
- All workflows run on GitHub's infrastructure
- No cost for public repositories
- Unlimited minutes for public repos

## Future Enhancements

Potential improvements to the pipeline:

- [ ] Automated testing suite integration
- [ ] Performance monitoring
- [ ] Lighthouse CI for web vitals
- [ ] Automated changelog generation
- [ ] Slack/Discord notifications
- [ ] Preview deployments for PRs
- [ ] Automated dependency updates

---

## Quick Reference

### Workflow Status Badges

Add to README.md:

```markdown
![CI Checks](https://github.com/gouthamgo/css-academy/workflows/Continuous%20Integration%20Checks/badge.svg)
![Deploy](https://github.com/gouthamgo/css-academy/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)
```

### Useful Commands

```bash
# View workflow runs
gh run list

# View specific run
gh run view <run-id>

# Re-run failed workflow
gh run rerun <run-id>

# Watch workflow in real-time
gh run watch
```

---

**Last Updated:** 2024
**Maintained By:** CSS Academy Team
