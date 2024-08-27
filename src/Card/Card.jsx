import React from 'react';
import styles from './Card.module.css';

const Card = ({
  nickname,
  id,
  lastSeen,
  onAPIClick,
  onDeleteClick,
  onRemoteClick,
  onRemapClick,
}) => {
  const isOnline = (lastSeen) => {
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    return currentTime - lastSeen <= 5;
  };

  return (
    <div className={styles.card}>
      <h2>
        <span onClick={onAPIClick} className={styles.nickname}>
          {nickname}
        </span>{' '}
        <span className={isOnline(lastSeen) ? styles.online : styles.offline}>
          &#9679;
        </span>
      </h2>
      <h3>{id}</h3>
      <div className={styles.options}>
        <span
          className={
            `material-symbols-outlined ${styles.btn}` +
            `${isOnline(lastSeen) ? '' : ` ${styles['btn-disabled']}`} `
          }
          onClick={onRemoteClick}
          disable={isOnline(lastSeen) ? 'false' : 'true'}
        >
          remote_gen
        </span>
        <span
          className={
            `material-symbols-outlined ${styles.btn}` +
            `${isOnline(lastSeen) ? '' : ` ${styles['btn-disabled']}`} `
          }
          onClick={onRemapClick}
          disable={isOnline(lastSeen) ? 'false' : 'true'}
        >
          switch_access_shortcut_add
        </span>
        <span
          className={`material-symbols-outlined ${styles.btn}`}
          onClick={onDeleteClick}
        >
          cancel
        </span>
      </div>
    </div>
  );
};

export default Card;
