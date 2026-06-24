# AGENTS.md

## Before Making Changes

* Read the relevant files first.
* Understand existing functionality before modifying it.
* Do not guess how the system works.
* Verify assumptions from the codebase.
* If a major change affects multiple files, explain the approach before proceeding.

---

## Development Principles

* Make the smallest safe change necessary.
* Preserve existing functionality.
* Do not modify unrelated files.
* Do not remove existing features unless explicitly instructed.
* Extend existing systems whenever possible.
* Avoid creating duplicate implementations of the same functionality.
* Reuse existing components, hooks, utilities, and services where appropriate.

---

## Accuracy

* Do not hallucinate APIs, routes, components, database schemas, files, or functionality.

* If something does not exist, say so and create it intentionally.

* Clearly distinguish:

  * Mocked functionality
  * Prototype functionality
  * Fully implemented functionality

* Never present placeholder logic as complete.

---

## Dependency Management

* Do not silently install new packages.
* Explain why a dependency is needed before adding it.
* Prefer existing project dependencies when possible.

---

## UI / UX

* Mobile-first development.
* Preserve navigation and user flows.
* For design tasks, creativity is encouraged.
* For engineering tasks, prioritize correctness and maintainability.

---

## Android Compatibility

* Maintain compatibility with Capacitor.
* Maintain compatibility with Android Studio builds.
* Avoid web-only solutions that may fail on Android.
* Preserve the existing deployment workflow:

npm run build
npx cap sync
Android Studio → Run

---

## Security

* Never hardcode secrets, API keys, credentials, tokens, or sensitive configuration.
* Follow existing project patterns for configuration and environment management.

---

## Reporting

After completing a task provide:

* Files modified
* Files created
* Commands executed
* Brief summary of changes

Keep summaries concise and avoid unnecessary verbosity.
