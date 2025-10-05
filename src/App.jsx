// App.jsx
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Order from './pages/Order';
import ViewDetails from './pages/ViewDetails'; // ViewDetails কম্পোনেন্ট
import BannerAds from './pages/BannerAds';

const styles = {
  mainLayout: {
    display: 'flex',
    width: '100vw',
    minHeight: '100vh', 
    margin: 0,
    padding: 0,
  },
  contentArea: {
    flexGrow: 1,
    width: '100%',
    paddingLeft: '50px',
    paddingRight: '50px',
    paddingLeft: '10px',
    paddingRight: '10px',
    paddingTop: '20px', 
    paddingBottom: '20px',
    backgroundColor: '#f8f9fa',
    overflowY: 'auto',
  },
};

function App() {
  return (
    <HashRouter>
      <div style={styles.mainLayout}>
        <Sidebar />
        <main style={styles.contentArea}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/Products" element={<Products />} />
            <Route path="/Categories" element={<Categories />} />
            <Route path="/BannerAds" element={<BannerAds />} />
            
            {/* 1. সমস্ত অর্ডার দেখানোর রুট */}
            <Route path="/orders" element={<Order />} />
            <Route path="/orders/:orderId" element={<ViewDetails />} /> 
            
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;
