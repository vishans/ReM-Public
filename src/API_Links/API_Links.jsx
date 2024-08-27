import React, { useState, useEffect, useCallback } from 'react';
import styles from './API_Links.module.css';
import { API_BASE_URL } from '../constants';
import { makeRequest } from '../fn';

const API_Links = ({ id, nickname, onClose }) => {
  const [buttons, setButtons] = useState([]);
  const [status, setStatus] = useState('loading');

  const fetchData = useCallback(async () => {
    try {
      const response = await makeRequest(`${API_BASE_URL}/v1/APIKey/${id}`, {
        method: 'GET',
      });

      const btns = await makeRequest(`${API_BASE_URL}/button/list/${id}`, {
        method: 'GET',
      });

      if (response.ok && btns.ok) {
        const { apiKey } = await response.json();
        const buttons = await btns.json();
        setStatus('success');
        return { buttons, apiKey };
      } else {
        if (btns.status === 404) {
          setStatus('not found');
        } else {
          setStatus('error');
        }
        console.error('Error fetching buttons data');
        return null;
      }
    } catch (error) {
      setStatus('error');
      console.error('Error fetching data:', error);
      return null;
    }
  }, [id]);

  const updateButtons = useCallback(async () => {
    const data = await fetchData();
    if (data) {
      const { buttons, apiKey } = data;
      setButtons(
        buttons.map((button) => ({
          buttonName: button.name,
          apiLink: `${API_BASE_URL}/v1/press/${apiKey}/${button.remoteIndex}`,
        }))
      );
    }
  }, [fetchData]);

  useEffect(() => {
    updateButtons();
  }, [updateButtons]);

  const requestNewKey = async () => {
    try {
      const response = await makeRequest(`${API_BASE_URL}/v1/newKey/${id}`, {
        method: 'GET',
      });

      if (response.ok) {
        updateButtons();
      } else {
        console.error('Error generating new key');
      }
    } catch (error) {
      console.error('Error requesting new key:', error);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <h2 style={{ marginBlock: '10px' }}>API Links</h2>
        <p style={{ textAlign: 'center' }}>
          Do not share these links with anyone. <br />
          If you create a new key, the old key will be invalidated.
        </p>

        {buttons.length > 0 && status === 'success' && (
          <div className={styles.apiLinks}>
            {buttons.map((button) => (
              <div key={button.apiLink} className={styles.buttonContainer}>
                <div className={styles.buttonName}>{button.buttonName}</div>
                <div className={styles.apiLink}>{button.apiLink}</div>
              </div>
            ))}
          </div>
        )}

        {buttons.length === 0 && status === 'not found' && (
          <div className={styles.loading}>
            <span className={`material-symbols-outlined ${styles.icon}`}>close</span>
            <p>No buttons found</p>
          </div>
        )}

        {status === 'loading' && (
          <div className={styles.loading}>
            <span className={`material-symbols-outlined ${styles.icon} ${styles.rotate}`}>
              sync
            </span>

            <p>Retrieving</p>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.loading}>
            <span className={`material-symbols-outlined ${styles.icon}`}>error</span>
          </div>
        )}

        <div className={styles.lowerButtons}>
          <button className={styles.closeButton} onClick={requestNewKey}>
            New Key
          </button>
          <button className={styles.closeButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default API_Links;
