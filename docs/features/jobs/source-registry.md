# Source Registry & Capabilities Specification

## Registered Adapters
The `JobSourceRegistry` serves as the centralized catalog of all external job discovery channels.

| Source Key | Provider | Acquisition Method | Capabilities | Status |
| :--- | :--- | :--- | :--- | :--- |
| `LINKEDIN` | Specialized / JobSpy | Public Search API & Structured HTML | Search, Remote, Pagination, India Filter | Active |
| `NAUKRI` | Native Adapter | Headless Browser & Public JSON API | Search, Experience, Salary, Location | Active |
| `INDEED` | JobSpy Adapter | JobSpy Ingestion Sidecar | Search, Location, Salary | Active |
| `INTERNSHALA` | Native Adapter | Jina AI / Agent-Reach Markdown Parser | Search, Freshers/Interns, India Cities | Active |
| `FOUNDIT` | Native Adapter | Direct Search Endpoint | Search, Location, Pagination | Active |
| `WELLFOUND` | Native Adapter | Startup Graph API | Startups, Remote, Salary | Active |
| `CUTSHORT` | Native Adapter | Specialized Tech Search | Tech Stack, Experience | Active |
| `HIRIST` | Native Adapter | Specialized Tech Search | High-Tech, Senior Roles | Active |
| `SHINE` | Native Adapter | Enterprise API | India Metro Cities | Active |
| `TIMESJOBS` | Native Adapter | Career Aggregator | Industry, Location | Active |
| `GLASSDOOR` | JobSpy Adapter | JobSpy Ingestion Sidecar | Reviews, Salary Ranges | Active |

## Source Capability Contract
Every registered source exposes:
- `supportsRemote`: Whether the source explicitly flags remote opportunities.
- `supportsPagination`: Whether cursor/offset pagination is supported.
- `supportsKeywordSearch`: Capability to filter by technology stack keywords.
- `supportsSalary`: Reliability of extracted compensation bounds.
- `status`: Honest real-time indicator (`active`, `degraded`, `restricted`, `failing`).
