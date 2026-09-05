import io
import logging
from typing import Dict, Any, Optional
import pypdf
import docx

from src.services.ai_service import ai_service
from src.schemas.schemas import ResumeAnalysisAIResponse, JobDescriptionAnalysisAIResponse

logger = logging.getLogger("interviewai.resume_service")

class ResumeService:
    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        text = ""
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        except Exception as e:
            logger.error("Failed to extract PDF text: %s", e)
            raise ValueError(f"Could not parse PDF file: {str(e)}")
        return text.strip()

    @staticmethod
    def extract_text_from_docx(file_bytes: bytes) -> str:
        text = ""
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            for paragraph in doc.paragraphs:
                if paragraph.text:
                    text += paragraph.text + "\n"
        except Exception as e:
            logger.error("Failed to extract DOCX text: %s", e)
            raise ValueError(f"Could not parse DOCX file: {str(e)}")
        return text.strip()

    @classmethod
    def _parse_resume_heuristically(cls, raw_text: str) -> ResumeAnalysisAIResponse:
        """Heuristically extracts candidate profile, projects, and technologies from raw text."""
        import re

        # Known technologies catalogue
        tech_catalog = {
            "frontend": ["React", "Vue", "Angular", "Next.js", "Nuxt", "Svelte", "Redux", "Tailwind CSS", "HTML5", "CSS3", "JavaScript", "TypeScript"],
            "backend": ["Node.js", "Express", "FastAPI", "Django", "Flask", "Spring Boot", "Go", "Golang", "Python", "Ruby on Rails", "Java", "C++", "C#", ".NET"],
            "database": ["MongoDB", "PostgreSQL", "MySQL", "Redis", "Cassandra", "DynamoDB", "SQLite", "Supabase", "Firebase", "Elasticsearch"],
            "cloud_devops": ["AWS", "GCP", "Azure", "Docker", "Kubernetes", "CI/CD", "Terraform", "GitHub Actions", "Nginx"],
            "apis_auth": ["REST API", "GraphQL", "gRPC", "JWT", "OAuth", "Stripe", "Razorpay", "PayPal", "OpenAI API", "WebSockets", "Kafka", "RabbitMQ"]
        }

        # Find all mentioned skills
        found_skills = []
        found_skills_lower = set()
        for category, items in tech_catalog.items():
            for item in items:
                # Match whole words / token boundary
                pattern = r'(?i)\b' + re.escape(item) + r'\b'
                if re.search(pattern, raw_text):
                    if item.lower() not in found_skills_lower:
                        found_skills.append(item)
                        found_skills_lower.add(item.lower())

        # Extract projects from sentences or lines
        projects = []
        project_indicators = [
            r'(?:developed|built|created|implemented|designed)\s+(?:a|an)?\s*([A-Za-z0-9\s\-]+(?:application|app|platform|system|service|tool|chatbot|website|portal|api))',
            r'([A-Za-z0-9\s\-]+(?:application|app|platform|system|chatbot|e-commerce|portfolio))(?:\s*[-:]|\s+using|\s+with)',
            r'Project[:\s]+([A-Za-z0-9\s\-]+)'
        ]

        # Scan text for project mentions
        sentences = re.split(r'[\n.]+', raw_text)
        seen_project_names = set()

        for s in sentences:
            s_clean = s.strip()
            if not s_clean:
                continue

            for ind in project_indicators:
                match = re.search(ind, s_clean, re.IGNORECASE)
                if match:
                    raw_name = match.group(1).strip()
                    # Clean up project name
                    p_name = re.sub(r'^(?:a|an|the)\s+', '', raw_name, flags=re.IGNORECASE).title()
                    if len(p_name) > 3 and len(p_name) < 60 and p_name.lower() not in seen_project_names:
                        seen_project_names.add(p_name.lower())

                        # Extract technologies in this sentence or surrounding context
                        p_techs = [tech for tech in found_skills if re.search(r'(?i)\b' + re.escape(tech) + r'\b', s_clean)]
                        if not p_techs:
                            p_techs = [tech for tech in found_skills[:4]]

                        # Extract database, auth, features
                        p_db = next((t for t in p_techs if t in tech_catalog["database"]), None)
                        p_auth = next((t for t in p_techs if t in ["JWT", "OAuth"]), None)
                        if not p_auth and "jwt" in s_clean.lower():
                            p_auth = "JWT"
                            if "JWT" not in p_techs:
                                p_techs.append("JWT")

                        p_features = []
                        if "authentication" in s_clean.lower() or p_auth:
                            p_features.append(f"{p_auth or 'User'} authentication")
                        if "payment" in s_clean.lower() or any(p in s_clean.lower() for p in ["stripe", "razorpay", "paypal"]):
                            p_features.append("Payment processing")
                        if "real-time" in s_clean.lower() or "websocket" in s_clean.lower() or "chat" in s_clean.lower():
                            p_features.append("Real-time communication")

                        projects.append({
                            "name": p_name,
                            "description": s_clean,
                            "technologies": p_techs,
                            "frameworks": [t for t in p_techs if t in tech_catalog["frontend"] or t in tech_catalog["backend"]],
                            "database": p_db,
                            "apis": [t for t in p_techs if t in tech_catalog["apis_auth"]],
                            "authentication": p_auth,
                            "architecture": "Monolithic / Microservices" if "microservice" in s_clean.lower() else "Client-Server Architecture",
                            "deployment": "Docker / Cloud" if any(c in s_clean.lower() for c in ["docker", "aws", "cloud", "deploy"]) else None,
                            "responsibilities": ["Full cycle implementation", "Feature development"],
                            "achievements": [],
                            "challenges": None,
                            "features": p_features
                        })
                    break

        # If no projects matched via regex, create a synthesized project from the top skills
        if not projects and found_skills:
            projects.append({
                "name": "Core Technical Project",
                "description": f"Engineered software solutions utilizing {', '.join(found_skills[:4])}.",
                "technologies": found_skills[:6],
                "frameworks": [t for t in found_skills if t in tech_catalog["frontend"] or t in tech_catalog["backend"]],
                "database": next((t for t in found_skills if t in tech_catalog["database"]), None),
                "apis": [t for t in found_skills if t in tech_catalog["apis_auth"]],
                "authentication": "JWT" if "JWT" in found_skills else None,
                "architecture": "Modular Full Stack Architecture",
                "deployment": None,
                "responsibilities": ["Architecture design", "API integration", "Database modeling"],
                "achievements": [],
                "challenges": None,
                "features": ["RESTful endpoints", "State management"]
            })

        candidate_name = "Candidate"
        first_line = raw_text.strip().split('\n')[0].strip()
        if len(first_line) > 2 and len(first_line) < 40 and not any(ch in first_line for ch in ['@', 'http', ':', '/']):
            candidate_name = first_line

        structured_profile = {
            "candidate": {
                "name": candidate_name,
                "skills": found_skills,
                "education": [],
                "experience": [{"role": "Software Engineer", "technologies": found_skills[:5]}]
            },
            "projects": projects,
            "certifications": [],
            "achievements": []
        }

        suggested_q = []
        if projects:
            p0 = projects[0]
            suggested_q.append(f"Can you explain the system architecture and data flow of your {p0['name']}?")
            if p0.get("database"):
                suggested_q.append(f"Why did you choose {p0['database']} for {p0['name']}, and how did you design its schema?")
            if p0.get("technologies"):
                suggested_q.append(f"How did you implement state management and API communication using {p0['technologies'][0]}?")

        return ResumeAnalysisAIResponse(
            skills=found_skills or ["Full Stack Development"],
            projects=projects,
            experience=[{"role": "Software Engineer", "technologies": found_skills[:5]}],
            education=[],
            certifications=[],
            achievements=[],
            profile=structured_profile,
            suggested_questions=suggested_q or [
                "Can you walk through the system architecture of your most significant project?",
                "What were the technical trade-offs you encountered and how did you resolve them?"
            ]
        )

    @classmethod
    async def analyze_resume_text(cls, raw_text: str) -> ResumeAnalysisAIResponse:
        """
        Uses AI LLM to parse and structure resume data into candidate profile details
        and structured projects conforming to the resume-first specification.
        """
        system_prompt = (
            "You are an expert technical resume parser and interviewer. "
            "Your job is to extract and structure candidate profile details from the resume into strict JSON. "
            "You MUST extract every project in detail, noting its name, description, technologies, frameworks, "
            "database, APIs, authentication, architecture, deployment, responsibilities, achievements, and features. "
            "Return ONLY valid JSON adhering strictly to the schema."
        )

        user_content = f"""
Candidate Resume Content:
\"\"\"
{raw_text[:6000]}
\"\"\"

Extract into structured JSON matching this exact format:
{{
  "candidate": {{
    "name": "Candidate Name if present, else ''",
    "education": [{{"institution": "...", "degree": "...", "year": "..."}}],
    "experience": [{{"company": "...", "role": "...", "duration": "...", "responsibilities": ["..."]}}],
    "skills": ["React", "Node.js", "MongoDB", "Python", "Docker"]
  }},
  "projects": [
    {{
      "name": "Food Delivery Application",
      "description": "Developed a food delivery app with React and Node.js",
      "technologies": ["React", "Node.js", "Express", "MongoDB"],
      "frameworks": ["Express", "React"],
      "database": "MongoDB",
      "apis": ["Razorpay"],
      "authentication": "JWT",
      "architecture": "Client-Server Architecture",
      "deployment": "Docker",
      "responsibilities": ["Designed REST endpoints", "Integrated payment gateway"],
      "achievements": ["Handled 500+ daily orders"],
      "challenges": "Managing concurrent orders",
      "features": ["JWT authentication", "Razorpay payments"]
    }}
  ],
  "certifications": ["AWS Certified Developer"],
  "achievements": ["Winner of Hackathon 2024"]
}}

Rules:
1. Extract EVERY project explicitly mentioned in the resume.
2. For each project, extract every technology, database, framework, and authentication mechanism used.
3. If specific fields like architecture or deployment are not stated, infer sensibly from the tech stack or leave as null.
4. Do NOT invent projects or technologies that do not appear in the text.
"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]

        try:
            raw_json = await ai_service._call_llm_json(messages)
            
            # Map raw_json into ResumeAnalysisAIResponse fields
            cand_data = raw_json.get("candidate", {})
            skills = cand_data.get("skills", []) or raw_json.get("skills", [])
            projects = raw_json.get("projects", [])
            experience = cand_data.get("experience", []) or raw_json.get("experience", [])
            education = cand_data.get("education", []) or raw_json.get("education", [])
            certs = raw_json.get("certifications", [])
            achieve = raw_json.get("achievements", [])

            # Build structured profile dict
            structured_profile = {
                "candidate": cand_data,
                "projects": projects,
                "certifications": certs,
                "achievements": achieve
            }

            suggested = []
            for p in projects[:3]:
                p_name = p.get("name", "Project")
                p_db = p.get("database")
                p_auth = p.get("authentication")
                suggested.append(f"Can you explain the architecture and key components of your {p_name}?")
                if p_db:
                    suggested.append(f"Why did you choose {p_db} for {p_name} instead of alternative data stores?")
                if p_auth:
                    suggested.append(f"How did you implement {p_auth} authentication in {p_name}?")

            return ResumeAnalysisAIResponse(
                candidate=cand_data,
                skills=skills,
                projects=projects,
                experience=experience,
                education=education,
                certifications=certs,
                achievements=achieve,
                profile=structured_profile,
                suggested_questions=suggested or [
                    "Can you describe the system architecture of the most complex application you have built?",
                    "What were the key trade-offs in your technical decisions?"
                ]
            )
        except Exception as e:
            logger.warning("Resume AI parsing error, falling back to heuristic extraction: %s", e)
            return cls._parse_resume_heuristically(raw_text)

    @classmethod
    async def analyze_job_description(cls, raw_text: str) -> JobDescriptionAnalysisAIResponse:
        """Extracts required skills and roles from JD and devises tailored interview questions."""
        system_prompt = (
            "You are a recruitment lead. Extract required skills and expectations from the job description. "
            "Return valid JSON matching the schema."
        )

        user_content = f"""
Job Description:
\"\"\"
{raw_text[:4000]}
\"\"\"

Extract:
1. required_skills: list of must-have skills
2. preferred_skills: list of nice-to-have skills
3. responsibilities: list of key job duties
4. experience_requirements: string summary of years/level
5. suggested_questions: 4-5 interview questions testing candidate suitability against this specific job.

Return JSON strictly.
"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]

        try:
            raw_json = await ai_service._call_llm_json(messages)
            return JobDescriptionAnalysisAIResponse.model_validate(raw_json)
        except Exception as e:
            logger.warning("Job Description AI parsing error: %s", e)
            return JobDescriptionAnalysisAIResponse(
                required_skills=["Software Engineering Fundamentals", "System Design"],
                preferred_skills=["Cloud Architecture", "Distributed Systems"],
                responsibilities=["Build scalable features", "Collaborate across teams"],
                experience_requirements="Mid to Senior Level",
                suggested_questions=[
                    "How does your past experience align with the technical challenges outlined in this role?",
                    "Can you discuss a time you had to master a new technology rapidly to deliver a critical project?"
                ]
            )

resume_service = ResumeService()
