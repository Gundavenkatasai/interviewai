from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional
import time
import pandas as pd
from jobspy import scrape_jobs

app = FastAPI(title="JobSpy Sidecar for Interview AI")

class ScrapeRequest(BaseModel):
    sites: List[str]
    searchTerm: str
    location: str
    resultsWanted: int = 20
    hoursOld: Optional[int] = 48
    offset: int = 0
    isRemote: bool = False
    jobType: Optional[str] = None
    countryIndeed: Optional[str] = "India"

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.1.82"}

@app.get("/capabilities")
def capabilities():
    return {
        "supported_sites": [
            "indeed",
            "linkedin",
            "glassdoor",
            "google",
            "naukri",
            "zip_recruiter",
            "bayt",
            "bdjobs"
        ]
    }

@app.post("/scrape")
def scrape(req: ScrapeRequest):
    valid_sites = ["indeed", "linkedin", "glassdoor", "google", "naukri", "zip_recruiter", "bayt", "bdjobs"]
    requested_sites = [s.lower() for s in req.sites]
    
    # Filter valid sites
    sites_to_scrape = [s for s in requested_sites if s in valid_sites]
    
    if not sites_to_scrape:
        raise HTTPException(status_code=400, detail="No valid sites provided")

    results = {
        "status": "success",
        "sites": [],
        "jobs": []
    }
    
    all_jobs_df = pd.DataFrame()
    
    # We scrape each site individually to isolate failures and get per-site metadata
    for site in sites_to_scrape:
        start_time = time.time()
        try:
            # Note: For ZipRecruiter and Glassdoor, hours_old might be rounded up to next day
            # If JobSpy fails internally, it might raise an exception or just return empty
            jobs_df = scrape_jobs(
                site_name=[site],
                search_term=req.searchTerm,
                location=req.location,
                results_wanted=req.resultsWanted,
                hours_old=req.hoursOld,
                offset=req.offset,
                is_remote=req.isRemote,
                job_type=req.jobType,
                country_indeed=req.countryIndeed or "India"
            )
            
            duration_ms = int((time.time() - start_time) * 1000)
            jobs_found = len(jobs_df) if isinstance(jobs_df, pd.DataFrame) else 0
            
            if jobs_found > 0:
                all_jobs_df = pd.concat([all_jobs_df, jobs_df], ignore_index=True)
            
            results["sites"].append({
                "site": site,
                "status": "ok" if jobs_found > 0 else "empty",
                "jobsFound": jobs_found,
                "durationMs": duration_ms
            })
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            err_msg = str(e).lower()
            status = "error"
            if "429" in err_msg or "rate limit" in err_msg or "too many requests" in err_msg:
                status = "rate_limited"
            elif "block" in err_msg or "captcha" in err_msg:
                status = "blocked"
            elif "timeout" in err_msg:
                status = "timeout"
            
            import traceback
            traceback.print_exc()
            results["sites"].append({
                "site": site,
                "status": status,
                "jobsFound": 0,
                "durationMs": duration_ms,
                "error": str(e)
            })

    # If all failed, change overall status to partial or failed
    ok_sites = [s for s in results["sites"] if s["status"] in ["ok", "empty"]]
    if len(ok_sites) == 0:
        results["status"] = "failed"
    elif len(ok_sites) < len(sites_to_scrape):
        results["status"] = "partial"

    # Convert dataframe to dict list, handling NaN values
    if not all_jobs_df.empty:
        # replace NaN with None for valid JSON serialization
        all_jobs_df = all_jobs_df.where(pd.notnull(all_jobs_df), None)
        results["jobs"] = all_jobs_df.to_dict(orient="records")

    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
