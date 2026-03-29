import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase.config';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

const CallContext = createContext();

export const CallProvider = ({ children }) => {
    const { user, userData } = useAuth();
    const [incomingCall, setIncomingCall] = useState(null);
    const [outgoingCall, setOutgoingCall] = useState(null);
    const [activeCall, setActiveCall] = useState(null);
    const [callDocRef, setCallDocRef] = useState(null);

    // 10-digit AppID and ServerSecret are required for ZegoCloud
    // In a real app, these would be in .env. 
    // I'm providing these placeholders for the user to replace.
    const APP_ID = 0; // Replace with your ZegoCloud AppID
    const SERVER_SECRET = ""; // Replace with your ZegoCloud ServerSecret

    useEffect(() => {
        if (!user) return;

        // Listen for incoming calls
        const q = query(
            collection(db, 'calls'),
            where('receiverId', '==', user.uid),
            where('status', '==', 'ringing')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const callData = snapshot.docs[0].data();
                const callId = snapshot.docs[0].id;
                setIncomingCall({ ...callData, id: callId });
            } else {
                setIncomingCall(null);
            }
        });

        return () => unsubscribe();
    }, [user]);

    const initiateCall = async (receiverId, receiverName, type = 'video') => {
        if (!user) return;

        const callID = Math.floor(Math.random() * 100000000).toString();
        const callData = {
            callerId: user.uid,
            callerName: userData?.username || 'User',
            callerPhoto: userData?.photoURL || '',
            receiverId,
            receiverName,
            status: 'ringing',
            type,
            callID,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'calls'), callData);
        setCallDocRef(docRef);
        setOutgoingCall({ ...callData, id: docRef.id });

        // Listen for call acceptance
        const unsub = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                if (data.status === 'accepted') {
                    setActiveCall({ ...data, id: snap.id });
                    setOutgoingCall(null);
                    unsub();
                } else if (data.status === 'ended' || data.status === 'rejected') {
                    setOutgoingCall(null);
                    setCallDocRef(null);
                    unsub();
                }
            }
        });
    };

    const acceptCall = async () => {
        if (!incomingCall) return;
        const callRef = doc(db, 'calls', incomingCall.id);
        await updateDoc(callRef, { status: 'accepted' });
        setActiveCall(incomingCall);
        setIncomingCall(null);
        setCallDocRef(callRef);
    };

    const rejectCall = async () => {
        if (!incomingCall) return;
        const callRef = doc(db, 'calls', incomingCall.id);
        await updateDoc(callRef, { status: 'rejected' });
        setIncomingCall(null);
    };

    const endCall = async () => {
        if (callDocRef) {
            await updateDoc(callDocRef, { status: 'ended' });
            setTimeout(() => {
                deleteDoc(callDocRef);
            }, 2000);
        }
        setActiveCall(null);
        setOutgoingCall(null);
        setIncomingCall(null);
        setCallDocRef(null);
    };

    return (
        <CallContext.Provider value={{ 
            initiateCall, 
            incomingCall, 
            outgoingCall, 
            activeCall, 
            acceptCall, 
            rejectCall, 
            endCall,
            APP_ID,
            SERVER_SECRET
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);
