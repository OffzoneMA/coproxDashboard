// AppRouter.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import App from './components/App';
import TrelloPage from './containers/TrelloPage';
import Ag from './containers/Ag';
import Sidebar from './components/Sidebar';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/trello" element={<TrelloPage />} />
        <Route path="/ag" element={<Ag />} />
        <Route path="/sidebar" element={<Sidebar />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
