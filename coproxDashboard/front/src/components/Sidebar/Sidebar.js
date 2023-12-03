import React from 'react';
import { Link } from 'react-router-dom'; // You might need to install react-router-dom

function Sidebar() {
  return (
    <div className="sidebar">
      <h2>Menu</h2>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/trello">Trello Page</Link>
        </li>
        {/* Add more menu items as needed */}
      </ul>
    </div>
  );
}

export default Sidebar;
