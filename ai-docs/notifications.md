# Notification Feature PRD

## Introduction

This document outlines the requirements for implementing a notification feature within the application. The primary goal is to provide users with visual and auditory feedback when long-running background processes, specifically AI prompt execution, have completed, even if the application window is not currently in focus. This improves user experience by reducing the need to constantly monitor the application for task completion.

## Requirements

1.  **API Usage:** The feature MUST utilize Electron's built-in `Notification` API for displaying native system notifications.
2.  **Triggering Logic:** Notifications MUST be triggered upon the successful completion of a user-initiated AI prompt executed via the `runPrompt` method, and when Aider asks a question via the `askQuestion` method in `src/main/project.ts`.
3.  **User Setting:** A new checkbox titled "Notifications enabled" MUST be added to the "General" section of the application settings (`src/renderer/src/components/settings/GeneralSettings.tsx`).
4.  **Setting Storage:** The state of the "Notifications enabled" checkbox MUST be stored as a boolean value (`notificationsEnabled`) within the application's settings managed by `src/main/store/store.ts`.
5.  **Setting Definition:** The `notificationsEnabled` property MUST be defined in the `SettingsData` interface in `src/common/types.ts`.
6.  **Default State:** The default state for `notificationsEnabled` SHOULD be `false`.
7.  **Notification Content:** The notification MUST have a clear title and a brief body message. The content SHOULD be dynamic based on the event (e.g., "Prompt Completed" with a message about Aider or Agent, or "Question from Aider" with the question text).

## Technical Considerations

The implementation will involve modifications to the following files:

*   `ai-docs/notifications.md`: This PRD document.
*   `src/common/types.ts`: To define the new setting type.
*   `src/main/store/store.ts`: To add the new setting to the default configuration and handle its storage.
*   `src/main/project.ts`: To implement the notification triggering logic after prompt completion and when a question is asked.
*   `src/renderer/src/components/settings/GeneralSettings.tsx`: To add the user interface element for controlling the setting.
