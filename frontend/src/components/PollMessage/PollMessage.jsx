import React, { useState, useMemo } from 'react';
import { Check, Users, X } from 'lucide-react';
import './PollMessage.css';

const PollMessage = ({ pollData, onVote, currentUserId, members }) => {
    const { question, options, allowMultiple, votes = {} } = pollData;
    const [showVoters, setShowVoters] = useState(null); // String (option index) or null

    // Calculate total votes
    const totalVotes = useMemo(() => {
        const uniqueVoters = new Set();
        Object.values(votes).forEach(voterList => {
            voterList.forEach(uid => uniqueVoters.add(uid));
        });
        return uniqueVoters.size;
    }, [votes]);

    // Check if current user has voted for a specific option
    const hasVotedFor = (option) => {
        return votes[option]?.includes(currentUserId);
    };

    const handleVoteClick = (option) => {
        onVote(option);
    };

    const getVoterNames = (option) => {
        const voterIds = votes[option] || [];
        return voterIds.map(uid => {
            const member = members.find(m => m.id === uid);
            return member ? member.username : 'Unknown User';
        });
    };

    return (
        <div className="poll-message-container">
            <h3 className="poll-question">{question}</h3>
            <p className="poll-subtitle">
                {allowMultiple ? 'Select one or more' : 'Select one'} • {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
            </p>

            <div className="poll-options">
                {options.map((option, index) => {
                    const voterIds = (votes && votes[option]) || [];
                    const voteCount = voterIds.length;
                    const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                    const voted = hasVotedFor(option);

                    return (
                        <div 
                            key={index} 
                            className={`poll-option-row ${voted ? 'voted' : ''}`}
                            onClick={() => handleVoteClick(option)}
                        >
                            <div className="poll-option-bg" style={{ width: `${percentage}%` }}></div>
                            <div className="poll-option-content">
                                <span className="option-text">{option}</span>
                                <div className="option-results">
                                    {voteCount > 0 && (
                                        <div 
                                            className="voter-avatars" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowVoters(option);
                                            }}
                                        >
                                            {voterIds.slice(0, 3).map(uid => {
                                                const member = members.find(m => m.id === uid);
                                                return (
                                                    <div key={uid} className="voter-mini-avatar" title={member?.username}>
                                                        {member?.photoURL ? (
                                                            <img src={member.photoURL} alt="" />
                                                        ) : (
                                                            <span>{member?.username?.charAt(0) || 'U'}</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {voterIds.length > 3 && <span className="more-voters">+{voterIds.length - 3}</span>}
                                        </div>
                                    )}
                                    <span className="vote-count">{voteCount}</span>
                                    {voted && <Check size={16} className="voted-check" />}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Voters Detail Modal */}
            {showVoters && (
                <div className="voters-modal-overlay" onClick={() => setShowVoters(null)}>
                    <div className="voters-modal" onClick={e => e.stopPropagation()}>
                        <div className="voters-modal-header">
                            <h4>Votes for "{showVoters}"</h4>
                            <button onClick={() => setShowVoters(null)}><X size={18} /></button>
                        </div>
                        <div className="voters-list">
                            {(votes[showVoters] || []).map(uid => {
                                const member = members.find(m => m.id === uid);
                                return (
                                    <div key={uid} className="voter-item">
                                        <div className="voter-avatar">
                                            {member?.photoURL ? (
                                                <img src={member.photoURL} alt={member.username} />
                                            ) : (
                                                <span>{member?.username?.charAt(0) || 'U'}</span>
                                            )}
                                        </div>
                                        <span className="voter-name">{member?.username || 'Unknown User'}</span>
                                        {uid === currentUserId && <span className="you-tag">(You)</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PollMessage;
