# TRADEOFFS.md: Omissions & Constraints

Given the tight 4-day deadline, I prioritized data integrity, multi-tenant security, and an immutable audit model. To achieve this, the following three engineering features were deliberately omitted:

## 1. Direct Third-Party API Integrations (OAuth)
**What was omitted**: We did not build live OAuth2 connections to Concur's Travel API or utility provider portals (e.g., National Grid API). 
**Why**: Establishing enterprise API connections requires complex token rotation, handling rate-limits, and mapping deeply nested JSON payloads that vary wildly by provider. It was more critical to build a robust internal normalization engine (the parsers) that can accept standard CSV/Flat File drops, which is how 90% of legacy enterprise systems actually deliver data today.

## 2. Advanced Machine Learning Anomaly Detection
**What was omitted**: Instead of using an ML model (like Isolation Forests) to detect outliers, we relied on hardcoded deterministic rules (e.g., unknown fuel types, invalid units) to flag rows as `Suspicious`.
**Why**: ML models require vast amounts of historical baseline data to avoid false positives. In an MVP, a deterministic rule engine is significantly easier to audit and explain to a non-technical analyst than a black-box statistical model. 

## 3. Asynchronous Task Queues (Celery/Redis)
**What was omitted**: The file ingestion and parsing occur synchronously in the Django HTTP request lifecycle. 
**Why**: For files up to a few thousand rows, modern Python can parse and bulk-insert data within the standard 30-second HTTP timeout window. Implementing Celery and Redis would have massively complicated the deployment architecture and local developer experience. Once file sizes scale to gigabytes, the ingestion logic can be easily wrapped in a `@shared_task` decorator, but for the prototype, synchronous execution was the pragmatic choice.
