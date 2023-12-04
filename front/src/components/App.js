// App.js
import React from 'react';
import '../assets/styles/App.css';
import { Route, Routes } from 'react-router-dom';
import Sidebar from './Sidebar';
import TrelloPage from '../containers/TrelloPage';
import Ag from '../containers/Ag';
import CssBaseline from '@mui/material/CssBaseline';

const HomePage = () => <h1>Home Page</h1>;

function App() {
  return (
    <div className="app">
      <CssBaseline />
      <Sidebar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/trello" element={<TrelloPage />} />
        <Route path="/Ag" element={<Ag />} />
        {/* Add more routes as needed */}
      </Routes>
    </div>
  );
}

export default App;


