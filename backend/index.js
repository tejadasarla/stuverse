const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('Stuverse Backend is Running');
});

const authRoutes = require('./routes/authRoutes');
// const communityRoutes = require('./routes/communityRoutes');

app.use('/api/auth', authRoutes);
// app.use('/api/communities', communityRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

