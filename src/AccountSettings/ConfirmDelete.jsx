import React from 'react';
import styles from './ConfirmDelete.module.css';
import { makeRequest } from '../fn';
import { API_BASE_URL } from '../constants';
import { useNavigate } from 'react-router-dom';

const ConfirmDelete = ({ onCancel }) => {
  const navigate = useNavigate();

  const deleteAccount = async () => {
    const response = await makeRequest(API_BASE_URL + '/user/', {
      method: 'DELETE',
    });

    if (!response.ok) {
      alert('Error deleting account');
      onCancel();
      return;
    }

    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <h2>Confirm Deletion</h2>
        <p>
          This will permanently delete the account and all associated
          appliances.
        </p>
        <div className={styles.buttonContainer}>
          <button className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
          <button
            className={styles.confirmDeleteButton}
            onClick={deleteAccount}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDelete;
