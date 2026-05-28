# Breathe ESG Ingestion Pipeline & Review Dashboard - Backend

This is the enterprise-grade split-settings Django REST Framework backend for the Breathe ESG platform.

## Features

- **Stateless REST APIs**: Built using DRF, designed to be fully decoupled from the React client.
- **Service Layer Architecture**: Complex calculation, mapping, and proration parsers reside strictly in `apps/core/services/` for high testability and clean responsibility separation.
- **Strict Ingestion Engines**: Dedicated parsers for SAP German column maps, calendar-split utility billing intervals, and geodetic Haversine flight distance calculations.
- **Multi-Tenant Isolation**: Handled dynamically using `TenantMiddleware` matching headers.
- ** ESG Auditing Trails**: Automatic database hooks logging transaction histories for reviewer locking and anomaly flagging.

## Getting Started

1. Set up a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements/development.txt
   ```

3. Run migrations and initialize database:
   ```bash
   python manage.py migrate
   ```

4. Start development server:
   ```bash
   python manage.py runserver
   ```
