-- This file runs once on first PostgreSQL container start
-- EF Core migrations handle the actual schema; this just ensures extensions are available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
