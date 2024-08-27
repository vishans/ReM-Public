// src/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { API_BASE_URL } from '../constants';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const response = await fetch(API_BASE_URL + '/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token);
      navigate('/protected');
    } else {
      alert('Login failed!');
    }
  };

  return (
    <div className={styles.hero}>
      <div className={styles.title}>
        Re<span className={styles['blue-box']}>M</span>
      </div>
      <div className={styles['main-content']}>
        <form onSubmit={handleLogin}>
          <input
            type='text'
            placeholder='Username'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type='password'
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type='submit'>Login</button>
          <a
            className={styles['signup-link']}
            onClick={() => navigate('/signup')}
          >
            <span className={styles.text}>No account? Sign up</span>
            <span className={styles.arrow}>&#8594;</span>
          </a>
        </form>
      </div>
      <div className={styles.footer}>
        Re<span className={styles['blue-box']}>M</span> &nbsp; 2024
        <span className={styles.copyright}>
          &copy; 2024 All rights reserved.
        </span>
      </div>
    </div>
  );
};

export default Login;
