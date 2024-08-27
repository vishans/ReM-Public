import React, { useState } from 'react';
import styles from './ChangePassword.module.css'; // Use the new CSS file
import { makeRequest } from '../fn';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';

const ChangePassword = () => {
  const navigate = useNavigate();
  if (localStorage.getItem('token') === null) {
    navigate('/');
  }

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [revokeAPIKeys, setRevokeAPIKeys] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    document.getElementById('submitBtn').disabled = true;

    if (newPassword !== confirmNewPassword) {
      alert('Passwords do not match');
      return;
    }

    const response = await makeRequest(API_BASE_URL + '/user/changePassword', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        revokeAPIKeys,
      }),
    });

    if (response.ok) {
      alert('Password changed successfully');
      navigate('/');
    } else {
      alert('Password change failed!');
    }
  };

  return (
    <div className={styles.hero}>
      <div className={styles.title}>
        <span className={styles.blueBox}>Change</span> Password
      </div>
      <div className={styles.mainContent}>
        <form onSubmit={handleChangePassword}>
          <input
            type='password'
            placeholder='Current Password'
            required
            onChange={(e) => {
              setCurrentPassword(e.target.value);
            }}
          />
          <input
            type='password'
            placeholder='New Password'
            required
            onChange={(e) => {
              setNewPassword(e.target.value);
            }}
          />
          <input
            type='password'
            placeholder='Confirm New Password'
            required
            onChange={(e) => {
              setConfirmNewPassword(e.target.value);
            }}
          />
          <label className={styles.checkboxContainer}>
            <input
              type='checkbox'
              onChange={(e) => {
                setRevokeAPIKeys(e.target.checked);
              }}
            />
            <span className={styles.checkboxLabel}>Revoke all API keys</span>
          </label>
          <button id='submitBtn' type='submit'>
            Change Password
          </button>
        </form>
      </div>
      <div className={styles.footer}>
        <span>
          Re<span className={styles.blueBox}>M</span>
        </span>
      </div>
    </div>
  );
};

export default ChangePassword;
