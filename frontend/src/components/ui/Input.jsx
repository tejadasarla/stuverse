import React from 'react';
import './ui.css';

const Input = ({ label, id, type = 'text', icon: Icon, className = '', ...props }) => {
    return (
        <div className={`input-group ${className}`}>
            {label && <label htmlFor={id} className="sr-only">{label}</label>}
            <div className="input-wrapper">
                <input
                    id={id}
                    type={type}
                    className="input-field"
                    placeholder={label} // Use label as placeholder for new design
                    {...props}
                />
                {Icon && <Icon className="input-icon" size={18} />}
            </div>
        </div>
    );
};

export default Input;
