import React, { useEffect, useState } from 'react';
import styles from './VirtualRemote.module.css';
import { API_BASE_URL } from '../constants';

const VirtualRemote = ({ id, nickname, onClose }) => {
  const makeRequest = async (url, options) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    return response;
  };

  const initButtons = [...Array(10).keys()].map((index) => {
    return {
      name: `- -`,
      remoteIndex: index,
      mapped: false,
    };
  });

  const [buttons, setButtons] = useState(initButtons);

  useEffect(() => {
    const fetchButtons = async () => {
      const requestedButtons = await makeRequest(
        `${API_BASE_URL}/button/list/${id}`,
        { method: 'GET' }
      );

      if (requestedButtons.ok) {
        const buttons = await requestedButtons.json();
        setButtons((prev) => {
          const newButtons = [...prev];
          for (const b of buttons) {
            newButtons[b.remoteIndex].mapped = true;
            newButtons[b.remoteIndex].name = b.name;
          }
          return newButtons;
        });
      }
    };

    fetchButtons();
  }, [id]);

  const handleBtnClick = async (id, remoteIndex) => {
    console.log(id, remoteIndex);

    const response = await makeRequest(`${API_BASE_URL}/button/click/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, remoteIndex }),
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <h2>{nickname}</h2>
        <div className={styles.virtualRemote}>
          {buttons.map((btn) => (
            <button
              key={btn.remoteIndex}
              className={`${styles.remoteButton} ${
                btn.mapped ? styles.mapped : ''
              }`}
              onClick={() => handleBtnClick(id, btn.remoteIndex)}
            >
              {btn.name}
            </button>
          ))}
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default VirtualRemote;
