const corsOptions = {
  origin: [
    'https://fentsports.netlify.app',  // Your Netlify URL
    'https://fentsports.win',          // Your production URL
    'http://localhost:3000'            // Local development
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}; 