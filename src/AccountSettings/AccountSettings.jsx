import React, { useState } from 'react';
import styles from './AccountSettings.module.css';
import ConfirmDelete from './ConfirmDelete';
import { useNavigate } from 'react-router-dom';

const AccountSettings = ({ onClose, onDeleteAccount }) => {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <div className={styles.overlay}>
        <div className={styles.popup}>
          <h2>Account Settings</h2>
          <button
            className={styles.changePasswordButton}
            onClick={() => {
              navigate('/changepassword');
            }}
          >
            Change Password
          </button>
          <button
            className={styles.deleteAccountButton}
            onClick={() => setConfirmDelete(true)}
          >
            Delete Account
          </button>
          <button className={styles.closeButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmDelete onCancel={() => setConfirmDelete(false)} />
      )}
    </>
  );
};

export default AccountSettings;
