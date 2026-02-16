const pool = require('./db');

const setupDatabase = async () => {
  try {
    console.log('Setting up database...');
    
    // Create code_reviews table
    await pool.query(`
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
    `);
    
    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_code_reviews_user_id ON code_reviews(user_id);
      CREATE INDEX IF NOT EXISTS idx_code_reviews_created_at ON code_reviews(created_at DESC);
    `);
    
    // Create trigger function
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    // Create trigger
    await pool.query(`
      DROP TRIGGER IF EXISTS update_code_reviews_updated_at ON code_reviews;
      CREATE TRIGGER update_code_reviews_updated_at
        BEFORE UPDATE ON code_reviews
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    
    console.log('Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
};

setupDatabase();
