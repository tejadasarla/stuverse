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
    const remoteStreamRef = useRef(new MediaStream());
    const callUnsub = useRef(null);
    const candidateUnsub = useRef(null);
    // Track when the call was accepted for duration calculation
    const callAcceptedAt = useRef(null);
    // Store call metadata needed for history writing
    const callMeta = useRef(null);
    // Direct ref to remote video element — allows ontrack to bypass React render timing
    const remoteVideoEl = useRef(null);

    const writeCallHistory = async (status, meta, durationSeconds = 0) => {
        try {
            await addDoc(collection(db, 'callHistory'), {
                callerId: meta.callerId,
                callerName: meta.callerName,
                callerPhoto: meta.callerPhoto || '',
                receiverId: meta.receiverId,
                receiverName: meta.receiverName,
                // participants array enables array-contains queries without composite indexes
                participants: [meta.callerId, meta.receiverId],
                type: meta.type || 'video',
                status, // 'answered' | 'missed' | 'rejected'
                durationSeconds,
                context: meta.context || 'direct',
                communityId: meta.communityId || null,
                startedAt: serverTimestamp(),
            });
        } catch (err) {
            console.error('Failed to write call history:', err);
        }
    };

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
        callAcceptedAt.current = null;
        callMeta.current = null;
        
        pc.current.close();
        pc.current = new RTCPeerConnection(servers);
        remoteStreamRef.current = new MediaStream();
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
        
        // Reset the persistent remote stream and expose it
        remoteStreamRef.current = new MediaStream();
        setRemoteStream(remoteStreamRef.current);

        stream.getTracks().forEach((track) => pc.current.addTrack(track, stream));

        pc.current.ontrack = (event) => {
            event.streams[0]?.getTracks().forEach((track) => {
                remoteStreamRef.current.addTrack(track);
            });
            setRemoteStream(remoteStreamRef.current);
            // Also set directly on the video element if it's already mounted
            if (remoteVideoEl.current) {
                remoteVideoEl.current.srcObject = remoteStreamRef.current;
                remoteVideoEl.current.play().catch(() => {});
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

        const isCommunityCall = !!fixedId;
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

        // Store metadata for history writing
        callMeta.current = {
            callerId: user.uid,
            callerName: userData?.username || 'User',
            callerPhoto: userData?.photoURL || '',
            receiverId,
            receiverName,
            type,
            context: isCommunityCall ? 'community' : 'direct',
            communityId: isCommunityCall ? fixedId : null,
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
                // Mark when call was accepted for duration tracking
                if (!callAcceptedAt.current) {
                    callAcceptedAt.current = Date.now();
                }
                setActiveCall({ ...data, id: snapshot.id });
                setOutgoingCall(null);
            } else if (data?.status === 'rejected') {
                // Write a "missed" record for the caller
                if (callMeta.current) {
                    writeCallHistory('missed', callMeta.current, 0);
                }
                cleanupCall();
            } else if (data?.status === 'ended') {
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

        // Reset the persistent remote stream and expose it
        remoteStreamRef.current = new MediaStream();
        setRemoteStream(remoteStreamRef.current);

        stream.getTracks().forEach((track) => pc.current.addTrack(track, stream));

        pc.current.ontrack = (event) => {
            event.streams[0]?.getTracks().forEach((track) => {
                remoteStreamRef.current.addTrack(track);
            });
            setRemoteStream(remoteStreamRef.current);
            // Also set directly on the video element if it's already mounted
            if (remoteVideoEl.current) {
                remoteVideoEl.current.srcObject = remoteStreamRef.current;
                remoteVideoEl.current.play().catch(() => {});
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

        // Mark accepted time for duration calculation
        callAcceptedAt.current = Date.now();

        // Store metadata for history writing (receiver side)
        callMeta.current = {
            callerId: call.callerId,
            callerName: call.callerName,
            callerPhoto: call.callerPhoto || '',
            receiverId: user.uid,
            receiverName: userData?.username || 'User',
            type: call.type || 'video',
            context: 'direct',
            communityId: null,
        };

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
            // Write rejected history for the receiver
            await writeCallHistory('rejected', {
                callerId: incomingCall.callerId,
                callerName: incomingCall.callerName,
                callerPhoto: incomingCall.callerPhoto || '',
                receiverId: user.uid,
                receiverName: userData?.username || 'User',
                type: incomingCall.type || 'video',
                context: 'direct',
                communityId: null,
            }, 0);
            setIncomingCall(null);
        }
    };

    const endCall = async () => {
        // Calculate duration before cleanup
        const durationSeconds = callAcceptedAt.current
            ? Math.round((Date.now() - callAcceptedAt.current) / 1000)
            : 0;

        if (callId || activeCall?.id) {
            await updateDoc(doc(db, 'calls', callId || activeCall.id), { status: 'ended' });
        }

        // Write answered call history (only caller side writes, to avoid duplicates)
        if (callMeta.current && callMeta.current.callerId === user?.uid) {
            await writeCallHistory('answered', callMeta.current, durationSeconds);
        }

        cleanupCall();
    };

    return (
        <CallContext.Provider value={{ initiateCall, incomingCall, outgoingCall, activeCall, acceptCall, rejectCall, endCall, joinCallById, localStream, remoteStream, remoteVideoEl }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);
