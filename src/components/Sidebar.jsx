import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
import { 
  LuLayoutDashboard, 
  LuPackagePlus,   
  LuShoppingCart, 
  LuBan,          
  LuFolderOpen,   
  LuSettings      
} from 'react-icons/lu'; 

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h3>ECOMMERCE ADMIN</h3>
      <nav>
        <ul className="nav-list">
          <li>
            <NavLink to="/home" className="sidebar-link">
              <LuLayoutDashboard className="icon" /> <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/Products" className="sidebar-link">
              <LuPackagePlus className="icon" /> <span>Add Products</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/Categories" className="sidebar-link">
              <LuFolderOpen className="icon" /> <span>Categories</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/orders" className="sidebar-link">
              <LuShoppingCart className="icon" /> <span>Orders</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/BannerAds" className="sidebar-link">
              <LuBan className="icon" /> <span>Banned Ads</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings" className="sidebar-link">
              <LuSettings className="icon" /> <span>Settings</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;