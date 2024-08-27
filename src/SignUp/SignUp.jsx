import React, { useState } from 'react';
import styles from './SignUp.module.css'; // Use the new CSS file
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cpassword, setCPassword] = useState('');

  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    console.log('handleSignUp');
    e.preventDefault();

    if (password !== cpassword) {
      alert('Passwords do not match');
      return;
    }

    const response = await fetch('http://localhost:3000/api/user/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      alert('User registered successfully');
      navigate('/');
    } else {
      alert('Sign up failed!');
    }
  };

  return (
    <div className={styles.hero}>
      <div className={styles.title}>
        <span className={styles.blueBox}>Sign</span> Up
      </div>
      <div className={styles.mainContent}>
        <form onSubmit={handleSignUp}>
          <input
            onChange={(e) => {
              setUsername(e.target.value);
            }}
            type='text'
            placeholder='Username'
            required
          />
          <input
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            type='password'
            placeholder='Password'
            required
          />
          <input
            onChange={(e) => {
              setCPassword(e.target.value);
            }}
            type='password'
            placeholder='Confirm Password'
            required
          />
          <button type='submit'>Sign Up</button>
        </form>
        <a onClick={() => navigate('/')} className={styles.signupLink}>
          <span className={styles.text}>Already have an account?</span>
          <span className={styles.arrow}>&rarr;</span>
        </a>
      </div>
      <div className={styles.footer}>
        <span>
          Re<span className={styles.blueBox}>M</span>
        </span>
        {/* <span >&nbsp;© 2024</span>
        <span className={styles.copyright}>All rights reserved</span> */}
      </div>
    </div>
  );
};

export default SignUp;
