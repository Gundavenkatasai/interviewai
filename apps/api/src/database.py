import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from src.config import settings

logger = logging.getLogger("interviewai.database")

Base = declarative_base()

def get_engine_and_session():
    # Attempt connecting to PostgreSQL
    try:
        connect_args = {"connect_timeout": 2} if "postgres" in settings.DATABASE_URL else {}
        engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            connect_args=connect_args
        )
        # Test connection
        with engine.connect() as conn:
            logger.info("Successfully connected to PostgreSQL database at %s", settings.DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        return engine, SessionLocal
    except Exception as e:
        logger.warning(
            "Could not connect to PostgreSQL (%s). Checking fallback...", e
        )
        if settings.SQLITE_FALLBACK:
            sqlite_url = "sqlite:///./interviewai.db"
            logger.info("Falling back to local SQLite database: %s", sqlite_url)
            engine = create_engine(
                sqlite_url,
                connect_args={"check_same_thread": False}
            )
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            return engine, SessionLocal
        raise e

engine, SessionLocal = get_engine_and_session()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def seed_initial_data(db):
    from src.models.models import RoleProfile
    try:
        count = db.query(RoleProfile).count()
        if count == 0:
            default_roles = [
                {
                    "name": "Full Stack Developer",
                    "description": "Full-stack development across frontend, backend, APIs, databases, and deployment.",
                    "topics": ["React", "Node.js", "REST APIs", "Authentication", "MongoDB", "SQL", "System Design", "Caching", "Security", "Testing"],
                    "skills": ["JavaScript", "TypeScript", "React", "Node.js", "Express", "SQL", "NoSQL", "Git"],
                    "question_categories": ["Frontend", "Backend", "Database", "System Design", "Security", "Problem Solving"]
                },
                {
                    "name": "Frontend Developer",
                    "description": "Modern web UI/UX development, state management, web performance, and browser APIs.",
                    "topics": ["React", "Next.js", "CSS/Tailwind", "State Management", "DOM & Browser APIs", "Web Performance", "Accessibility", "Testing"],
                    "skills": ["JavaScript", "TypeScript", "HTML5", "CSS3", "React", "Next.js", "Redux/Zustand"],
                    "question_categories": ["Frontend", "Architecture", "Performance", "Testing", "UI/UX"]
                },
                {
                    "name": "Backend Developer",
                    "description": "Scalable server architectures, microservices, databases, caching, and secure API design.",
                    "topics": ["REST APIs", "Microservices", "Database Design", "Caching & Redis", "Concurrency", "Message Queues", "System Design", "Authentication"],
                    "skills": ["Python", "Node.js", "Java", "Go", "PostgreSQL", "Redis", "Docker", "Kafka"],
                    "question_categories": ["Backend", "Database", "System Design", "Security", "Scalability"]
                },
                {
                    "name": "Data Scientist",
                    "description": "Statistical modeling, machine learning, data engineering, feature extraction, and experimentation.",
                    "topics": ["Python", "Statistics", "Machine Learning", "Pandas", "NumPy", "SQL", "Feature Engineering", "Model Evaluation", "A/B Testing"],
                    "skills": ["Python", "R", "SQL", "scikit-learn", "Pandas", "NumPy", "Jupyter", "Tableau"],
                    "question_categories": ["Machine Learning", "Statistics", "Data Analysis", "Python", "Problem Solving"]
                },
                {
                    "name": "Machine Learning Engineer",
                    "description": "ML algorithms, neural networks, model training, optimization, and production ML pipelines.",
                    "topics": ["Deep Learning", "PyTorch", "TensorFlow", "MLOps", "Model Serving", "Data Pipelines", "Feature Stores", "Optimization"],
                    "skills": ["Python", "PyTorch", "TensorFlow", "Docker", "Kubernetes", "MLflow", "CUDA"],
                    "question_categories": ["Machine Learning", "Deep Learning", "MLOps", "Algorithms", "System Design"]
                },
                {
                    "name": "AI Engineer",
                    "description": "LLM application development, RAG architectures, prompt engineering, vector databases, and agentic workflows.",
                    "topics": ["LLMs", "RAG Pipelines", "Vector Databases", "Prompt Engineering", "Fine-Tuning", "Agentic Systems", "LangChain/LlamaIndex", "Embeddings"],
                    "skills": ["Python", "OpenAI API", "HuggingFace", "FastAPI", "pgvector", "ChromaDB", "vLLM"],
                    "question_categories": ["AI/LLM", "RAG", "Vector Search", "System Design", "Optimization"]
                },
                {
                    "name": "DevOps Engineer",
                    "description": "CI/CD pipelines, container orchestration, infrastructure as code, monitoring, and site reliability.",
                    "topics": ["CI/CD Pipelines", "Docker", "Kubernetes", "Terraform", "Linux", "Monitoring/Prometheus", "Networking", "Security"],
                    "skills": ["Linux", "Bash", "Docker", "Kubernetes", "Terraform", "GitHub Actions", "Ansible"],
                    "question_categories": ["DevOps", "Infrastructure", "CI/CD", "Cloud", "Security"]
                },
                {
                    "name": "Cloud Engineer",
                    "description": "Multi-cloud architecture, serverless computing, VPC networking, IAM security, and cost optimization.",
                    "topics": ["AWS/GCP/Azure", "Serverless", "Cloud Networking", "IAM & Security", "Storage Solutions", "High Availability", "Cost Optimization"],
                    "skills": ["AWS", "GCP", "Azure", "Terraform", "Python", "CloudFormation", "Docker"],
                    "question_categories": ["Cloud", "Architecture", "Security", "Networking", "System Design"]
                },
                {
                    "name": "Software Engineer",
                    "description": "Core software engineering principles, algorithms, data structures, OOP, and system design.",
                    "topics": ["Data Structures", "Algorithms", "OOP & Design Patterns", "Concurrency", "Database Design", "Testing", "Code Quality"],
                    "skills": ["Python", "Java", "C++", "JavaScript", "SQL", "Git"],
                    "question_categories": ["DSA", "System Design", "Object Oriented Design", "Problem Solving"]
                },
                {
                    "name": "Data Analyst",
                    "description": "Business intelligence, SQL querying, data cleaning, visualization, and exploratory data analysis.",
                    "topics": ["SQL Queries & Joins", "Excel / Spreadsheets", "Power BI / Tableau", "Data Cleaning", "Business Metrics", "Descriptive Statistics"],
                    "skills": ["SQL", "Python", "Excel", "Power BI", "Tableau", "Pandas"],
                    "question_categories": ["Data Analysis", "SQL", "Visualization", "Business Understanding"]
                },
                {
                    "name": "Java Developer",
                    "description": "Enterprise Java systems, Spring Boot, JPA/Hibernate, multithreading, and JVM internals.",
                    "topics": ["Java Core & Streams", "Spring Boot", "JPA & Hibernate", "JVM Architecture & GC", "Multithreading", "Microservices", "Design Patterns"],
                    "skills": ["Java 17+", "Spring Boot", "Hibernate", "PostgreSQL", "Maven/Gradle", "Docker", "Kafka"],
                    "question_categories": ["Backend", "Java", "Spring Boot", "Database", "System Design"]
                },
                {
                    "name": "Python Developer",
                    "description": "Idiomatic Python, FastAPI/Django, asynchronous programming, databases, and clean architecture.",
                    "topics": ["Python Internals & Generators", "FastAPI / Django", "AsyncIO", "SQLAlchemy", "Unit Testing & Pytest", "REST & GraphQL", "Docker"],
                    "skills": ["Python 3.11+", "FastAPI", "Django", "SQLAlchemy", "Celery", "PostgreSQL", "Docker"],
                    "question_categories": ["Python", "Backend", "APIs", "Database", "Architecture"]
                },
                {
                    "name": "React Developer",
                    "description": "Advanced React ecosystem, hooks, concurrency, performance optimization, and Next.js.",
                    "topics": ["React Hooks & Lifecycle", "Component Design", "Server Components", "State Management", "Performance & Memoization", "Next.js App Router"],
                    "skills": ["React 18+", "Next.js", "TypeScript", "Tailwind CSS", "Redux Toolkit", "React Query"],
                    "question_categories": ["Frontend", "React", "Architecture", "Performance"]
                },
                {
                    "name": "Node.js Developer",
                    "description": "Asynchronous event-driven programming, Node.js event loop, Express/NestJS, and microservices.",
                    "topics": ["Event Loop & libuv", "Streams & Buffers", "Express / NestJS", "Clustering & Worker Threads", "Database Connection Pooling", "JWT Security"],
                    "skills": ["Node.js", "Express", "NestJS", "TypeScript", "MongoDB", "PostgreSQL", "Redis"],
                    "question_categories": ["Backend", "Node.js", "APIs", "Database", "Performance"]
                }
            ]
            for role_data in default_roles:
                db.add(RoleProfile(**role_data))
            db.commit()
            logger.info("Successfully seeded %d default role profiles.", len(default_roles))
    except Exception as e:
        db.rollback()
        logger.warning("Could not seed role profiles: %s", e)

def migrate_sqlite_columns(db):
    try:
        from sqlalchemy import text
        # check if users table has is_admin
        res = db.execute(text("PRAGMA table_info(users)")).fetchall()
        col_names = [r[1] for r in res]
        if col_names and "is_admin" not in col_names:
            db.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0"))
            db.commit()
            logger.info("Migrated SQLite: added is_admin column to users table.")
    except Exception as e:
        logger.warning("Migration check exception: %s", e)

def init_db():
    from src.models import models  # Ensure all models are registered
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
    with SessionLocal() as db:
        migrate_sqlite_columns(db)
        seed_initial_data(db)


