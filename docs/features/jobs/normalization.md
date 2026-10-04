# Normalization & Deduplication Specification

## Normalization (`JobNormalizer`)
- **Location Normalization**:
  - `Bangalore` -> `Bengaluru`
  - `Bombay` -> `Mumbai`
  - `Calcutta` -> `Kolkata`
  - `Gurgaon` -> `Gurugram`
- **Work Mode**:
  - `ONSITE`, `HYBRID`, `REMOTE`
- **Employment Type**:
  - `fulltime` / `full_time` / `FULL_TIME` -> canonical representations.
- **Experience Bounds**:
  - Extracted as min and max years of professional experience.

## Deduplication & Cross-Source Clusters (`JobDeduplicator`)
1. **Multi-Signal Identity**:
   - Matches on composite normalized identity: `(normalizedCompany, normalizedTitle, normalizedLocation)`.
   - Content hash: SHA-256 fingerprint of normalized job requirements and description.
2. **Canonical Clustering**:
   - When duplicate jobs appear across multiple platforms (e.g. LinkedIn, Naukri, Indeed), the system does not delete the records or overwrite source provenance.
   - The canonical record stores cross-source references in `sourceReferences`:
     ```json
     [
       { "source": "Naukri", "sourceUrl": "...", "applyUrl": "..." },
       { "source": "Indeed", "sourceUrl": "...", "applyUrl": "..." }
     ]
     ```
   - Each job card shows its primary source badge with subtle `+Also on` tags for duplicate sources, preserving 100% provenance transparency.
