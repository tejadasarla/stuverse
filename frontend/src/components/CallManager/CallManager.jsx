import React, { useRef, useEffect } from 'react';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';
import { Phone, PhoneOff, Video, XCircle, Mic, MicOff, VideoOff } from 'lucide-react';
import './CallManager.css';

const CallManager = () => {
    const { 
        incomingCall, 
        outgoingCall, 
        activeCall, 
        acceptCall, 
        rejectCall, 
        endCall,
        localStream,
        remoteStream
    } = useCall();
    const { user, userData } = useAuth();
    
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    if (incomingCall) {
        return (
            <div className="incoming-call-overlay">
                <div className="incoming-call-card">
                    <div className="caller-info">
                        <div className="caller-avatar">
                            {incomingCall.callerPhoto ? <img src={incomingCall.callerPhoto} alt="caller" /> : <span>{incomingCall.callerName[0]}</span>}
                        </div>
                        <h3>{incomingCall.callerName}</h3>
                        <p>Incoming {incomingCall.type} call...</p>
                    </div>
                    <div className="call-actions">
                        <button className="reject-btn" onClick={rejectCall}>
                            <PhoneOff size={24} />
                        </button>
                        <button className="accept-btn" onClick={acceptCall}>
                            <Phone size={24} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (outgoingCall) {
        return (
            <div className="incoming-call-overlay">
                <div className="incoming-call-card">
                    <div className="caller-info">
                        <div className="caller-avatar">
                             {outgoingCall.receiverPhoto ? <img src={outgoingCall.receiverPhoto} alt="receiver" /> : <span>{outgoingCall.receiverName[0]}</span>}
                        </div>
                        <h3>{outgoingCall.receiverName}</h3>
                        <p>Calling...</p>
                    </div>
                    <div className="call-actions">
                        <button className="reject-btn" onClick={endCall}>
                            <PhoneOff size={24} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (activeCall) {
        return (
            <div className="active-call-overlay">
                <div className="video-grid">
                    <div className="remote-video-container">
                        <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
                        <div className="participant-label">{activeCall.receiverId === user.uid ? activeCall.callerName : activeCall.receiverName}</div>
                    </div>
                    <div className="local-video-container">
                        <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
                        <div className="participant-label">You</div>
                    </div>
                </div>
                
                <div className="call-controls">
                    <button className="control-btn end-call" onClick={endCall}>
                        <PhoneOff size={24} />
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default CallManager;

