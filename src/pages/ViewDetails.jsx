// src/pages/ViewDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiCheckCircle, FiTag, FiCalendar,
  FiMapPin, FiUser, FiTruck
} from 'react-icons/fi';
import './ViewDetails.css';

// Firebase SDK
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import firebaseConfig from '../components/FirebaseConfig';

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Date Format Function ---
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate();
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const ViewDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch Order Details
  useEffect(() => {
    if (!orderId) {
      setError("No Order ID provided.");
      setLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, "orders", orderId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const addressInfo = data.addressDetails || data.shippingAddress || {};
          setOrder({
            id: docSnap.id,
            ...data,
            addressDetails: addressInfo
          });
        } else {
          setError(`No order found with ID: ${orderId}`);
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError("Failed to load order details. Please check connectivity.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  // Update Status
  const handleStatusUpdate = async (newStatus) => {
    if (!order || newStatus === order.status) return;

    setIsUpdating(true);
    try {
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, { status: newStatus });
      setOrder(prevOrder => ({ ...prevOrder, status: newStatus }));
      alert(`Order ID ${order.orderNumber || order.id.substring(0, 8)} status updated to ${newStatus}.`);
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status.");
    } finally {
      setIsUpdating(false);
    }
  };

  // --- States ---
  if (loading) return <div className="page-wrapper"><p>Loading Order Details...</p></div>;
  if (error) return <div className="page-wrapper"><p className="error-message">{error}</p></div>;
  if (!order) return <div className="page-wrapper"><p className="error-message">Order not found.</p></div>;

  // --- Data ---
  const {
    orderNumber,
    createdAt,
    status,
    totalPayable,
    items,
    addressDetails = {},
    paymentMethod,
    deliveryFee,
    userId
  } = order;

  const itemsTotalAmount = items
    ? items.reduce((sum, item) => sum + ((item.sellPrice || 0) * (item.quantity || 0)), 0)
    : 0;

  const finalTotal = itemsTotalAmount + (deliveryFee || 0);
  const payableAmount = totalPayable || finalTotal;

  // --- Render ---
  return (
    <div className="page-wrapper">
      <button className="back-button" onClick={() => navigate('/orders')}>
        <FiArrowLeft /> Back to All Orders
      </button>

      <div className="main-content-card">

        {/* Header */}
        <div className="confirmation-header">
          <FiCheckCircle className="check-icon" />
          <h1>Order Details (Admin View)</h1>
          <p>Review and manage the complete details of order: <b>{orderNumber || order.id.substring(0, 8).toUpperCase()}</b></p>
        </div>

        {/* Status */}
        <div className="status-and-action-bar">
          <div className="status-display">
            <FiTag className="icon" />
            Current Status:
            <span className={`status-badge ${status.toLowerCase().replace(/ /g, '-')}`}>{status}</span>
          </div>
          <div className="status-updater">
            <label htmlFor="status-select">Update Status:</label>
            <select
              id="status-select"
              value={status}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              disabled={isUpdating}
            >
              <option value="Pending">Pending</option>
              <option value="Shipped">Shipped</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
            {isUpdating && <span className="updating-text">Updating...</span>}
          </div>
        </div>

        {/* Order Summary */}
        <div className="info-block summary-block">
          <h2 className="block-header"><FiCalendar /> Order Summary</h2>
          <div className="detail-line">
            <span>Order Number:</span>
            <span className="value-bold">{orderNumber || 'N/A'}</span>
          </div>
          <div className="detail-line">
            <span>Order Date:</span>
            <span>{formatDate(createdAt)}</span>
          </div>
          <div className="detail-line total-amount-line">
            <span>Total Payable:</span>
            <span className="value-bold amount-value">৳ {payableAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="detail-line">
            <span>Payment Method:</span>
            <span>{paymentMethod || 'N/A'}</span>
          </div>
          <div className="detail-line">
            <span>Customer User ID:</span>
            <span>{userId || 'N/A'}</span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="info-block customer-contact-block">
          <h2 className="block-header"><FiUser /> Customer & Contact</h2>
          <div className="detail-line"><span>Name:</span><span className="value-bold">{addressDetails.fullName || 'N/A'}</span></div>
          <div className="detail-line"><span>Phone Number:</span><span>{addressDetails.phoneNumber || addressDetails.phone || 'N/A'}</span></div>
          <div className="detail-line"><span>Email:</span><span>{addressDetails.email || 'N/A'}</span></div>
          <div className="detail-line"><span>Address Label:</span><span>{addressDetails.label || 'N/A'}</span></div>
        </div>

        {/* Product Items */}
        <div className="info-block item-details-block">
          <h2 className="block-header"><FiTruck /> Item Details ({items ? items.length : 0})</h2>
          <div className="product-list-container">
            {items && items.map((item, index) => (
              <div className="product-item-row" key={index}>
                <div className="product-image-box">
                  <img
                    src={item.image || 'https://via.placeholder.com/60?text=No+Image'}
                    alt={item.itemName}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/60?text=No+Image'; }}
                  />
                </div>
                <div className="product-info">
                  <p className="product-name-text">{item.itemName || 'Product Name N/A'}</p>
                  <p className="product-sku-line">SKU: {item.skuCode || item.productId || 'N/A'}</p>
                  <p className="product-qty-price">Qty: {item.quantity} | ৳ {item.sellPrice ? item.sellPrice.toLocaleString('en-IN') : '0'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping */}
        <div className="info-block shipping-block">
          <h2 className="block-header"><FiMapPin /> Shipping To</h2>
          <div className="shipping-address-box">
            <div className="detail-line"><span>Street/Address Line 1:</span><span>{addressDetails.streetAddress || addressDetails.addressLine1 || 'N/A'}</span></div>
            <div className="detail-line"><span>Area/Region:</span><span>{addressDetails.area || addressDetails.region || 'N/A'}</span></div>
            <div className="detail-line"><span>City/District:</span><span>{addressDetails.city || addressDetails.district || 'N/A'}</span></div>
            <div className="detail-line"><span>Zip Code:</span><span>{addressDetails.zipCode || 'N/A'}</span></div>
            <div className="detail-line"><span>Delivery Hub:</span><span>{addressDetails.deliveryHub || 'N/A'}</span></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ViewDetailsPage;