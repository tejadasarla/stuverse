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
    const callUnsub = useRef(null);
    const candidateUnsub = useRef(null);

    const cleanupCall = () => {
        if (callUnsub.current) callUnsub.current();
        if (candidateUnsub.current) candidateUnsub.current();
        
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        setRemoteStream(null);
        setActiveCall(null);
        setOutgoingCall(null);
        setIncomingCall(null);
        setCallId(null);
        
        pc.current.close();
        pc.current = new RTCPeerConnection(servers);
    };

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'calls'),
            where('receiverId', '==', user.uid),
            where('status', '==', 'ringing')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    setIncomingCall({ ...change.doc.data(), id: change.doc.id });
                }
            });
        });

        return () => {
            unsubscribe();
            cleanupCall();
        };
    }, [user]);

    const initiateCall = async (receiverId, receiverName, type = 'video', fixedId = null) => {
        if (!user) return;

        if (fixedId) {
            const snap = await getDoc(doc(db, 'calls', fixedId));
            if (snap.exists() && (snap.data().status === 'ringing' || snap.data().status === 'accepted')) {
                return joinCallById(fixedId);
            }
        }

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (type === 'audio') {
                stream.getVideoTracks().forEach(track => track.enabled = false);
            }
        } catch (err) {
            console.warn("Could not get video stream, falling back to audio only.");
            stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        }
        setLocalStream(stream);
        
        const remoteStr = new MediaStream();
        setRemoteStream(remoteStr);

        stream.getTracks().forEach((track) => pc.current.addTrack(track, stream));

        pc.current.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            } else {
                setRemoteStream(new MediaStream([event.track]));
            }
        };

        const callDoc = fixedId ? doc(db, 'calls', fixedId) : doc(collection(db, 'calls'));
        setCallId(callDoc.id);

        pc.current.onicecandidate = (event) => {
            if (event.candidate) {
                addDoc(collection(callDoc, 'offerCandidates'), event.candidate.toJSON());
            }
        };

        const offerDescription = await pc.current.createOffer();
        await pc.current.setLocalDescription(offerDescription);

        const callData = {
            callerId: user.uid,
            callerName: userData?.username || 'User',
            callerPhoto: userData?.photoURL || '',
            receiverId,
            receiverName,
            status: 'ringing',
            type,
            offer: { sdp: offerDescription.sdp, type: offerDescription.type },
            createdAt: serverTimestamp()
        };

        await setDoc(callDoc, callData);
        setOutgoingCall({ ...callData, id: callDoc.id });

        if (callUnsub.current) callUnsub.current();
        callUnsub.current = onSnapshot(callDoc, (snapshot) => {
            const data = snapshot.data();
            if (!pc.current.currentRemoteDescription && data?.answer) {
                pc.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
            if (data?.status === 'accepted') {
                setActiveCall({ ...data, id: snapshot.id });
                setOutgoingCall(null);
            } else if (data?.status === 'rejected' || data?.status === 'ended') {
                cleanupCall();
            }
        });

        if (candidateUnsub.current) candidateUnsub.current();
        candidateUnsub.current = onSnapshot(collection(callDoc, 'answerCandidates'), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    pc.current.addIceCandidate(new RTCIceCandidate(change.doc.data())).catch(() => {});
                }
            });
        });
    };

    const joinCallById = async (id) => {
        const snap = await getDoc(doc(db, 'calls', id));
        if (!snap.exists()) return alert("Call not found");
        const data = snap.data();
        setIncomingCall({ ...data, id });
        await acceptCallWithData({ ...data, id });
    };

    const acceptCallWithData = async (call) => {
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (call.type === 'audio') {
                stream.getVideoTracks().forEach(track => track.enabled = false);
            }
        } catch (err) {
            console.warn("Could not get video stream, falling back to audio only.");
            stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        }
        setLocalStream(stream);

        const remoteStr = new MediaStream();
        setRemoteStream(remoteStr);

        stream.getTracks().forEach((track) => pc.current.addTrack(track, stream));

        pc.current.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            } else {
                setRemoteStream(new MediaStream([event.track]));
            }
        };

        const callDoc = doc(db, 'calls', call.id);
        pc.current.onicecandidate = (event) => {
            if (event.candidate) {
                addDoc(collection(callDoc, 'answerCandidates'), event.candidate.toJSON());
            }
        };

        await pc.current.setRemoteDescription(new RTCSessionDescription(call.offer));
        const answerDescription = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answerDescription);

        await updateDoc(callDoc, { 
            answer: { type: answerDescription.type, sdp: answerDescription.sdp }, 
            status: 'accepted' 
        });

        if (candidateUnsub.current) candidateUnsub.current();
        candidateUnsub.current = onSnapshot(collection(callDoc, 'offerCandidates'), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    pc.current.addIceCandidate(new RTCIceCandidate(change.doc.data())).catch(() => {});
                }
            });
        });

        if (callUnsub.current) callUnsub.current();
        callUnsub.current = onSnapshot(callDoc, (snapshot) => {
            if (snapshot.data()?.status === 'ended') cleanupCall();
        });

        setActiveCall(call);
        setIncomingCall(null);
        setCallId(call.id);
    };

    const acceptCall = async () => {
        if (incomingCall) await acceptCallWithData(incomingCall);
    };

    const rejectCall = async () => {
        if (incomingCall) {
            await updateDoc(doc(db, 'calls', incomingCall.id), { status: 'rejected' });
            setIncomingCall(null);
        }
    };

    const endCall = async () => {
        if (callId || activeCall?.id) {
            await updateDoc(doc(db, 'calls', callId || activeCall.id), { status: 'ended' });
        }
        cleanupCall();
    };

    return (
        <CallContext.Provider value={{ initiateCall, incomingCall, outgoingCall, activeCall, acceptCall, rejectCall, endCall, joinCallById, localStream, remoteStream }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);

