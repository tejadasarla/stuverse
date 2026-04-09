import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';
import { Phone, PhoneOff, Video, XCircle, Mic, MicOff, VideoOff } from 'lucide-react';
import './CallManager.css';

const CallTimer = memo(({ activeCall }) => {
    const [callDuration, setCallDuration] = useState(0);

    // Timer effect - isolated to this component to prevent main UI re-renders
    useEffect(() => {
        let interval;
        if (activeCall) {
            setCallDuration(0); // Reset when a call becomes active
            interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            setCallDuration(0);
        }
        return () => clearInterval(interval);
    }, [activeCall]);

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!activeCall) return null;

    return (
        <div className="call-top-bar">
            <span className="call-timer">{formatDuration(callDuration)}</span>
        </div>
    );
});

const CallManager = () => {
    const { 
        incomingCall, 
        outgoingCall, 
        activeCall, 
        acceptCall, 
        rejectCall, 
        endCall,
        localStream,
        remoteStream,
        remoteVideoEl
    } = useCall();
    const { user, userData } = useAuth();
    
    const localVideoRef = useRef(null);
    // remoteVideoRef is shared with CallContext so ontrack can directly set srcObject
    const remoteVideoRef = remoteVideoEl;

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isLocalMain, setIsLocalMain] = useState(false);

    const toggleVideoSize = () => {
        setIsLocalMain(!isLocalMain);
    };

    const toggleMute = () => {
        if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            if (audioTracks.length > 0) {
                audioTracks.forEach(track => { track.enabled = !track.enabled; });
                setIsMuted(!audioTracks[0].enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTracks = localStream.getVideoTracks();
            if (videoTracks.length > 0) {
                videoTracks.forEach(track => { track.enabled = !track.enabled; });
                setIsVideoOff(!videoTracks[0].enabled);
            } else {
                alert("Camera not available for this call.");
            }
        }
    };

    useEffect(() => {
        if (localVideoRef.current && localStream && localVideoRef.current.srcObject !== localStream) {
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch(() => {});
        }
    }, [localStream, activeCall]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream && remoteVideoRef.current.srcObject !== remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(() => {});
        }
    }, [remoteStream, activeCall]);

    // Memoized ref handlers to prevent unnecessary re-attachments during re-renders
    const attachRemoteStream = useCallback((el) => {
        remoteVideoRef.current = el;
        if (el && remoteStream && el.srcObject !== remoteStream) {
            el.srcObject = remoteStream;
            el.play().catch(() => {});
        }
    }, [remoteStream, remoteVideoRef]);

    const attachLocalStream = useCallback((el) => {
        localVideoRef.current = el;
        if (el && localStream && el.srcObject !== localStream) {
            el.srcObject = localStream;
            el.play().catch(() => {});
        }
    }, [localStream]);

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
                <CallTimer activeCall={activeCall} />
                <div className={`video-grid ${isLocalMain ? 'local-is-main' : 'remote-is-main'}`}>
                    <div 
                        className={`video-wrapper shadow-lg ${isLocalMain ? 'preview-video' : 'main-video'}`}
                        onClick={isLocalMain ? toggleVideoSize : undefined}
                    >
                        <video ref={attachRemoteStream} autoPlay playsInline className="remote-video" />
                        <div className="participant-label">
                            {activeCall.receiverId === user.uid ? activeCall.callerName : activeCall.receiverName}
                        </div>
                    </div>

                    <div 
                        className={`video-wrapper shadow-lg ${isLocalMain ? 'main-video' : 'preview-video'}`}
                        onClick={!isLocalMain ? toggleVideoSize : undefined}
                    >
                        <video ref={attachLocalStream} autoPlay playsInline muted className={`local-video ${isVideoOff ? 'hidden' : ''}`} />
                        {isVideoOff && (
                            <div className="video-off-placeholder">
                                <VideoOff size={isLocalMain ? 64 : 32} color="#888" />
                            </div>
                        )}
                        <div className="participant-label">You</div>
                    </div>
                </div>
                
                <div className="call-controls">
                    <button className={`control-btn toggle-btn ${isMuted ? 'active-toggle' : ''}`} onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                    <button className={`control-btn toggle-btn ${isVideoOff ? 'active-toggle' : ''}`} onClick={toggleVideo} title={isVideoOff ? "Turn on camera" : "Turn off camera"}>
                        {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                    </button>
                    <button className="control-btn end-call" onClick={endCall} title="End call">
                        <PhoneOff size={24} />
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default CallManager;

