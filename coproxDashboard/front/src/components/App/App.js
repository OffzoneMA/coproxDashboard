import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import TrelloPage from '../TrelloPage/TrelloPage';

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <Route path="/" exact component={() => <h1>Home Page</h1>} />
        <Route path="/trello" component={TrelloPage} />
        {/* Add more routes as needed */}
      </div>
    </Router>
  );
}

export default App;
