const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/db');  
const { authenticateToken } = require('../middleware/auth');  

// ==================== REGISTER ====================
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ 
            error: 'Missing fields',
            required: ['name', 'email', 'password']
        });
    }

    try {
        const { data: existingUser } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ 
                error: 'Email already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{ 
                name, 
                email, 
                password: hashedPassword, 
                role: role || 'attendant' 
            }])
            .select();

        if (insertError) {
            console.error('Registration error:', insertError);
            return res.status(500).json({ 
                error: 'Registration failed',
                details: insertError.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful!',
            user: {
                id: newUser[0].id,
                name: newUser[0].name,
                email: newUser[0].email,
                role: newUser[0].role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            error: 'Email and password required' 
        });
    }

    try {
        const { data: user, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid credentials' 
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ 
                error: 'Invalid credentials' 
            });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                name: user.name, 
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== GET CURRENT USER ====================
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, role, created_at')
            .eq('id', req.user.id)
            .single();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;