import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Products from './pages/Products';
import Categories from './pages/Categories';
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
    flexGrow: 1, // বাকি সমস্ত উপলব্ধ স্থান দখল করবে
    width: '100%', // এটিও বাকি স্ক্রিন জুড়েই থাকবে
    paddingLeft: '50px',
    paddingRight: '50px',
    paddingTop: '20px', 
    paddingBottom: '20px',
    backgroundColor: '#f8f9fa',
    overflowY: 'auto',
  },
};

function App() {
  return (
    <BrowserRouter>
      <div style={styles.mainLayout}>
        <Sidebar />
        <main style={styles.contentArea}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/Products" element={<Products />} />
            <Route path="/Categories" element={<Categories />} />
            <Route path="/BannerAds" element={<BannerAds />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
