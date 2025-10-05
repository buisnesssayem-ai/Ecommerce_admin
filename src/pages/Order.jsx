// src/pages/Order.jsx
import './Order.css';
import React, { useState, useEffect, useMemo } from 'react';
import { FiEye, FiSearch } from 'react-icons/fi'; 
import { useNavigate } from 'react-router-dom'; // নেভিগেট করার জন্য

// Firebase SDK ইমপোর্ট:
import { 
    initializeApp 
} from 'firebase/app'; 
import { 
    getFirestore, 
    collection, 
    query, 
    orderBy,
    onSnapshot // Realtime Update-এর জন্য
} from 'firebase/firestore'; 

// Firebase কনফিগারেশন ইমপোর্ট:
import firebaseConfig from '../components/FirebaseConfig'; 

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); 

// --- ডেট ফরম্যাট ফাংশন (Oct 4, 2025 কমা সহ) ---
const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate(); 
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
    });
};

// --- ট্যাবের জন্য স্ট্যাটাস তালিকা ---
const STATUS_TABS = [
    { key: 'all', label: 'All Orders' },
    { key: 'Pending', label: 'Pending' },
    { key: 'Shipped', label: 'Shipped' },
    { key: 'Out for Delivery', label: 'Out for Delivery' },
    { key: 'Delivered', label: 'Delivered' },
];

const OrderListPage = () => {
    const [allOrders, setAllOrders] = useState([]); 
    const [currentTab, setCurrentTab] = useState('all'); 
    const [searchTerm, setSearchTerm] = useState(''); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // নেভিগেট করার জন্য useNavigate ইনিশিয়ালাইজ করা হলো
    const navigate = useNavigate(); 

    // -------------------------------------------------------------
    // 🌟 Realtime Update: onSnapshot ব্যবহার করে ডেটা লোড করা 🌟
    // -------------------------------------------------------------
    useEffect(() => {
        const ordersRef = collection(db, "orders");
        
        // Query: সমস্ত অর্ডার লোড, নতুন থেকে পুরানো অনুযায়ী সাজানো
        const q = query(
            ordersRef, 
            orderBy("createdAt", "desc") 
        );
        
        // onSnapshot লিসেনার সেট করা হলো (রিয়েলটাইম আপডেট)
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            
            const fetchedOrders = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    orderID: data.orderNumber || doc.id.substring(0, 8).toUpperCase(), 
                    orderDate: data.createdAt, 
                    amount: data.totalPayable || 0,
                    status: data.status,
                };
            });
            
            setAllOrders(fetchedOrders);
            setLoading(false); 
            setError(null);

        }, (error) => {
            // ত্রুটি হ্যান্ডলিং
            console.error("Error setting up realtime listener: ", error);
            setError("Failed to load orders realtime. Check console for details.");
            setLoading(false);
        });
        
        // Cleanup ফাংশন: কম্পোনেন্টটি আনমাউন্ট হওয়ার সময় লিসেনার বন্ধ করা
        return () => unsubscribe(); 

    }, []); 

    // -------------------------------------------------------------
    // 🌟 ট্যাব এবং সার্চ ফিল্টার লজিক 🌟
    // -------------------------------------------------------------
    const filteredOrders = useMemo(() => {
        let list = allOrders;

        // ট্যাব ফিল্টারিং
        if (currentTab !== 'all') {
            list = list.filter(order => order.status === currentTab);
        }

        // সার্চ ফিল্টারিং (Order ID/Number দ্বারা)
        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            list = list.filter(order => 
                order.orderID.toLowerCase().includes(lowerCaseSearch)
            );
        }

        return list;
    }, [allOrders, currentTab, searchTerm]);
    
    // --- Action Handlers: View Details ---
    const handleViewDetails = (orderId) => {
        // নতুন পেজে নেভিগেট করা হলো
        navigate(`/orders/${orderId}`);
    };
    

    // --- Loading and Error States ---
    if (loading) {
        return <div className="order-page-container"><p>Loading All Orders...</p></div>;
    }
    
    if (error) {
        return <div className="order-page-container"><p className="error-message">Error: {error}</p></div>;
    }

    // --- JSX RENDER ---
    return (
        <div className="order-page-container">
            <h1 className="order-page-header">All Orders ({allOrders.length})</h1>
            <p className="order-page-subheader">Use the tabs and search bar to filter orders.</p>

            {/* --- সার্চ বক্স ও ট্যাব সিস্টেম --- */}
            <div className="order-controls-bar">
                
                {/* সার্চ বক্স */}
                <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by Order ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {/* ট্যাব সিস্টেম */}
                <div className="tab-system">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            className={`tab-button ${currentTab === tab.key ? 'active' : ''}`}
                            onClick={() => setCurrentTab(tab.key)}
                        >
                            {tab.label} ({allOrders.filter(o => tab.key === 'all' || o.status === tab.key).length})
                        </button>
                    ))}
                </div>
            </div>


            <div className="order-table-wrapper">
                {filteredOrders.length > 0 ? (
                    <table className="order-list-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Amount (৳)</th>
                                <th>Status</th>
                                <th className="th-action">Details</th> 
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order.id}>
                                    <td>{order.orderID}</td>
                                    <td>{formatDate(order.orderDate)}</td>
                                    <td>৳ {order.amount.toLocaleString('en-IN')}</td>
                                    <td>
                                        {/* Status-এর মধ্যে স্পেস থাকলে CSS ক্লাসের জন্য তা হাইফেন দিয়ে প্রতিস্থাপন করা হলো */}
                                        <span className={`status-badge ${order.status.toLowerCase().replace(/ /g, '-')}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="order-actions">
                                            <button 
                                                className="action-icon-btn view-btn" 
                                                onClick={() => handleViewDetails(order.id)}
                                                title="View Details"
                                            >
                                                <FiEye className="button-icon-margin"/> View Details 
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="no-data-message">
                        No {currentTab !== 'all' ? currentTab : ''} orders found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderListPage;
