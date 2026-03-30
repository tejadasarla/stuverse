const { admin, db } = require('../config/firebase');

// Auth Controller
exports.register = async (req, res) => {
    try {
        const { email, password, username, dob, collegeName, branch, yearOfStudy } = req.body;

        // Domain validation for college emails
        const collegeEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|ac\.in|edu\.sg|edu\.[a-z]{2})$/i;
        if (!collegeEmailRegex.test(email)) {
            return res.status(400).json({ error: "Only official college email addresses (.edu, .ac.in, .edu.sg) are allowed." });
        }

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
            dob: dob || '',
            collegeName: collegeName || '',
            branch: branch || '',
            yearOfStudy: yearOfStudy || '',
            location: 'Global Stuverse',
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

exports.deleteAccount = async (req, res) => {
    const uid = req.user.uid;
    console.log(`Starting deletion process for user: ${uid}`);

    try {
        // 1. Delete user document from Firestore (Wait for it)
        await db.collection('users').doc(uid).delete();
        console.log(`Firestore document for ${uid} deleted`);

        // 2. Attempt to delete storage profile image (if exists)
        try {
            // Note: We need a bucket reference. Usually the default bucket is fine.
            const bucket = admin.storage().bucket();
            const file = bucket.file(`profiles/${uid}`);
            const [exists] = await file.exists();
            if (exists) {
                await file.delete();
                console.log(`Storage image for ${uid} deleted`);
            }
        } catch (storageErr) {
            console.log(`No profile image found or storage error:`, storageErr.message);
            // We continue anyway even if storage deletion fails
        }

        // 3. Delete from Firebase Auth (The critical part)
        await admin.auth().deleteUser(uid);
        console.log(`Firebase Auth account for ${uid} deleted`);

        res.status(200).json({ message: 'Account and all associated data deleted successfully.' });
    } catch (error) {
        console.error('Delete account backend error:', error);
        res.status(500).json({ error: `Internal server error: ${error.message}` });
    }
};
