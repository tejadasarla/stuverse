import React, { useEffect, useState } from 'react';
import { db } from '../../firebase.config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Phone, Video, PhoneMissed, PhoneOff, X, PhoneCall } from 'lucide-react';
import './CallHistoryPanel.css';

const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatDate = (ts) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const StatusBadge = ({ status, isIncoming }) => {
    const labels = {
        answered: 'Answered',
        missed: isIncoming ? 'Missed' : 'No Answer',
        rejected: isIncoming ? 'Declined' : 'Rejected',
    };
    return (
        <span className={`ch-status-badge ch-status-${status}`}>
            {labels[status] || status}
        </span>
    );
};

const CallHistoryPanel = ({ currentUserId, targetId, context = 'direct', communityId, onClose, onCallBack }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUserId) return;

        let q;

        if (context === 'community') {
            // Community call history: query by communityId only
            q = query(
                collection(db, 'callHistory'),
                where('communityId', '==', communityId)
            );
        } else {
            // Direct call history: query using participants array-contains
            // This avoids composite indexes — filter client-side for the specific pair
            q = query(
                collection(db, 'callHistory'),
                where('participants', 'array-contains', currentUserId)
            );
        }

        const unsub = onSnapshot(q, (snap) => {
            console.log(`CallHistoryPanel: Fetched ${snap.docs.length} records for ${context}`);
            let recs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            // For direct chats: filter to only records between these two specific users
            if (context === 'direct') {
                const oldLen = recs.length;
                recs = recs.filter(r =>
                    (r.callerId === currentUserId && r.receiverId === targetId) ||
                    (r.callerId === targetId && r.receiverId === currentUserId)
                );
                console.log(`CallHistoryPanel: Filtered from ${oldLen} to ${recs.length} for target ${targetId}`);
            }

            // Sort client-side: newest first
            recs.sort((a, b) => {
                const aTime = a.startedAt?.toMillis?.() ?? (a.startedAt?.seconds * 1000) ?? 0;
                const bTime = b.startedAt?.toMillis?.() ?? (b.startedAt?.seconds * 1000) ?? 0;
                return bTime - aTime;
            });

            setRecords(recs);
            setLoading(false);
        }, (err) => {
            console.error('Call history query error:', err);
            setLoading(false);
        });

        return () => unsub();
    }, [currentUserId, targetId, context, communityId]);

    return (
        <div className="ch-overlay" onClick={onClose}>
            <div className="ch-panel" onClick={e => e.stopPropagation()}>
                <div className="ch-header">
                    <h3>Call History</h3>
                    <button className="ch-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="ch-body">
                    {loading ? (
                        <div className="ch-loading">
                            <div className="ch-spinner" />
                            <span>Loading history...</span>
                        </div>
                    ) : records.length === 0 ? (
                        <div className="ch-empty">
                            <div className="ch-empty-icon">
                                <Phone size={36} />
                            </div>
                            <p>No call history yet</p>
                            <span>Calls will appear here after you make or receive one.</span>
                        </div>
                    ) : (
                        <div className="ch-list">
                            {records.map(record => {
                                const isIncoming = record.receiverId === currentUserId;
                                const otherName = isIncoming ? record.callerName : record.receiverName;
                                const isAnswered = record.status === 'answered';

                                return (
                                    <div key={record.id} className={`ch-record ch-record-${record.status}`}>
                                        <div className="ch-record-icon">
                                            {record.type === 'video' ? (
                                                <Video size={18} />
                                            ) : (
                                                <Phone size={18} />
                                            )}
                                            <div className={`ch-direction ch-direction-${record.status}`}>
                                                {record.status === 'answered' ? (
                                                    isIncoming
                                                        ? <PhoneCall size={10} />
                                                        : <PhoneCall size={10} style={{ transform: 'scaleX(-1)' }} />
                                                ) : (
                                                    <PhoneMissed size={10} />
                                                )}
                                            </div>
                                        </div>

                                        <div className="ch-record-info">
                                            <div className="ch-record-top">
                                                <span className="ch-record-name">
                                                    {context === 'community' ? record.callerName : otherName}
                                                </span>
                                                <StatusBadge status={record.status} isIncoming={isIncoming} />
                                            </div>
                                            <div className="ch-record-bottom">
                                                <span className="ch-record-time">{formatDate(record.startedAt)}</span>
                                                {isAnswered && (
                                                    <span className="ch-record-duration">
                                                        🕐 {formatDuration(record.durationSeconds)}
                                                    </span>
                                                )}
                                                <span className="ch-record-type">
                                                    {record.type === 'video' ? 'Video' : 'Audio'}
                                                </span>
                                            </div>
                                        </div>

                                        {onCallBack && context === 'direct' && (
                                            <button
                                                className="ch-callback-btn"
                                                title="Call Back"
                                                onClick={() => onCallBack(record.type)}
                                            >
                                                {record.type === 'video' ? <Video size={16} /> : <Phone size={16} />}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallHistoryPanel;
