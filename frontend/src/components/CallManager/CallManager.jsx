import React, { useRef, useEffect } from 'react';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { Phone, PhoneOff, Video, XCircle, CheckCircle } from 'lucide-react';
import './CallManager.css';

const CallManager = () => {
    const { 
        incomingCall, 
        outgoingCall, 
        activeCall, 
        acceptCall, 
        rejectCall, 
        endCall,
        APP_ID, 
        SERVER_SECRET 
    } = useCall();
    const { user, userData } = useAuth();
    const callContainerRef = useRef(null);

    useEffect(() => {
        if (!activeCall || !callContainerRef.current) return;

        const myMeeting = async (element) => {
            const userName = userData?.username || 'Student';
            const roomID = activeCall.callID;
            
            // In a production app, the token would be generated on the server
            // For this project, we'll generate it on the client
            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                APP_ID, 
                SERVER_SECRET, 
                roomID, 
                user.uid, 
                userName
            );

            const zp = ZegoUIKitPrebuilt.create(kitToken);
            zp.joinRoom({
                container: element,
                scenario: {
                    mode: activeCall.type === 'video' ? ZegoUIKitPrebuilt.ScenarioVideoCall : ZegoUIKitPrebuilt.ScenarioAudioCall,
                },
                showPreJoinView: false,
                onLeaveRoom: () => {
                    endCall();
                },
                sharedLinks: [{
                    name: 'Copy link',
                    url: window.location.origin
                }]
            });
        };

        myMeeting(callContainerRef.current);
    }, [activeCall, user, userData, APP_ID, SERVER_SECRET, endCall]);

    if (incomingCall) {
        return (
            <div className="incoming-call-overlay">
                <div className="incoming-call-card">
                    <div className="caller-info">
                        <div className="caller-avatar">
                            {incomingCall.callerPhoto ? <img src={incomingCall.callerPhoto} /> : <span>{incomingCall.callerName[0]}</span>}
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
                             {outgoingCall.receiverPhoto ? <img src={outgoingCall.receiverPhoto} /> : <span>{outgoingCall.receiverName[0]}</span>}
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
                <div ref={callContainerRef} className="call-container" />
                <button className="minimize-call" onClick={endCall}>
                    <XCircle size={32} />
                </button>
            </div>
        );
    }

    return null;
};

export default CallManager;
