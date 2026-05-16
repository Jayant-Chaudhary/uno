CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users(
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    pass TEXT,
    oauth_provider VARCHAR(20),
    oauth_id TEXT,
    avatar_index INT DEFAULT 1
    created_at TIMESTAMPTZ  DEFAULT now(),
    last_login TIMESTAMPTZ,
    CONSTRAINT auth_method_check CHECK (
        (
            pass IS NOT NULL
            AND oauth_provider IS NULL
            AND oauth_id IS NULL
        )
        OR
        (
            pass IS NULL
            AND oauth_provider IS NOT NULL
            AND oauth_id IS NOT NULL
        )
    )    
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
        DEFAULT (now() + interval '7 days'),
    ip_address TEXT,
    user_agent TEXT
);