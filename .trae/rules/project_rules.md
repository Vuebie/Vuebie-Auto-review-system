# TRAE Project Rules for Vuebie Auto-review system

## 1. Ownership & Completion
- All solutions must be fully functional, tested, and production-ready before marking as done.
- Document all changes clearly in commit messages and in code comments.
- Never leave TODOs or known bugs without clear explanation and next steps.

## 2. Coding Standards
- Follow [Your Preferred Style Guide] (e.g., Airbnb JS, PEP8 for Python, etc.)
- All code must be linted and formatted before commit (use Prettier, ESLint, Black, etc.)

## 3. Testing & Validation
- All new features must include relevant unit, integration, and (where appropriate) E2E tests.
- No pull request may be merged with failing tests.
- Code coverage should not decrease.

## 4. Security & Compliance
- Do not store secrets or credentials in code—use environment variables or secret managers.
- Never weaken authentication or authorization logic.
- Apply all lint, security, and audit suggestions before finalizing work.

## 5. Documentation & Handover
- All new endpoints, configs, and major modules must be documented in `/docs` or README.
- Summarize each solution and verification steps in a project log or issue tracker.
- Always provide instructions for reproducing bugs and verifying fixes.

## 6. Autonomous Problem-Solving
- If you hit a blocker, try at least two alternative approaches before asking for escalation.
- Only escalate when you have a detailed summary of what was tried and why it failed.

## 7. Communication & Updates
- Use clear, actionable commit messages: `fix(auth): enable TOTP MFA in Supabase`
- Notify stakeholders of breaking changes or major updates.

---

**Goal:** Deliver bug-free, robust, and easily maintainable code that can be picked up by any engineer or AI agent. No work is done until it’s truly ready for production.

