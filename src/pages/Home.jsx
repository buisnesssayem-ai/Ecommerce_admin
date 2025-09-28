// src/pages/Home.jsx
import './Home.css';
import React from 'react';

const Home = () => {
  return (
    <div>
      <h1>স্বাগতম, অ্যাডমিন! 👋</h1>
      <p>এটি আপনার ই-কমার্স অ্যাডমিন প্যানেলের হোম (ড্যাশবোর্ড) পেজ।</p>
      <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #ccc', backgroundColor: '#000' }}>
        <h2>আজকের সংক্ষিপ্ত বিবরণ</h2>
        <p>মোট অর্ডার: 15টি</p>
        <p>মোট বিক্রি: ৫,০০০ টাকা</p>
      </div>
    </div>
  );
};

export default Home;
