// src/pages/Home.jsx
import './Home.css';
import React, { useState, useEffect } from 'react';

// Firebase SDK ইমপোর্ট:
import { initializeApp } from 'firebase/app'; 
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'; 

// Firebase কনফিগারেশন ইমপোর্ট: আপনার ফোল্ডার স্ট্রাকচার অনুযায়ী
// FirebaseConfig.js থেকে সরাসরি কনফিগারেশন অবজেক্ট ইমপোর্ট করা হয়েছে।
import firebaseConfig from '../components/FirebaseConfig'; 

// --- Firebase Initialization ---
// অ্যাপ ইনিশিয়ালাইজ করুন
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Firestore ইনস্ট্যান্স তৈরি

// ডামি ডেটা (KPI এর জন্য)
const dashboardMetrics = [
  { title: "Total Revenue", value: "৳ 5,000", icon: "💰", color: "#4CAF50" },
  { title: "Total Orders", value: "15", icon: "📦", color: "#2196F3" },
  { title: "New Customers", value: "05", icon: "👥", color: "#FF9800" },
  { title: "Out of Stock", value: "02", icon: "⚠️", color: "#F44336" },
];

// 🌟🌟🌟 আপডেট করা ডেট ফরম্যাট ফাংশন (কমা সহ) 🌟🌟🌟
const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    // Firestore Timestamp কে JavaScript Date অবজেক্টে রূপান্তর
    const date = timestamp.toDate(); 
    
    // ফরম্যাট: Oct 4, 2025 (Month Abbreviation, Day, Year)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short', // 'Oct'
        day: 'numeric',  // '4'
    });
};


const Home = () => {
  
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // শুধুমাত্র "Pending" স্ট্যাটাসের নতুন অর্ডারগুলি লোড করার ফাংশন
    const fetchPendingOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        // 'db' ইনস্ট্যান্সটি ব্যবহার করে Firestore থেকে ডেটা আনা
        const ordersRef = collection(db, "orders");
        
        // Query: status: "Pending" অর্ডারগুলি, নতুন থেকে পুরানো, প্রথম ৫টি
        const q = query(
          ordersRef, 
          where("status", "==", "Pending"), 
          orderBy("createdAt", "desc"), // আপনার ডেটা স্ট্রাকচার অনুযায়ী "createdAt" ফিল্ড
          limit(5)
        );
        
        const querySnapshot = await getDocs(q);
        
        const fetchedOrders = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            // Field Mapping: orderNumber -> Order ID
            orderID: data.orderNumber || doc.id.substring(0, 8).toUpperCase(), 
            // Order Date যুক্ত করা হয়েছে
            orderDate: data.createdAt, 
            // Total Payable
            amount: data.totalPayable || 0,
            status: data.status,
          };
        });

        setPendingOrders(fetchedOrders);
      } catch (err) {
        console.error("Error fetching orders: ", err);
        setError("Failed to load orders. Please ensure your Composite Index for 'status' and 'createdAt' is ready.");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingOrders();
  }, []);

  // --- Loading and Error States ---
  if (loading) {
    return <div className="dashboard-container"><p>Loading Dashboard Data...</p></div>;
  }
  
  if (error) {
    return <div className="dashboard-container"><p className="error-message">Error: {error}</p></div>;
  }

  // --- JSX RENDER ---
  return (
    <div className="dashboard-container">
      <h1 className="dashboard-header">Welcome, Admin! 👋</h1>
      <p className="dashboard-subheader">A quick overview of your E-commerce store.</p>

      {/* --- KPI Metrics Section (Using Dummy Data for now) --- */}
      <div className="metrics-grid">
        {dashboardMetrics.map((metric, index) => (
          <div 
            key={index} 
            className="metric-card" 
            style={{ borderLeft: `5px solid ${metric.color}` }}
          >
            <div className="metric-icon" style={{ backgroundColor: metric.color + '1a', color: metric.color }}>
                {metric.icon}
            </div>
            <div className="metric-details">
                <span className="metric-title">{metric.title}</span>
                <span className="metric-value">{metric.value}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* --- Quick Actions & Recent Activity --- */}
      <div className="dashboard-content-grid">
        
        {/* Recent Orders Table - Fetches real pending data */}
        <div className="activity-panel recent-orders-panel">
          <h2 className="panel-title">New Pending Orders</h2>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th> 
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrders.length > 0 ? (
                pendingOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.orderID}</td>
                    {/* 🌟🌟🌟 এখানে কমা সহ ডেট দেখানো হচ্ছে 🌟🌟🌟 */}
                    <td>{formatDate(order.orderDate)}</td> 
                    <td>৳ {order.amount.toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`status-badge ${order.status.toLowerCase()}`}>
                          {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#6c757d', padding: '15px' }}>No new pending orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
          <button className="view-all-btn">View All Orders</button>
        </div>
      </div>
    </div>
  );
};

export default Home;
