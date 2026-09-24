# LinkedIn Skills Providers & Fallbacks

Details of external provider adapters and manual fallback modes.

## 1. Overview
The integration supports three provider layers:
| Layer | Default Tier | Optional Tier | Configuration |
|---|---|---|---|
| **Read Layer** | Manual (Paste) | Apify Actor | `APIFY_TOKEN` |
| **Publish Layer** | Manual (Copy-Ready) | Publora REST API | `PUBLORA_API_KEY`, `LINKEDIN_PLATFORM_ID` |
| **Media Layer** | Manual (Prompt suggestion) | Pixfaro AI | `PIXFARO_TOKEN` |

## 2. Read Layer
- **Manual Mode**: User supplies profile URL or pastes text from LinkedIn. Always functional, zero external cost.
- **Apify Mode**: Invokes upstream `lib/apify_client.py` to scrape public LinkedIn posts, comments, and engager profiles.

## 3. Publish Layer
- **Manual Mode**: When `PUBLORA_API_KEY` is not present, generated drafts display a copy-ready preview, target URL, and copy-to-clipboard button with status `MANUAL_REQUIRED`.
- **Publora Mode**: Free tier supports 15 posts/month. Posts or comments are scheduled via Publora's REST API upon user approval.

## 4. Media Layer
- **Manual Mode**: Suggests customized image prompts and quote card formatting specifications for manual creation.
- **Pixfaro Mode**: Automates quote-card rendering and AI illustrations attached directly to published posts.
