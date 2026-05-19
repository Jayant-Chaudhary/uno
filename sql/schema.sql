CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users(
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    pass TEXT,
    oauth_provider VARCHAR(20),
    oauth_id TEXT,
    avatar_index INT DEFAULT 1,
    reset_token TEXT,
    reset_token_expiry TIMESTAMPTZ,
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

-- rooms table
CREATE TABLE rooms (
    room_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(6) UNIQUE NOT NULL,
    host_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(10) DEFAULT 'waiting' 
        CHECK (status IN ('waiting', 'active', 'finished')),
    max_players INT DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_activity TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '2 hours'),
    game_state JSONB
);

-- room_players table
CREATE TABLE room_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    guest_name VARCHAR(32),
    player_index INT NOT NULL,
    status VARCHAR(15) DEFAULT 'active'
        CHECK (status IN ('active', 'disconnected', 'left')),
    joined_at TIMESTAMPTZ DEFAULT now(),
    socket_id TEXT,
    CONSTRAINT player_identity CHECK (
        (user_id IS NOT NULL AND guest_name IS NULL)
        OR
        (user_id IS NULL AND guest_name IS NOT NULL)
    )
);

-- updating the user table for some of the new features
ALTER TABLE room_players ADD COLUMN reconnect_token TEXT;
ALTER TABLE room_players ADD COLUMN disconnect_count INT DEFAULT 0;
ALTER TABLE rooms ADD COLUMN rounds_played INT DEFAULT 0;