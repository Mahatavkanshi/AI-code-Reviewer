const pool = require('./db');

const addRoleColumn = async () => {
  try {
    console.log('Adding role column to users table...');
    
    // Check if role column exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role'
    `);
    
    if (checkColumn.rows.length === 0) {
      // Add role column
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(50) DEFAULT 'user'
      `);
      console.log('✅ Role column added successfully');
    } else {
      console.log('ℹ️ Role column already exists');
    }
    
    // Update code_reviews table to add CASCADE DELETE
    const checkConstraint = await pool.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'code_reviews' 
      AND constraint_type = 'FOREIGN KEY'
    `);
    
    if (checkConstraint.rows.length > 0) {
      // Drop existing constraint and recreate with CASCADE
      await pool.query(`
        ALTER TABLE code_reviews 
        DROP CONSTRAINT ${checkConstraint.rows[0].constraint_name}
      `);
      
      await pool.query(`
        ALTER TABLE code_reviews 
        ADD CONSTRAINT fk_code_reviews_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('✅ CASCADE DELETE added to code_reviews');
    }
    
    // Set admin user
    await pool.query(`
      UPDATE users 
      SET role = 'admin' 
      WHERE email = '22040690@coer.ac.in'
    `);
    console.log('✅ Admin user configured');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

addRoleColumn();
