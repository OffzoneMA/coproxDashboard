// AppRouter.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './components/App/App';
import TrelloPage from './components/TrelloPage/TrelloPage';
import Sidebar from './components/Sidebar/Sidebar';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="trello" element={<TrelloPage />} />
        <Route path="sidebar" element={<Sidebar />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
