// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import Sidebar from './components/Sidebar';
import TrelloPage from './containers/TrelloPage';
import Copro from './containers/Copro';
import AddFiches from './containers/AddFiches';
import ListeFiches from './containers/ListeFiches.js';
import Clients from './containers/clients';
import DetailCopro from './containers/DetailCopro';
import HomePage from './containers/HomePage';
import './assets/styles/App.css';

const Footer = () => <h1>footer</h1>;

function App() {
  const [currentTitle, setCurrentTitle] = useState('');

  const setTitle = (title) => {
    setCurrentTitle(title || "Default Title");
  };

  return (
    <Router>
      <div className="trello-page">
        <Sidebar />
        <div className="main-container">
          <div className="main-titlezone">
            <h1>{currentTitle}</h1>
          </div>
          <Routes>
            <Route path="/" element={<HomePage onSetTitle={setTitle}/>} />
            <Route path="/trello" element={<TrelloPage onSetTitle={setTitle} />} />
            <Route path="/copro" element={<Copro onSetTitle={setTitle} />} />
            <Route path="/addfiches" element={<AddFiches onSetTitle={setTitle} />} />
            <Route path="/listefiches" element={<ListeFiches onSetTitle={setTitle} />} />
            <Route path="/clients" element={<Clients onSetTitle={setTitle} />} />
            <Route path="/detailcopro/:id" element={<DetailCopro onSetTitle={setTitle} />} />


            {/* Add more routes as needed */}
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
