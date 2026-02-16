-- Create table for storing code reviews
CREATE TABLE IF NOT EXISTS code_reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_snippet TEXT NOT NULL,
    language VARCHAR(50),
    ai_review TEXT NOT NULL,
    improved_code TEXT,
    issues_count INTEGER DEFAULT 0,
    suggestions_count INTEGER DEFAULT 0,
    fix_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_code_reviews_user_id ON code_reviews(user_id);

-- Create index for sorting by date
CREATE INDEX IF NOT EXISTS idx_code_reviews_created_at ON code_reviews(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_code_reviews_updated_at ON code_reviews;
CREATE TRIGGER update_code_reviews_updated_at
    BEFORE UPDATE ON code_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
