import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '../firebase.config';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const CallContext = createContext();

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
    iceCandidatePoolSize: 10,
};

export const CallProvider = ({ children }) => {
    const { user, userData } = useAuth();
    const [incomingCall, setIncomingCall] = useState(null);
    const [outgoingCall, setOutgoingCall] = useState(null);
    const [activeCall, setActiveCall] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callId, setCallId] = useState(null);
    
    const pc = useRef(new RTCPeerConnection(servers));

    useEffect(() => {
        if (!user) return;

        // Listen for incoming calls
        const q = query(
            collection(db, 'calls'),
            where('receiverId', '==', user.uid),
            where('status', '==', 'ringing')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const callData = change.doc.data();
                    const id = change.doc.id;
                    setIncomingCall({ ...callData, id });
                }
            });
        });

        return () => unsubscribe();
    }, [user]);

    const initiateCall = async (receiverId, receiverName, type = 'video') => {
        if (!user) return;

        const stream = await navigator.mediaDevices.getUserMedia({
            video: type === 'video',
            audio: true,
        });
        setLocalStream(stream);
        
        const remoteStr = new MediaStream();
        setRemoteStream(remoteStr);

        stream.getTracks().forEach((track) => {
            pc.current.addTrack(track, stream);
        });

        pc.current.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track) => {
                remoteStr.addTrack(track);
            });
        };

        const callDoc = doc(collection(db, 'calls'));
        const offerCandidates = collection(callDoc, 'offerCandidates');
        const answerCandidates = collection(callDoc, 'answerCandidates');

        setCallId(callDoc.id);

        pc.current.onicecandidate = (event) => {
            event.candidate && addDoc(offerCandidates, event.candidate.toJSON());
        };

        const offerDescription = await pc.current.createOffer();
        await pc.current.setLocalDescription(offerDescription);

        const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
        };

        const callData = {
            callerId: user.uid,
            callerName: userData?.username || 'User',
            callerPhoto: userData?.photoURL || '',
            receiverId,
            receiverName,
            status: 'ringing',
            type,
            offer,
            createdAt: serverTimestamp()
        };

        await setDoc(callDoc, callData);
        setOutgoingCall({ ...callData, id: callDoc.id });

        // Listen for remote answer
        onSnapshot(callDoc, (snapshot) => {
            const data = snapshot.data();
            if (!pc.current.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                pc.current.setRemoteDescription(answerDescription);
            }
            
            if (data?.status === 'accepted') {
                setActiveCall({ ...data, id: snapshot.id });
                setOutgoingCall(null);
            } else if (data?.status === 'rejected' || data?.status === 'ended') {
                cleanupCall();
            }
        });

        // Listen for remote ICE candidates
        onSnapshot(answerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    const candidate = new RTCIceCandidate(data);
                    pc.current.addIceCandidate(candidate);
                }
            });
        });
    };

    const joinCallById = async (id) => {
        const callDoc = doc(db, 'calls', id);
        const callSnap = await getDoc(callDoc);
        
        if (!callSnap.exists()) {
            alert("Call not found");
            return;
        }

        const callData = callSnap.data();
        setIncomingCall({ ...callData, id });
        // After setting incomingCall, the user can click 'Accept' or we can auto-accept
        // For 'Join Live' features, auto-accept is better:
        await acceptCallWithData({ ...callData, id });
    };

    const acceptCallWithData = async (call) => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: call.type === 'video',
            audio: true,
        });
        setLocalStream(stream);

        const remoteStr = new MediaStream();
        setRemoteStream(remoteStr);

        stream.getTracks().forEach((track) => {
            pc.current.addTrack(track, stream);
        });

        pc.current.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track) => {
                remoteStr.addTrack(track);
            });
        };

        const callDoc = doc(db, 'calls', call.id);
        const answerCandidates = collection(callDoc, 'answerCandidates');
        const offerCandidates = collection(callDoc, 'offerCandidates');

        pc.current.onicecandidate = (event) => {
            event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
        };

        const offerDescription = call.offer;
        await pc.current.setRemoteDescription(new RTCSessionDescription(offerDescription));

        const answerDescription = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answerDescription);

        const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
        };

        await updateDoc(callDoc, { answer, status: 'accepted' });

        onSnapshot(offerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    let data = change.doc.data();
                    pc.current.addIceCandidate(new RTCIceCandidate(data));
                }
            });
        });

        onSnapshot(callDoc, (snapshot) => {
            const data = snapshot.data();
            if (data?.status === 'ended') {
                cleanupCall();
            }
        });

        setActiveCall(call);
        setIncomingCall(null);
        setCallId(call.id);
    };

    const acceptCall = async () => {
        if (!incomingCall) return;
        await acceptCallWithData(incomingCall);
    };


    const rejectCall = async () => {
        if (!incomingCall) return;
        const callRef = doc(db, 'calls', incomingCall.id);
        await updateDoc(callRef, { status: 'rejected' });
        setIncomingCall(null);
    };

    const endCall = async () => {
        if (callId || (activeCall && activeCall.id)) {
            const id = callId || activeCall.id;
            const callRef = doc(db, 'calls', id);
            await updateDoc(callRef, { status: 'ended' });
        }
        cleanupCall();
    };

    const cleanupCall = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        setLocalStream(null);
        setRemoteStream(null);
        setActiveCall(null);
        setOutgoingCall(null);
        setIncomingCall(null);
        setCallId(null);
        // Reset peer connection for next call
        pc.current.close();
        pc.current = new RTCPeerConnection(servers);
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
            joinCallById,
            localStream,
            remoteStream
        }}>

            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);

