import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase.config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log('Auth state changed:', currentUser?.uid);
            setUser(currentUser);
            try {
                if (currentUser) {
                    console.log('Fetching user data for:', currentUser.uid);
                    // Fetch additional user data from Firestore
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userDoc.exists()) {
                        console.log('User data found');
                        setUserData(userDoc.data());
                    } else {
                        console.log('No user document found in Firestore');
                    }
                } else {
                    setUserData(null);
                }
            } catch (error) {
                console.error('Error in AuthProvider:', error);
            } finally {
                console.log('Setting loading to false');
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const refreshUserData = async () => {
        if (user) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                setUserData(userDoc.data());
            }
        }
    };

    const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login', restricted: false });

    const openAuthModal = (mode = 'login', restricted = false) => {
        setAuthModal({ isOpen: true, mode, restricted });
    };

    const closeAuthModal = () => {
        setAuthModal({ ...authModal, isOpen: false });
    };

    const value = {
        user,
        userData,
        loading,
        refreshUserData,
        authModal,
        openAuthModal,
        closeAuthModal
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
                    <div className="loader">Loading Stuverse...</div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
