import React from 'react';
import './styles/ModalWrapper.css';

const ModalWrapper = ({ children, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
};

export default ModalWrapper;
