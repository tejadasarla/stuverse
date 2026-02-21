const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin
// You will need to provide a service account key file
// const serviceAccount = require('./serviceAccountKey.json');

/*
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
*/

const db = admin.firestore();

module.exports = { admin, db };
