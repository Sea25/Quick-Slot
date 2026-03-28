const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from .env file
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Check if credentials exist
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: Supabase credentials not found in .env file');
    console.log('Please make sure your .env file has:');
    console.log('SUPABASE_URL=https://widdsbfdmyryfadarway.supabase.co');
    console.log('SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZGRzYmZkbXlyeWZhZGFyd2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDMwMTAsImV4cCI6MjA5MDI3OTAxMH0.DCA5x9RS8az55bJY_WHEhXW4Rcuj-LCDKwM5lW7aPJ8');
    process.exit(1);
}

// Initialize Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
    console.log('🔧 Setting up admin user...');
    
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Try to update existing admin
    const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('email', 'admin@quickslot.com')
        .select();
    
    if (updateError) {
        console.error('❌ Error updating admin:', updateError.message);
        
        // If update fails, try to insert new admin
        console.log('🔄 Trying to create new admin user...');
        
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{ 
                name: 'Admin', 
                email: 'admin@quickslot.com', 
                password: hashedPassword, 
                role: 'admin' 
            }])
            .select();
        
        if (insertError) {
            console.error('❌ Error creating admin:', insertError.message);
        } else {
            console.log('✅ Admin user created successfully!');
            console.log('📧 Email: admin@quickslot.com');
            console.log('🔑 Password: admin123');
            console.log('👤 Role: admin');
        }
    } else {
        console.log('✅ Admin user updated successfully!');
        console.log('📧 Email: admin@quickslot.com');
        console.log('🔑 Password: admin123');
        console.log('👤 Role: admin');
    }
}

// Run the function
createAdmin();