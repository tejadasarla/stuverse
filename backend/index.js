const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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
