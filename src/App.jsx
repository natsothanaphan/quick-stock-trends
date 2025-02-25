import React, { useState } from 'react';
import Auth from './components/Auth';
import PercentageLineChart from './components/PercentageLineChart';
import './App.css';
import api from './api.js';
import { addVisualsToBothCharts } from './chart/chartUtils.js';
import { alertAndLogErr } from './utils.js';

const App = () => {
  const [user, setUser] = useState(null);

  const [symbolsInput, setSymbolsInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [closeChartData, setCloseChartData] = useState(null);
  const [volumeChartData, setVolumeChartData] = useState(null);

  const handleSignIn = (user) => setUser(user);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbolsInput || !startDate) {
      alertAndLogErr('Please enter both symbols and a start date.');
      return;
    }

    setLoading(true);
    setCloseChartData(null);
    setVolumeChartData(null);
    try {
      const idToken = await user.getIdToken();
      const result = await api.fetchHistoricalData(idToken, symbolsInput, startDate);
      const { closeChartData, volumeChartData } = addVisualsToBothCharts(result.closeChartData, result.volumeChartData);
      setCloseChartData(closeChartData);
      setVolumeChartData(volumeChartData);
    } catch (err) {
      alertAndLogErr(err);
    }
    setLoading(false);
  };

  const handleRerollColors = () => {
    if (!(closeChartData && volumeChartData)) return;
    const { closeChartData: updatedClose, volumeChartData: updatedVolume } =
      addVisualsToBothCharts(closeChartData, volumeChartData);
    setCloseChartData(updatedClose);
    setVolumeChartData(updatedVolume);
  };

  if (!user) {
    return <div className='App'><Auth onSignIn={handleSignIn} /></div>;
  }

  return (
    <div className='App'>
      <form className='submit-form' onSubmit={handleSubmit}>
        <div>
          <label htmlFor='.form-symbols'>Symbols</label>
          <input id='.form-symbols' type='text' value={symbolsInput}
            onChange={(e) => setSymbolsInput(e.target.value)} placeholder='nasdaq:aapl,nasdaq:meta' required />
        </div>
        <div>
          <label htmlFor='.form-start-date'>Start Date</label>
          <input id='.form-start-date' type='date' value={startDate}
            onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <button type='submit' title='Submit' disabled={loading}>{loading ? 'Loading...' : '🚀'}</button>
      </form>
      {(closeChartData || volumeChartData) && <>
        <div className='charts'>
          {closeChartData && <PercentageLineChart chartData={closeChartData} title='Closing Price' />}
          {volumeChartData && <PercentageLineChart chartData={volumeChartData} title='Volume' />}
        </div>
        <button className='reroll-button' onClick={handleRerollColors} disabled={loading}>Reroll Colors</button>
      </>}
    </div>
  );
};

export default App;
