const { admin, db } = require('../config/firebase');

// Auth Controller
exports.register = async (req, res) => {
    try {
        const { email, password, username } = req.body;

        // Create user in Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: username,
        });

        // Store additional user data in Firestore
        await db.collection('users').doc(userRecord.uid).set({
            username,
            email,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(201).json({
            message: 'User registered successfully',
            uid: userRecord.uid
        });
    } catch (error) {
        console.error('Error creating new user:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Logic to login
        res.status(200).json({ message: 'User logged in successfully (Mock API)' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
