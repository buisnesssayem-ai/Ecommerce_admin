import React, { useState, useEffect } from 'react';
import { 
    FaAngleDown, FaBold, FaItalic, FaUnderline, FaQuoteRight, 
    FaFont, FaAlignLeft, FaAlignCenter, FaLink, FaSuperscript, 
    FaListUl, FaListOl, FaAngleUp, FaImage, FaTimes
} from 'react-icons/fa'; 

// 🌟🌟🌟 Firebase সংযোগ 🌟🌟🌟
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 
import { getFirestore, collection, getDocs, query, addDoc } from 'firebase/firestore'; 
import firebaseConfig from '../components/FirebaseConfig'; 

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app); 
// 🌟🌟🌟 Firebase সংযোগ শেষ 🌟🌟🌟

import './Product.css'; 

// ফর্মের প্রাথমিক অবস্থা (রিসেট করার জন্য)
const INITIAL_PRODUCT_DATA = {
    // ⭐️ ডেলিভারি ফিল্ড ⭐️
    deliveryCharge: 0, 
    deliveryType: 'CALCULATED',
    
    itemName: '', shortDescription: '', productDescription: '', sellPrice: '', regularPrice: '', buyingPrice: '',
    productSerial: 0, skuCode: '', unitName: '', quantityStock: 0, warranty: '', initialSoldCount: 0,
    brandName: '', condition: 'New', productStatus: 'ACTIVE', categoryId: '', 
    imageUrls: [], 
};

// টোস্ট কম্পোনেন্ট
const Toast = ({ message, type }) => {
    return (
        <div className={`toast-message toast-${type}`}>
            {message}
        </div>
    );
};


