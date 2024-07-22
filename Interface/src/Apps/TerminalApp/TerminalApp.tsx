import './TerminalApp.css';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { osversion } from '../../config';
import logo from './Terminal.svg';
import data from './history.json';
import WindowManager from '../../Api/Libs/VioletClientKernel/Core/Managers/Windows/WindowManager';
import VioletUiLoadingBar from "../../Api/Libs/VioletUiLib/Libs/uiElements/ProgressBars/LoadingBar/VioletUiLoadingBar";
import AsciiArt from '../../Api/Libs/VioletClientKernel/Components/AsciiArt';
import { NetworkUsage } from '../../Api/Libs/VioletClientKernel/Core/Scripts/NetworkUsage';

interface HistoryItem {
  command: string;
  timestamp: Date;
}

const TerminalApp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(data);
  const [inputValue, setInputValue] = useState('');
  const [updateProgress, setUpdateProgress] = useState(0);
  const [networkUsage, setNetworkUsage] = useState(0);
  const [networkHistory, setNetworkHistory] = useState<number[]>([]);
  const navigate = useNavigate();
  const userLogged = localStorage.getItem("user");
  const version = "2.011.16-Stable";
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem('terminalHistory', JSON.stringify(history));
    scrollToBottom();
  }, [history]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const usage = NetworkUsage();
      // Ensure usage is a number
      const usageNumber = parseFloat(usage);
      if (!isNaN(usageNumber)) {
        setNetworkUsage(usageNumber);
        setNetworkHistory(prev => [...prev, usageNumber].slice(-10));
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const handleClose = () => setIsOpen(false);
  const openTerminal = () => setIsOpen(true);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value);

  const handleSend = () => {
    if (inputValue.trim()) {
      const newHistory = [...history, { command: inputValue, timestamp: new Date() }];
      setHistory(newHistory);
      setInputValue('');
    }
  };

  const update = () => {
    localStorage.setItem("osversion", osversion);
    return `Update ${osversion} installed. `;
  };

  const handleClearHistory = () => setHistory([]);

  const remove = (command: string) => {
    const args = command.split(' ');
    switch(args[1]) {
      case 'user':
        localStorage.removeItem('fogotQuestion');
        localStorage.removeItem('user');
        localStorage.removeItem('password');
        setHistory([]);
        setIsOpen(false);
        if (!userLogged) navigate("/userDataNotFound");
        return "User data removed.";
      default: return { error: true, message: "cmdlet remove at command pipeline position 1 Supply values for the following parameters: InputObject[1]:"};
    }
  };

  const logout = () => navigate("/Login");

  const handleCommand = (command: string) => {
    const args = command.split(' ');
    switch (args[0]) {
      case 'version': return `Version of terminal - ${version}`;
      case 'help': return args.length > 1 ? handleHelpCommand(args[1]) : "Available commands: help [args...], clear, logout, remove [args...], send [args...], version, update, netstat";
      case 'clear':
        handleClearHistory();
        return 'History cleared';
      case 'remove': return remove(command);
      case 'logout':
        logout();
        return 'Logging out..';
      case 'send': 
        if (args.length === 1) {
          return { error: true, message:`cmdlet Write-Output at command pipeline position 1\nSupply values for the following parameters:\nargs[1]:`};
        }
        return args.slice(1).join(' ');
      case 'update': return update();
      case 'netstat': 
        return `Internet consumption: ${networkUsage} KB\nHistory: ${networkHistory.join(', ')}`;
      default: return { error: true, message: `The term "${command}" is not recognized as the name of a cmdlet, function, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again. At line:1 char:1` };
    }
  };

  const handleHelpCommand = (cmd: string) => {
    switch (cmd) {
      case 'send': return 'send [args..] - display text';
      case 'clear': return 'clear - clear console';
      case 'logout': return 'logout - logout from account';
      case 'remove': return 'remove [args..] - user';
      case 'version': return 'version - display current version of terminal';
      case 'update': return 'update - system update';
      case 'netstat': return 'netstat - display internet consumption';
      default: return { error: true, message: `Help not found for command: ${cmd}` };
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSend();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <div>
        <button onClick={openTerminal} className="App--Icon">
          <img src={logo} alt="Logo" />
        </button>
      </div>

      {isOpen && (
        <WindowManager title="Terminal" onClose={handleClose} description={version}>
          <div className="Terminal--Container">
            <div className='Terminal--Box'>
              <div className="Terminal--Messages" ref={messagesEndRef}>
                <AsciiArt />
                {history.map((message, index) => {
                  const result = handleCommand(message.command);
                  return (
                    <div key={index} className="Terminal--Message">
                      <span className='Terminal--Message--User'>{`${userLogged}: `}</span>
                      <span className='Terminal--Message--Callback'>{`${message.command}`}</span>
                      {typeof result === 'object' && 'error' in result ? (
                        <span className="Terminal--Message--Error">{result.message}</span>
                      ) : (
                        <span>{result}</span>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>      
              {updateProgress > 0 && updateProgress < 100 && (
                <VioletUiLoadingBar progress={updateProgress} />
              )}
              <div className="Terminal--Inputzone">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Press Enter to send"
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>
          </div>
        </WindowManager>
      )}
    </>
  );
};

export default TerminalApp; 