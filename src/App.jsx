// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Login/Login';
import Protected from './Protected/Protected';
import SignUp from './SignUp/SignUp';
import ChangePassword from './ChangePassword/ChangePassword';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/protected' element={<Protected />} />
        <Route path='/signup' element={<SignUp />} />
        <Route path='/changepassword' element={<ChangePassword />} />
      </Routes>
    </Router>
  );
};

export default App;
