import React, { useState } from 'react';
import { Plus, X, BarChart2 } from 'lucide-react';
import './CreatePollModal.css';

const CreatePollModal = ({ isOpen, onClose, onCreatePoll }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [allowMultiple, setAllowMultiple] = useState(false);

    if (!isOpen) return null;

    const handleAddOption = () => {
        if (options.length < 10) {
            setOptions([...options, '']);
        }
    };

    const handleRemoveOption = (index) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const trimmedQuestion = question.trim();
        const trimmedOptions = options
            .map(opt => opt.trim())
            .filter(opt => opt !== '');

        if (!trimmedQuestion) {
            alert('Please enter a question');
            return;
        }

        if (trimmedOptions.length < 2) {
            alert('Please provide at least 2 options');
            return;
        }

        onCreatePoll({
            question: trimmedQuestion,
            options: trimmedOptions,
            allowMultiple
        });
        
        // Reset and close
        setQuestion('');
        setOptions(['', '']);
        setAllowMultiple(false);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content poll-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-title">
                        <BarChart2 size={24} className="poll-icon-header" />
                        <h2>Create Poll</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="poll-form">
                    <div className="form-group">
                        <label>Question</label>
                        <input 
                            type="text" 
                            placeholder="Ask a question..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            maxLength={255}
                            required
                        />
                    </div>

                    <div className="form-group options-group">
                        <label>Options (Min 2, Max 10)</label>
                        {options.map((opt, index) => (
                            <div key={index} className="option-input-wrapper">
                                <input 
                                    type="text" 
                                    placeholder={`Option ${index + 1}`}
                                    value={opt}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    maxLength={100}
                                />
                                {options.length > 2 && (
                                    <button 
                                        type="button" 
                                        className="remove-option-btn"
                                        onClick={() => handleRemoveOption(index)}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                        
                        {options.length < 10 && (
                            <button 
                                type="button" 
                                className="add-option-btn"
                                onClick={handleAddOption}
                            >
                                <Plus size={18} /> Add Option
                            </button>
                        )}
                    </div>

                    <div className="poll-settings">
                        <div className="toggle-setting">
                            <div className="setting-info">
                                <span>Allow multiple answers</span>
                                <p>Users can select more than one option</p>
                            </div>
                            <label className="switch">
                                <input 
                                    type="checkbox" 
                                    checked={allowMultiple}
                                    onChange={(e) => setAllowMultiple(e.target.checked)}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>

                    <div className="form-footer">
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="submit-btn poll-submit">
                            Create Poll
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePollModal;
