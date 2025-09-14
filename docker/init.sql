-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'Asia/Colombo';

-- Grant permissions (will be created automatically)
-- GRANT ALL PRIVILEGES ON DATABASE fisheries_db TO fisheries_user;