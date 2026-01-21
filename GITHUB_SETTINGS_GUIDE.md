# 🔧 GitHub Settings Guide - Complete Setup

## Overview
GitHub pe exactly kya kya settings karni hai - step by step.

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Repository Access
**URL:** https://github.com/saurav1702/tran_stable

Make sure you have admin access to this repo.

---

## 🛡️ Step 2: Branch Protection Rules

### Go to Settings:
```
https://github.com/saurav1702/tran_stable/settings/branches
```

### Click "Add branch protection rule"

### Configure Protection:

**1. Branch name pattern:**
```
main
```

**2. Enable these options:**

✅ **Require a pull request before merging**
- Require approvals: `0` (you can merge your own PRs)
- ✅ Check: "Dismiss stale pull request approvals when new commits are pushed"

✅ **Require status checks to pass before merging**
- ✅ Check: "Require branches to be up to date before merging"
- Search and add these required checks (they'll appear after first workflow run):
  ```
  Lint Code (Required)
  Type Check (Required)
  Security Check (Required)
  Database Schema (Required)
  Build Test (Required)
  Docker Build (Required)
  All Checks Passed
  ```

✅ **Require conversation resolution before merging** (optional but recommended)

✅ **Include administrators**
- This ensures even you cannot bypass checks!

**3. Click "Create" or "Save changes"**

---

## ⚙️ Step 3: Secrets Configuration

### Go to Secrets:
```
https://github.com/saurav1702/tran_stable/settings/secrets/actions
```

### Click "New repository secret"

### Add these secrets:

**1. DATABASE_URL**
```
Name: DATABASE_URL
Value: mysql://user:password@host:3306/database_name
```
Your production database URL

**2. NEXTAUTH_SECRET**
```
Name: NEXTAUTH_SECRET
Value: [generate with: openssl rand -base64 32]
```
Generate a strong random key

**3. NEXTAUTH_URL**
```
Name: NEXTAUTH_URL
Value: https://your-domain.com
```
Your production domain

**4. NEXT_PUBLIC_APP_URL**
```
Name: NEXT_PUBLIC_APP_URL
Value: https://your-domain.com
```
Same as NEXTAUTH_URL

**5. NEXT_PUBLIC_APP_NAME**
```
Name: NEXT_PUBLIC_APP_NAME
Value: TransRentals
```

---

## 🔒 Step 4: Security Settings

### Go to Security:
```
https://github.com/saurav1702/tran_stable/settings/security_analysis
```

**Enable:**
- ✅ Dependabot alerts
- ✅ Dependabot security updates
- ✅ Secret scanning

---

## 📊 Step 5: Actions Settings

### Go to Actions:
```
https://github.com/saurav1702/tran_stable/settings/actions
```

**General Settings:**
- Allow all actions and reusable workflows: ✅ Enabled
- Artifact and log retention: 90 days (or your preference)

**Workflow permissions:**
- Read and write permissions: ✅ Enabled
- Allow GitHub Actions to create and approve pull requests: ✅ Enabled

---

## 🎯 Step 6: Verify Setup

### Test 1: Check Actions Tab
```
https://github.com/saurav1702/tran_stable/actions
```

You should see workflows running or completed.

### Test 2: Check Branch Protection
```
https://github.com/saurav1702/tran_stable/settings/branches
```

You should see a rule for `main` branch with a shield icon 🛡️

### Test 3: Check Secrets
```
https://github.com/saurav1702/tran_stable/settings/secrets/actions
```

You should see 5 secrets listed (values will be hidden).

---

## 🚨 Important Notes

### 1. First Workflow Run
- First time workflows run hone ke baad hi status check names appear honge
- Pehle ek PR create karo to check names milenge
- Phir branch protection me add karo

### 2. Secret Generation
**Generate NEXTAUTH_SECRET:**
```bash
# On Linux/Mac:
openssl rand -base64 32

# On Windows PowerShell:
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### 3. Mobile App Ignored
Workflows already configured to ignore:
- `tr-app/**`
- `tr-vendor-app/**`
- `**.md`

So mobile app changes won't trigger CI/CD.

---

## 📋 Complete Checklist

Before going live:

### Repository Settings:
- [ ] Admin access confirmed
- [ ] Repository is private/public as needed
- [ ] Description added
- [ ] Topics added (optional)

### Branch Protection:
- [ ] Rule created for `main` branch
- [ ] PR required before merge
- [ ] Status checks enabled
- [ ] All required checks added (after first run)
- [ ] Include administrators enabled

### Secrets:
- [ ] DATABASE_URL added
- [ ] NEXTAUTH_SECRET generated and added
- [ ] NEXTAUTH_URL added
- [ ] NEXT_PUBLIC_APP_URL added
- [ ] NEXT_PUBLIC_APP_NAME added

### Security:
- [ ] Dependabot alerts enabled
- [ ] Secret scanning enabled
- [ ] Security updates enabled

### Actions:
- [ ] Workflows enabled
- [ ] Workflow permissions set correctly
- [ ] At least one workflow run completed

---

## 🔄 Workflow After Setup

### Daily Development:

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes
# ... code ...

# 3. Commit
git add .
git commit -m "Add new feature"

# 4. Push
git push origin feature/new-feature

# 5. Create PR on GitHub
# → Workflows automatically run
# → Wait for all checks to pass (green ✅)
# → Merge when ready
```

### What Happens:
1. **Push to branch** → No CI/CD (only on PR/main)
2. **Create PR** → All checks run automatically
3. **Checks fail** → Merge button disabled ❌
4. **Checks pass** → Merge button enabled ✅
5. **Merge to main** → Final validation runs
6. **All green** → Ready for deployment

---

## 🐛 Troubleshooting

### Issue: "No status checks found"
**Solution:** Wait for first workflow to complete, then add check names.

### Issue: "Workflow not running"
**Solution:**
1. Check Actions tab for errors
2. Verify `.github/workflows/` files exist
3. Check if branch is protected

### Issue: "Secret not working"
**Solution:**
1. Verify secret name exactly matches
2. Check for extra spaces
3. Re-create secret if needed

### Issue: "Cannot merge PR"
**Solution:**
1. Check which checks are failing
2. Click on failed check to see logs
3. Fix the issue
4. Push again (checks re-run automatically)

---

## 📊 Workflow Status Meanings

### ✅ Green Check
- All tests passed
- Build successful
- Migrations valid
- **Safe to merge/deploy**

### ❌ Red X
- Something failed
- Click to see logs
- Fix issue and push again
- **Cannot merge until fixed**

### ⏸️ Yellow Circle
- Workflow running
- Wait for completion
- Usually 10-15 minutes
- **Cannot merge while running**

### ⚪ Gray Circle
- Workflow not required
- Or check was skipped
- **Usually okay**

---

## 🎯 Best Practices

### 1. Always Create PRs
```bash
# ❌ Don't push directly to main
git push origin main

# ✅ Do create feature branches
git checkout -b feature/my-feature
git push origin feature/my-feature
# Then create PR
```

### 2. Wait for Checks
- Never force-merge
- Always wait for green checks
- Review failed check logs

### 3. Keep Secrets Updated
- Rotate secrets quarterly
- Never commit secrets to code
- Use .env.example for templates

### 4. Monitor Actions
- Check Actions tab regularly
- Review failed workflows
- Fix issues promptly

---

## 🔐 Security Checklist

Before deployment:

- [ ] No secrets in code
- [ ] .env files in .gitignore
- [ ] Secrets configured in GitHub
- [ ] Branch protection enabled
- [ ] Dependabot enabled
- [ ] Secret scanning enabled
- [ ] 2FA enabled on GitHub account

---

## 📞 Need Help?

### Resources:
- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Branch Protection:** https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches
- **Secrets Guide:** https://docs.github.com/en/actions/security-guides/encrypted-secrets

### Your Setup:
- **Repository:** https://github.com/saurav1702/tran_stable
- **Actions:** https://github.com/saurav1702/tran_stable/actions
- **Settings:** https://github.com/saurav1702/tran_stable/settings

---

## ✅ Setup Complete When:

You can answer "Yes" to all:

- [ ] Can I see workflows in Actions tab?
- [ ] Do workflows run on PR creation?
- [ ] Is main branch protected?
- [ ] Are all secrets configured?
- [ ] Do failed checks block merge?
- [ ] Can I create and merge PRs?

**If all YES:** Setup is complete! 🎉

---

## 🚀 Quick Reference

### URLs:
```
Repository:       /tran_stable
Actions:          /tran_stable/actions
Settings:         /tran_stable/settings
Branch Rules:     /tran_stable/settings/branches
Secrets:          /tran_stable/settings/secrets/actions
Security:         /tran_stable/settings/security_analysis
```

### Commands:
```bash
# Generate secret
openssl rand -base64 32

# Check workflow status
gh workflow list
gh run list

# View logs
gh run view [run-id]
```

---

**Setup Time:** 5-10 minutes
**Difficulty:** Easy
**Impact:** Maximum protection

**Last Updated:** January 21, 2026