const AddProductPage = () => {
    // ------------------------------------
    // 1. স্টেট ম্যানেজমেন্ট (অপরিবর্তিত)
    // ------------------------------------
    const [productData, setProductData] = useState(INITIAL_PRODUCT_DATA);
    const [categories, setCategories] = useState([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isCategorySectionOpen, setIsCategorySectionOpen] = useState(true); 
    
    const [imageFiles, setImageFiles] = useState([]); 
    const [isUploading, setIsUploading] = useState(false); 

    const [toast, setToast] = useState({ visible: false, message: '', type: '' });


    // ------------------------------------
    // 2. useEffect এবং হ্যান্ডলার ফাংশন (অপরিবর্তিত)
    // ------------------------------------
    
    // ক্যাটেগরি লোড করার লজিক
    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoadingCategories(true);
            try {
                const q = query(collection(db, "categories"));
                const querySnapshot = await getDocs(q);
                
                const loadedCategories = [];
                querySnapshot.forEach((doc) => {
                    loadedCategories.push({ id: doc.id, name: doc.data().name });
                });
                
                setCategories(loadedCategories);
                
                if (loadedCategories.length > 0) {
                    setProductData(prevData => ({
                        ...prevData,
                        categoryId: loadedCategories[0].id
                    }));
                }
            } catch (error) {
                console.error("Error fetching categories: ", error);
            } finally {
                setIsLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []); 

    // টোস্ট দেখানোর ফাংশন
    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => {
            setToast({ visible: false, message: '', type: '' });
        }, 3000); 
    };
    
    // ফর্ম রিসেট ফাংশন
    const resetForm = () => {
        const defaultCategoryId = categories.length > 0 ? categories[0].id : '';
        
        setProductData({
            ...INITIAL_PRODUCT_DATA,
            categoryId: defaultCategoryId,
        });
        setImageFiles([]); // ইমেজ অ্যারে রিসেট
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        const numericFields = ['sellPrice', 'regularPrice', 'buyingPrice', 'productSerial', 'quantityStock', 'initialSoldCount', 'deliveryCharge'];
        const newValue = numericFields.includes(id) ? Number(value) : value;

        setProductData(prevData => ({
            ...prevData,
            [id]: newValue, 
            categoryId: id === 'categorySelect' ? value : prevData.categoryId,
            deliveryType: id === 'deliveryType' ? value : prevData.deliveryType,
        }));
    };
    
    const toggleCategorySection = () => {
        setIsCategorySectionOpen(!isCategorySectionOpen);
    };


    // ইমেজ আপলোড হ্যান্ডলার এবং ফাংশন (অপরিবর্তিত)
    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        
        if (files.length > 0) {
            const newImageFiles = files.map(file => ({
                file: file,
                preview: URL.createObjectURL(file),
                id: Date.now() + Math.random(), 
            }));
            
            setImageFiles(prevFiles => [...prevFiles, ...newImageFiles]);
        }
        e.target.value = null; 
    };

    const handleRemoveImage = (idToRemove) => {
        setImageFiles(prevFiles => prevFiles.filter(file => file.id !== idToRemove));
    };

    const uploadImages = async (files) => {
        if (files.length === 0) return [];
        
        try {
            setIsUploading(true);
            const uploadPromises = files.map(async (imageObj) => {
                const file = imageObj.file;
                const storageRef = ref(storage, `product_images/${Date.now()}_${file.name}`);
                
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);
                return downloadURL;
            });

            const imageUrls = await Promise.all(uploadPromises);
            setIsUploading(false);
            return imageUrls; 
        } catch (error) {
            console.error("Error uploading images to Firebase Storage:", error);
            setIsUploading(false);
            showToast("এক বা একাধিক ইমেজ আপলোড ব্যর্থ হয়েছে।", 'error'); 
            return null;
        }
    };

    // প্রোডাক্ট সেভ ফাংশন (অপরিবর্তিত)
    const handleSaveProduct = async () => {
        if (!productData.itemName || !productData.categoryId || productData.sellPrice <= 0) {
            showToast("অনুগ্রহ করে আইটেমের নাম, ক্যাটেগরি এবং বর্তমান দাম পূরণ করুন।", 'error'); 
            return;
        }
        
        // 1. ইমেজ অ্যারে আপলোড করা
        let finalImageUrls = productData.imageUrls;
        
        if (imageFiles.length > 0) {
            const uploadedUrls = await uploadImages(imageFiles);
            if (!uploadedUrls) return;
            finalImageUrls = uploadedUrls;
        }

        try {
            // 2. ডেটা অবজেক্ট তৈরি করা
            const finalProductData = {
                ...productData,
                // ডেলিভারি ডেটা যুক্ত এবং কন্ডিশনাল সেট করা
                deliveryCharge: productData.deliveryType === 'FIXED_CHARGE' ? Number(productData.deliveryCharge) || 0 : 0,
                deliveryType: productData.deliveryType,
                
                imageUrls: finalImageUrls, 
                sellPrice: Number(productData.sellPrice),
                regularPrice: Number(productData.regularPrice) || 0,
                buyingPrice: Number(productData.buyingPrice) || 0,
                quantityStock: Number(productData.quantityStock) || 0,
                productSerial: Number(productData.productSerial) || 0,
                initialSoldCount: Number(productData.initialSoldCount) || 0,
                createdAt: new Date(), 
            };

            await addDoc(collection(db, "products"), finalProductData);
            
            showToast(`Product '${productData.itemName}' successfully saved!`, 'success');
            resetForm(); 

        } catch (error) {
            console.error("Error adding product: ", error);
            showToast("প্রোডাক্ট সেভ করতে সমস্যা হয়েছে।", 'error'); 
        }
    };
    
    // ------------------------------------
    // 5. রেন্ডারিং অংশ (পরিবর্তিত)
    // ------------------------------------
    
  return (
    <div className="add-product-main-content">
        
        {/* টোস্ট মেসেজ কম্পোনেন্ট */}
        {toast.visible && <Toast message={toast.message} type={toast.type} />}

      <div className="action-buttons-container">
        <h3>Add Product</h3> 
        
        <div className="button-group">
            <button className="action-button discard-button" onClick={resetForm}>
                <span className="button-icon">&times;</span>
                Discard
            </button>

            <button 
                className="action-button save-button"
                onClick={handleSaveProduct}
                disabled={isUploading} 
            >
                <span className="button-icon">&#x2713;</span>
                {isUploading ? 'Uploading...' : 'Save'}
            </button>
        </div>
      </div>

      <div className="mainContent">
        
        {/* 1. Categories Section */}
        <section className="sidebar-section category-selection-section">
            <div className="section-header" onClick={toggleCategorySection}> 
                <h3 className="section-title">Category <span className="required">*</span></h3>
                <span className="toggle-icon">
                    {isCategorySectionOpen ? <FaAngleUp /> : <FaAngleDown />}
                </span>
            </div>
            
            {isCategorySectionOpen && (
                <div className="sidebar-content">
                    {isLoadingCategories ? ( <p>Loading categories...</p> ) : categories.length === 0 ? (
                        <p>No categories found. Please add categories first in the Categories page.</p>
                    ) : (
                        <select className="sidebar-select category-select" id="categorySelect" value={productData.categoryId} onChange={handleInputChange}>
                            <option value="" disabled>Select a Category</option>
                            {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                        </select>
                    )}
                </div>
            )}
        </section>
        
        {/* 2. General Information Section */}
        <section className="product-form-section"> 
            <div className="section-header"> <h3 className="section-title">General Information</h3> <span className="toggle-icon"><FaAngleDown /></span> </div>
            <div className="section-content">
                <div className="form-group"><label htmlFor="itemName">Item Name <span className="required">*</span></label><input type="text" id="itemName" placeholder="Item Name" value={productData.itemName} onChange={handleInputChange}/> </div>
                <div className="form-group"><label htmlFor="shortDescription">Short Description (SEO & Data Feed)</label><textarea id="shortDescription" rows="3" placeholder="Short Description" value={productData.shortDescription} onChange={handleInputChange}></textarea></div>
                <div className="form-group product-description-group"><label htmlFor="productDescription">Product Description</label><div className="rich-text-editor-container"><div className="editor-toolbar">{/* Toolbar Icons... */}</div><div className="editor-content"><textarea id="productDescription" rows="4" placeholder="Write something..." value={productData.productDescription} onChange={handleInputChange}></textarea></div></div></div>
            </div>
        </section>
        
        {/* 3. Media Section */}
        <section className="media-form-section">
            <div className="section-header"> <h3 className="section-title">Media ({imageFiles.length} Images)</h3> <span className="toggle-icon"><FaAngleUp /></span> </div>
            <div className="section-content">
                 
                {/* মাল্টিপল ইমেজ প্রিভিউ এরিয়া */}
                <div className="image-previews-grid">
                    {imageFiles.map((fileObj) => (
                        <div key={fileObj.id} className="image-preview-container">
                            <img src={fileObj.preview} alt="Product Preview" className="product-image-preview"/>
                            {/* ডিলিট বাটন */}
                            <button 
                                className="remove-image-button" 
                                onClick={() => handleRemoveImage(fileObj.id)}
                            >
                                <FaTimes />
                            </button>
                        </div>
                    ))}
                </div>
                
                <div className="upload-box image-upload-box">
                    <input 
                        type="file" 
                        id="imageUpload" 
                        accept="image/jpeg, image/png" 
                        onChange={handleImageSelect}
                        multiple 
                        style={{ display: 'none' }} 
                        disabled={isUploading}
                    />
                    
                    <div className="upload-icon"><FaImage /></div>
                    
                    {isUploading ? ( <p className="upload-text">Uploading... Please wait.</p> ) : (
                        <p className="upload-text">Drag and drop images here, or click add images. Max 4MB each.</p>
                    )}
                    
                    <button className="add-button" onClick={() => document.getElementById('imageUpload').click()} disabled={isUploading}>
                        Add More Images
                    </button>
                </div>
            </div>
        </section>
        
        {/* 4. Pricing Section (ডেলিভারি অপশন ছাড়া) */}
        <section className="pricing-form-section product-form-section">
            <div className="section-header"><h3 className="section-title">Pricing</h3><span className="toggle-icon"><FaAngleUp /></span></div>
            <div className="section-content">
                <div className="form-group"><label htmlFor="sellPrice">Sell/Current Price <span className="required">*</span></label><input type="number" id="sellPrice" placeholder="Sell/Current Price" className="price-input" min="0" value={productData.sellPrice} onChange={handleInputChange}/></div>
                <div className="form-group"><label htmlFor="regularPrice">Regular/Old Price</label><input type="number" id="regularPrice" placeholder="Regular/Old Price" className="price-input" min="0" value={productData.regularPrice} onChange={handleInputChange}/></div>
                <div className="form-group"><label htmlFor="buyingPrice">Buying Price (Optional)</label><input type="number" id="buyingPrice" placeholder="Buying Price (Optional)" className="price-input" min="0" value={productData.buyingPrice} onChange={handleInputChange}/></div>
            </div>
        </section>
        
              {/* 🌟🌟🌟 5. Delivery Settings Section (আলাদা করা হয়েছে) 🌟🌟🌟 */}
        <section className="delivery-settings-section product-form-section">
            <div className="section-header"><h3 className="section-title">Delivery Settings</h3><span className="toggle-icon"><FaAngleUp /></span></div>
            <div className="section-content">
                <div className="form-group">
                    <label htmlFor="deliveryType">Delivery Type</label>
                    <select 
                        id="deliveryType" 
                        className="price-input" // 👈 price-input ক্লাসটি ব্যবহার করা হয়েছে
                        value={productData.deliveryType} 
                        onChange={handleInputChange}
                    >
                        <option value="CALCULATED">Standard Calculated (Default)</option>
                        <option value="FIXED_CHARGE">Fixed Charge for this Item</option>
                        <option value="FREE_DELIVERY">Free Delivery</option>
                    </select>
                </div>
                
                {productData.deliveryType === 'FIXED_CHARGE' && (
                    <div className="form-group">
                        <label htmlFor="deliveryCharge">Delivery Charge for this Item (৳)</label>
                        <input 
                            type="number" 
                            id="deliveryCharge" 
                            placeholder="Specific Delivery Charge" 
                            className="price-input" // 👈 price-input ক্লাসটি ব্যবহার করা হয়েছে
                            min="0"
                            value={productData.deliveryCharge} 
                            onChange={handleInputChange}
                        />
                    </div>
                )}
            </div>
        </section>


        
        {/* 6. Inventory Section */}
        <section className="inventory-form-section product-form-section">
            <div className="section-header"><h3 className="section-title">Inventory</h3><span className="toggle-icon"><FaAngleUp /></span> </div>
            <div className="section-content">
                <div className="form-group"><label htmlFor="productSerial">Product Serial</label><input type="number" id="productSerial" placeholder="0" className="inventory-input" min="0" value={productData.productSerial} onChange={handleInputChange}/></div>
                <div className="form-group"><label htmlFor="skuCode">SKU / Product Code</label><input type="text" id="skuCode" placeholder="SKU / Product Code" className="inventory-input" value={productData.skuCode} onChange={handleInputChange}/></div>
                <div className="form-group"><label htmlFor="unitName">Unit Name</label><input type="text" id="unitName" placeholder="e.g., kg, ml, l, mg" className="inventory-input" value={productData.unitName} onChange={handleInputChange}/></div>
                <div className="form-group"><label htmlFor="quantityStock">Quantity (Stock)</label><input type="number" id="quantityStock" placeholder="Quantity (Stock)" className="inventory-input" min="0" value={productData.quantityStock} onChange={handleInputChange}/></div>
                <div className="form-group"><label htmlFor="warranty">Warranty</label><input type="text" id="warranty" placeholder="Warranty" className="inventory-input" value={productData.warranty} onChange={handleInputChange}/></div>
                <div className="form-group"><label htmlFor="initialSoldCount">Initial Sold Count</label><input type="number" id="initialSoldCount" placeholder="0" className="inventory-input" min="0" value={productData.initialSoldCount} onChange={handleInputChange}/></div>
            </div>
        </section>
        
        {/* 7. Brand, 8. Condition, 9. Status Sections */}
        <section className="sidebar-section brand-section">
              <div className="section-header"><h3 className="section-title">Brand (SEO & Data Feed)</h3><span className="toggle-icon"><FaAngleUp /></span></div>
              <div className="sidebar-content"><input type="text" placeholder="Brand Name" className="sidebar-input brand-input" id="brandName" value={productData.brandName} onChange={handleInputChange}/></div>
        </section>

        <section className="sidebar-section condition-section">
            <div className="section-header"><h3 className="section-title">Condition (SEO & Data Feed)</h3><span className="toggle-icon"><FaAngleUp /></span></div>
            <div className="sidebar-content">
                <select className="sidebar-select condition-select" id="condition" value={productData.condition} onChange={handleInputChange}>
                    <option value="New">New</option><option value="Used">Used</option><option value="Refurbished">Refurbished</option>
                </select>
            </div>
        </section>
        
        <section className="sidebar-section status-section">
            <div className="section-header"><h3 className="section-title">Product Status</h3><span className="toggle-icon"><FaAngleDown /></span></div>
            <div className="sidebar-content">
                <select className="sidebar-select status-select" id="productStatus" value={productData.productStatus} onChange={handleInputChange}>
                    <option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option><option value="DRAFT">DRAFT</option>
                </select>
            </div>
        </section>
      </div>
    </div>
  );
};

export default AddProductPage;
