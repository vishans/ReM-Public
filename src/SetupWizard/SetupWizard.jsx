import React, { useState, useRef, useEffect } from 'react';
import styles from './SetupWizard.module.css';
import { API_BASE_URL } from '../constants';
import { makeRequest } from '../fn';

const SetupWizard = ({ onClose, EnableinfoPopup, cStep, id, nickn }) => {
  const [currentStep, setCurrentStep] = useState(cStep || 1); // 3.
  const [applianceId, setApplianceId] = useState(id || '');
  const [nickname, setNickname] = useState(nickn || '');

  const initButtons = [...Array(10).keys()].map((index) => {
    return {
      name: `Button${index}`,
      remoteIndex: index,
      mapped: false,
    };
  });

  const [selectedButton, setSelectedButton] = useState(null);
  const [mappedButtons, setMappedButtons] = useState(initButtons);
  const [buttonWizardStep, setButtonWizardStep] = useState(1);

  const [buttonMappingMessage, setButtonMappingMessage] = useState('Wait');
  const [isPolling, setIsPolling] = useState(false);
  const [timeoutTimer, setTimeoutTimer] = useState(null);
  const timeoutDuration = 10 * 60 * 1000;

  const abortSetup = () => {
    setCurrentStep(1);
    setSelectedButton(null);
    setButtonWizardStep(1);
    onClose();
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      console.log(`nickname is ${nickname}`);

      const response = await makeRequest(API_BASE_URL + '/appliance/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: applianceId, nickname: nickname }),
      });

      if (!response) {
        naviagate('/');
      }

      if (response.ok) {
        console.log('Appliance added successfully');
        setCurrentStep(currentStep + 1);
      } else {
        // Handle error
        console.error('Error adding appliance');
        const errorText = await response.text(); // Get error response text if needed
        console.error('Error details:', errorText);
        EnableinfoPopup('Error', errorText);
      }
    } else if (currentStep === 2) {
      // Handle mapping buttons step
      onClose(); // skip 'setup complete' window
      // setCurrentStep(currentStep + 1);
    }
  };

  // Handle button click on the virtual remote
  const handleButtonClick = async (btn) => {
    setSelectedButton(btn);
    setButtonWizardStep(1);
  };

  const handleNextButtonWizardStep = async () => {
    if (!selectedButton) return;
    function isValidString(str, n) {
      // Check if the string is at most n characters long
      if (str.length > n) {
        return false;
      }

      // Check if the string contains any spaces
      if (str.includes(' ')) {
        return false;
      }

      // If both conditions are met, return true
      return true;
    }

    // const sN = document.getElementById('selectedBtnName').value;

    if (!isValidString(selectedButton.name, 7)) {
      // Handle error
      console.log('Invalid button name');
      return;
    }

    const response = await makeRequest(API_BASE_URL + `/button/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ applianceId, selectedButton }),
    });

    if (!response.ok) {
      const errorText = await response.text(); // Get error response text if needed
      console.error('Error details:', errorText);
      EnableinfoPopup('Error', errorText);
      abortSetup();
      return;
    }

    setButtonWizardStep(2);
    setIsPolling(true);

    // timeout before esp32 goes back to send mode
    setTimeoutTimer((prev) => {
      console.log('Adding timeout');
      clearTimeout(prev);
      return setTimeout(() => {
        cancelButtonMapping();
        EnableinfoPopup('Error', 'Timeout');
      }, timeoutDuration);
    });
  };

  const cancelButtonMapping = async () => {
    console.log('canceling button mapping');

    setIsPolling(false);
    setButtonWizardStep(1);
    setButtonMappingMessage('Wait');
    setSelectedButton(null);
    clearTimeout(timeoutTimer);

    try {
      const response = await makeRequest(
        API_BASE_URL + `/button/unselect/${applianceId}`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        const data = await response.text();
        console.log(data); // Should log "OK" if the server responds with "OK"
      } else {
        throw new Error('Network response was not ok.');
      }
    } catch (error) {
      console.error(
        'There has been a problem with your fetch operation:',
        error
      );
      abortSetup();

      const errorText = await response.text(); // Get error response text if needed
      console.error('Error details:', errorText);
      EnableinfoPopup('Error', errorText);
    }
  };

  const handleRemapButton = async () => {
    const response = await makeRequest(API_BASE_URL + `/button/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ applianceId, selectedButton }),
    });

    if (!response.ok) {
      const errorText = await response.text(); // Get error response text if needed
      console.error('Error details:', errorText);
      EnableinfoPopup('Error', errorText);
      abortSetup();
      return;
    }

    setIsPolling(true);

    // timeout before esp32 goes back to send mode
    setTimeoutTimer((prev) => {
      console.log('Adding timeout');
      clearTimeout(prev);
      return setTimeout(() => {
        cancelButtonMapping();
        EnableinfoPopup('Error', 'Timeout');
      }, timeoutDuration);
    });
  };

  const usePolling = async (
    applianceId,
    setButtonMappingMessage,
    isPolling
  ) => {
    const intervalIdRef = useRef(null);

    useEffect(() => {
      if (!isPolling) {
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
        return;
      }

      const pollServer = async () => {
        try {
          const response = await makeRequest(
            API_BASE_URL + `/button/signalStatus/${applianceId}`,
            {
              method: 'GET',
            }
          );

          if (!response) return;

          const text = await response.text();

          if (!response.ok) {
            EnableinfoPopup('Error', text);
            abortSetup();
          }

          console.log(text);
          setButtonMappingMessage((prev) => text);
        } catch (error) {
          console.error('Error polling server:', error);
        }
      };

      intervalIdRef.current = setInterval(pollServer, 500);

      // Clear the interval on component unmount
      return () => clearInterval(intervalIdRef.current);
    }, [applianceId, setButtonMappingMessage, isPolling]);
  };

  usePolling(applianceId, setButtonMappingMessage, isPolling);

  useEffect(() => {
    if (buttonMappingMessage === 'OK') {
      makeRequest(API_BASE_URL + `/appliance/setSendState/${applianceId}`, {
        method: 'POST',
      });

      setIsPolling(false);
      clearTimeout(timeoutTimer);
    }
  }, [buttonMappingMessage]);

  useEffect(() => {
    const fetchButtons = async () => {
      if (buttonWizardStep !== 1) return;

      const requestedButtons = await makeRequest(
        `${API_BASE_URL}/button/list/${applianceId}`,
        { method: 'GET' }
      );
      if (requestedButtons.ok) {
        const buttons = await requestedButtons.json();
        console.log(buttons);
        setMappedButtons((prev) => {
          const newButtons = [...prev];
          for (const b of buttons) {
            newButtons[b.remoteIndex].mapped = true;
            newButtons[b.remoteIndex].name = b.name;
          }
          return newButtons;
        });
      }
    };

    if (currentStep == 2) fetchButtons();
  }, [currentStep]); // [buttonWizardStep, applianceId]

  const handleDone = async () => {
    try {
      const savedButton = {
        name: selectedButton.name,
        remoteIndex: selectedButton.remoteIndex,
        mapped: true,
      };

      const newButtons = [...mappedButtons];
      newButtons[selectedButton.remoteIndex] = savedButton;
      setMappedButtons(newButtons);

      const response = await makeRequest(
        API_BASE_URL + `/button/save/${applianceId}`,
        { method: 'POST' }
      );
    } catch (error) {
      console.error('Error saving button:', error);
      EnableinfoPopup('Error', 'Error saving button');
      return;
    }

    cancelButtonMapping();
  };

  const handleButtonDelete = async () => {
    const response = await makeRequest(
      API_BASE_URL + `/button/${applianceId}/${selectedButton.remoteIndex}`,
      {
        method: 'DELETE',
      }
    );

    if (response.ok) {
      const newButtons = [...mappedButtons];
      newButtons[selectedButton.remoteIndex] = {
        name: `Button${selectedButton.remoteIndex}`,
        remoteIndex: selectedButton.remoteIndex,
        mapped: false,
      };
      setMappedButtons(newButtons);
      setSelectedButton(null);
      setButtonWizardStep(1);
    } else {
      const errorText = await response.text(); // Get error response text if needed
      console.error('Error details:', errorText);
      EnableinfoPopup('Error', errorText);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        {currentStep === 1 && (
          <div className={styles.step1}>
            <h2>Add Appliance</h2>

            <form action=''>
              <div>
                <label for='Appliance ID'>Appliance ID</label>
                <br />
                <input
                  type='text'
                  placeholder='e.g. ABCD'
                  value={applianceId}
                  onChange={(e) => setApplianceId(e.target.value)}
                />
              </div>

              <div>
                <label for='Nickname'>Nickname</label>
                <br />
                <input
                  type='text'
                  placeholder='e.g. Fan'
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
            </form>
            <div className={styles['buttonContainer']}>
              <button onClick={onClose}>Close</button>
              <button onClick={handleNextStep}>Next</button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles.step2}>
            <h2>Map Buttons</h2>
            <div className={styles.virtualRemote}>
              {mappedButtons.map((btn) => (
                <button
                  key={btn.remoteIndex}
                  className={`${styles.remoteButton} ${
                    mappedButtons[btn.remoteIndex].mapped ? styles.mapped : ''
                  }`}
                  onClick={() => handleButtonClick(btn)}
                >
                  {btn.name}
                </button>
              ))}
            </div>
            <p>Select a button to map</p>
            <button className={styles.finishButton} onClick={handleNextStep}>
              Finish
            </button>

            {selectedButton !== null && buttonWizardStep === 1 && (
              <div className={styles['button-overlay']}>
                <div className={styles['button-popup']}>
                  <h2>Button Name</h2>
                  <div className={styles.content}>
                    Confirm the button name.
                    <input
                      id='selectedBtnName'
                      type='text'
                      value={selectedButton.name}
                      onChange={(event) => {
                        //return;
                        // let newButtons = [...mappedButtons];
                        // newButtons[selectedButton.remoteIndex].name = event.target.value;
                        // setMappedButtons(newButtons);

                        setSelectedButton({
                          ...selectedButton,
                          name: event.target.value,
                        });
                      }}
                    />
                    Button name can be at most 7 characters long, with no
                    spaces.
                  </div>
                  <div className={styles['button-container']}>
                    <button
                      onClick={async () => {
                        setSelectedButton(null);
                        setButtonWizardStep(1);
                      }}
                    >
                      Cancel
                    </button>
                    {selectedButton.mapped && (
                      <button className={styles['deleteBtn']} onClick={handleButtonDelete}>
                        Delete
                      </button>
                    )}
                    <button onClick={handleNextButtonWizardStep}>Next</button>
                  </div>
                </div>
              </div>
            )}

            {selectedButton !== null && buttonWizardStep === 2 && (
              <div className={styles['button-overlay']}>
                <div className={styles['button-popup']}>
                  <h2>Map {selectedButton.name}</h2>
                  <div className={styles.content}>
                    {buttonMappingMessage === 'Wait' && (
                      <>
                        <span
                          style={{ fontSize: '10vh', marginBottom: '10px' }}
                          className='material-symbols-outlined'
                        >
                          settings_remote
                        </span>
                        Waiting for you to press the button on your remote.
                      </>
                    )}

                    {buttonMappingMessage === 'Try again' && (
                      <>
                        <span
                          style={{ fontSize: '10vh', marginBottom: '10px' }}
                          className='material-symbols-outlined'
                        >
                          settings_remote
                        </span>
                        Didn't quite get that. Please try again. Make sure the
                        remote is pointed at the appliance.
                      </>
                    )}

                    {buttonMappingMessage == 'OK' && (
                      <>
                        <span
                          style={{ fontSize: '10vh', marginBottom: '10px' }}
                          className='material-symbols-outlined'
                        >
                          check_circle
                        </span>
                        Button mapped successfully. Press Done to finish setup.
                      </>
                    )}
                  </div>
                  <div className={styles['button-container']}>
                    <button onClick={cancelButtonMapping}>Cancel</button>
                    <button
                      className={
                        buttonMappingMessage !== 'OK' ? styles.disable : null
                      }
                      onClick={handleRemapButton}
                    >
                      Remap
                    </button>
                    <button
                      onClick={handleDone}
                      className={
                        buttonMappingMessage !== 'OK' ? styles.disable : null
                      }
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className={styles.step}>
            <h2>Setup Complete</h2>
            <p>Your appliance setup is complete.</p>
            <button onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupWizard;
