import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../Card/Card';
import styles from './Protected.module.css';
import SetupWizard from '../SetupWizard/SetupWizard';
import VirtualRemote from '../VirtualRemote/VirtualRemote';
import API_Links from '../API_Links/API_Links';
import AccountSettings from '../AccountSettings/AccountSettings';
import { API_BASE_URL } from '../constants';
import { makeRequest } from '../fn';

const Protected = () => {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isSetupWindowVisible, setSetupWindowVisible] = useState(false);
  const [applianceList, setApplianceList] = useState([]);

  const [isRemoteVisible, setIsRemoteVisible] = useState(false);
  const [selectedRemoteId, setSelectedRemoteId] = useState('');
  const [selectedRemoteNickname, setSelectedRemoteNickname] = useState('');
  const [isAPILinksVisible, setIsAPILinksVisible] = useState(false);
  const [isDeletePopupVisible, setIsDeletePopupVisible] = useState(false);

  const [isAccountSettingsVisible, setAccountSettingsVisible] = useState(false);

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const fetchAppliances = async () => {
    const response = await makeRequest(API_BASE_URL + '/appliance/list', {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      data.sort((a, b) => b.lastSeen - a.lastSeen);
      setApplianceList(data);
    } else {
      console.log('Error fetching appliances');
    }
  };

  useEffect(() => {
    // fetchAppliances();
    const intervalId = setInterval(fetchAppliances, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (
      isSetupWindowVisible === false &&
      isAPILinksVisible === false &&
      isRemoteVisible === false &&
      isDeletePopupVisible === false &&
      isAccountSettingsVisible === false
    ) {
      fetchAppliances();
    }
  }, [
    isSetupWindowVisible,
    isAPILinksVisible,
    isRemoteVisible,
    isDeletePopupVisible,
    isAccountSettingsVisible,
  ]);

  const disablePopup = () => {
    setIsPopupVisible(false);
    setIsDeletePopupVisible(false);
  };

  const infoPopupTitle = useRef(null);
  const infoPopupContent = useRef(null);
  const setupWizStep = useRef(1);
  const EnableinfoPopup = (title, content) => {
    infoPopupTitle.current = title;
    infoPopupContent.current = content;
    setIsPopupVisible(true);
  };

  const applianceToDelete = useRef(null);
  const deleteAppliance = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    try {
      const response = await fetch(API_BASE_URL + '/appliance/', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete appliance');
      }

      fetchAppliances();
      setIsDeletePopupVisible(false);
    } catch (error) {
      console.error('Error deleting appliance:', error);
    }
  };

  const handleDeleteClick = (appliance) => {
    applianceToDelete.current = appliance;
    setIsDeletePopupVisible(true);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      const response = await fetch(API_BASE_URL + '/protected', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsername(data.username);
      } else {
        navigate('/');
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleRemap = async (id) => {
    setSetupWindowVisible(true);
  };

  return (
    <div className={styles.hero}>
      <div className={styles.title}>
        <span
          onClick={() => setAccountSettingsVisible(true)}
          className={styles.username}
        >
          {username}
        </span>
        's Appliances
      </div>
      <div onClick={logout} className={styles['logout-button']}>
        <span className={`material-symbols-outlined`}>logout</span>
      </div>
      <div className={styles['main-content']}>
        <div className={styles['cards-holder']}>
          {applianceList.map((appliance) => (
            <Card
              key={appliance.id}
              id={appliance.id}
              nickname={appliance.nickname}
              lastSeen={appliance.lastSeen}
              onRemoteClick={() => {
                setSelectedRemoteId(appliance.id);
                setSelectedRemoteNickname(appliance.nickname);
                setIsRemoteVisible(true);
              }}
              onAPIClick={() => {
                setSelectedRemoteId(appliance.id);
                setSelectedRemoteNickname(appliance.nickname);
                setIsAPILinksVisible(true);
              }}
              onRemapClick={() => {
                setSelectedRemoteId(appliance.id);
                setSelectedRemoteNickname(appliance.nickname);
                setupWizStep.current = 2;
                setSetupWindowVisible(true);
              }}
              onDeleteClick={() => handleDeleteClick(appliance)}
            />
          ))}
          {!applianceList.length && (
            <h1 style={{ color: 'grey' }}>No appliances found</h1>
          )}
        </div>
        <div className={styles['button-holder']}>
          <button
            onClick={() => {
              setupWizStep.current = 1;
              setSelectedRemoteId('ABCD');
              setSelectedRemoteNickname('Fan');
              setSetupWindowVisible(true);
            }}
          >
            <span
              className={`material-symbols-outlined`}
              style={{ fontSize: '6vh' }}
            >
              add
            </span>
          </button>
        </div>
      </div>

      {isPopupVisible && (
        <div className={`${styles.overlay} ${styles['show-overlay']}`}>
          <div className={styles.popup}>
            <div className={styles['info-popup']}>
              <h2>{infoPopupTitle.current}</h2>
              <p>{infoPopupContent.current}</p>
              <button onClick={disablePopup}>Close</button>
            </div>
          </div>
        </div>
      )}

      {isDeletePopupVisible && (
        <div className={`${styles.overlay} ${styles['show-overlay']}`}>
          <div className={styles.popup}>
            <div className={styles['info-popup']}>
              <h2>Delete Appliance</h2>
              <p>
                Are you sure you want to delete appliance{' '}
                {applianceToDelete.current.nickname} with ID:{' '}
                {applianceToDelete.current.id}?
              </p>
              <div style={{ marginLeft: 'auto' }}>
                <button
                  style={{ backgroundColor: 'red' }}
                  onClick={() => deleteAppliance(applianceToDelete.current.id)}
                >
                  Yes
                </button>
                <button
                  style={{ marginLeft: '50px' }}
                  onClick={() => setIsDeletePopupVisible(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSetupWindowVisible && (
        <SetupWizard
          onClose={() => {
            setSetupWindowVisible(false);
            setupWizStep.current = 1;
          }}
          EnableinfoPopup={EnableinfoPopup}
          id={selectedRemoteId}
          cStep={setupWizStep.current}
          nickn={selectedRemoteNickname}
        />
      )}

      {isRemoteVisible && (
        <VirtualRemote
          id={selectedRemoteId}
          nickname={selectedRemoteNickname}
          onClose={() => setIsRemoteVisible(false)}
        />
      )}

      {isAPILinksVisible && (
        <API_Links
          id={selectedRemoteId}
          nickname={selectedRemoteNickname}
          onClose={() => setIsAPILinksVisible(false)}
        />
      )}

      {isAccountSettingsVisible && (
        <AccountSettings onClose={() => setAccountSettingsVisible(false)} />
      )}
    </div>
  );
};

export default Protected;
