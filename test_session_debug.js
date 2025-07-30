// Test script to debug session issues on Render
const express = require('express');
const session = require('express-session');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Environment check
console.log('🔧 Environment check:');
console.log('🔧 SESSION_SECRET exists:', !!process.env.SESSION_SECRET);
console.log('🔧 SESSION_SECRET value:', process.env.SESSION_SECRET ? '***' : 'undefined');
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 All env vars:', Object.keys(process.env).filter(key => key.includes('SESSION') || key.includes('NODE')));

const SESSION_SECRET = process.env.SESSION_SECRET || 'your-session-secret-key';
console.log('🔧 Using SESSION_SECRET:', SESSION_SECRET ? '***' : 'fallback');

app.use(cors({
  origin: ['https://foodforecastai.netlify.app', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Session configuration
app.use(session({
  secret: SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    domain: undefined
  }
}));

app.use(express.json());

// Test endpoint to set session
app.post('/api/test-session', (req, res) => {
  console.log('🎫 Setting test session...');
  console.log('🎫 Session before:', req.session);
  
  req.session.testUser = { email: 'test@example.com', username: 'testuser' };
  
  console.log('🎫 Session after setting:', req.session);
  
  req.session.save((err) => {
    if (err) {
      console.error('❌ Session save error:', err);
      return res.status(500).json({ error: 'Failed to save session', details: err.message });
    }
    console.log('✅ Session saved successfully');
    res.json({ 
      success: true, 
      message: 'Session set successfully',
      session: req.session
    });
  });
});

// Test endpoint to get session
app.get('/api/test-session', (req, res) => {
  console.log('🔍 Getting test session...');
  console.log('🔍 Session:', req.session);
  console.log('🔍 Session ID:', req.sessionID);
  
  res.json({
    session: req.session,
    sessionID: req.sessionID,
    hasTestUser: !!req.session.testUser,
    testUser: req.session.testUser
  });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    hasSessionSecret: !!process.env.SESSION_SECRET,
    nodeEnv: process.env.NODE_ENV,
    session: req.session,
    sessionID: req.sessionID,
    cookies: req.headers.cookie
  });
});

app.listen(port, () => {
  console.log(`🚀 Test server running on port ${port}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 