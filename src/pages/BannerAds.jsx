import React, { useState, useRef, useEffect, useCallback } from 'react';
// Firebase SDK ইমপোর্ট করুন
import { initializeApp } from 'firebase/app';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore'; 

import firebaseConfig from '../components/FirebaseConfig'; 
import './BannerAds.css'; 

// Firebase ইনিশিয়ালাইজ করুন
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

// ব্যানার ইমেজ লোড করার জন্য কাস্টম হুক
const useBannerImages = () => {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    const q = collection(db, "bannerImages");
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const loadedBanners = [];
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        if (docData.urls && Array.isArray(docData.urls)) {
            docData.urls.forEach(url => {
                loadedBanners.push({
                    url: url,
                    docId: doc.id,
                });
            });
        }
      });
      setBanners(loadedBanners);
    }, (error) => {
        console.error("Error fetching banners: ", error);
    });

    return () => unsubscribe();
  }, []);

  return banners;
};

// --- প্রধান কম্পোনেন্ট ---
const ImageUploader = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const liveBanners = useBannerImages(); 
  const [currentSlide, setCurrentSlide] = useState(0); 

  // সোয়াইপ/ড্র্যাগ লজিকের জন্য স্টেট এবং রেফারেন্স
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const [prevTranslate, setPrevTranslate] = useState(0); // নতুন: ড্র্যাগ শুরু হওয়ার আগের ট্রান্সলেট
  const sliderContainerRef = useRef(null); // নতুন: কন্টেইনার উইডথ মাপার জন্য

  const getSliderWidth = useCallback(() => {
    // স্লাইডারের প্রস্থ এখন কন্টেইনারের প্রস্থের সমান
    return sliderContainerRef.current ? sliderContainerRef.current.clientWidth : 0;
  }, []);

  const setSlide = useCallback((index) => {
    const maxIndex = liveBanners.length > 0 ? liveBanners.length - 1 : 0;
    let newIndex = Math.max(0, Math.min(maxIndex, index));
    setCurrentSlide(newIndex);
    const targetTranslate = -newIndex * getSliderWidth();
    setCurrentTranslate(targetTranslate);
    setPrevTranslate(targetTranslate); // নতুন: টার্গেটে সেট করার পর সেট prevTranslate
  }, [liveBanners.length, getSliderWidth]);
  
  // মাউস/টাচ শুরু হলে
  const handleTouchStart = (event) => {
    if (isUploading || liveBanners.length < 2) return;
    setIsDragging(true);
    setStartX(event.clientX || event.touches[0].clientX);
    setPrevTranslate(currentTranslate); // ড্র্যাগ শুরু হওয়ার আগের পজিশন
    
    // ট্রানজিশন বন্ধ করা যাতে স্মুথ ড্র্যাগিং হয়
    const sliderTrack = sliderContainerRef.current.querySelector('.slider-track');
    if(sliderTrack) sliderTrack.style.transition = 'none';
  };

  // *** সংশোধিত: মাউস/টাচ মুভ করলে ***
  const handleTouchMove = (event) => {
    if (!isDragging) return;
    const currentX = event.clientX || event.touches[0].clientX;
    const diff = currentX - startX;
    
    // ড্র্যাগ করার সময় ডিসপ্লে আপডেট করা
    const newTranslate = prevTranslate + diff; // আগের অবস্থান থেকে ডিফারেন্স যোগ
    setCurrentTranslate(newTranslate);
  };

  // *** সংশোধিত: মাউস/টাচ শেষ হলে (একটি স্লাইড সোয়াইপ লজিক) ***
  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const sliderTrack = sliderContainerRef.current.querySelector('.slider-track');
    if(sliderTrack) sliderTrack.style.transition = 'transform 0.5s ease-in-out';
    
    const movedBy = currentTranslate - prevTranslate; // কতটা সরানো হয়েছে
    const threshold = getSliderWidth() * 0.25; // 25% দূরত্ব অতিক্রম করলে স্লাইড পরিবর্তন হবে

    if (movedBy < -threshold) {
      setSlide(currentSlide + 1); // বাম দিকে সোয়াইপ (পরের স্লাইড)
    } else if (movedBy > threshold) {
      setSlide(currentSlide - 1); // ডান দিকে সোয়াইপ (আগের স্লাইড)
    } else {
      // কম মুভ হলে বর্তমান স্লাইডে ফিরে যাবে
      setSlide(currentSlide);
    }
  };

  // নেভিগেশন ডট ক্লিক
  const handleDotClick = (index) => {
    setSlide(index);
  };

  // কম্পোনেন্ট মাউন্ট বা ব্যানার পরিবর্তন হলে প্রথম স্লাইডে সেট করা
  useEffect(() => {
    setSlide(currentSlide);
  }, [liveBanners.length, getSliderWidth, setSlide]);

  // ডিলিট ফাংশন (লাইভ ব্যানার) - অপরিবর্তিত
  const handleDeleteImage = async (banner) => {
    // ... ডিলিট লজিক (আগের মতোই থাকবে)
    const isConfirmed = window.confirm("আপনি কি নিশ্চিত এই ব্যানার ইমেজটি ডিলিট করতে চান? এই প্রক্রিয়াটি অপরিবর্তনীয়।");
    if (!isConfirmed) return;

    try {
        const fileNameMatch = banner.url.match(/banners%2F(.*?)\?alt=media/);
        const fileName = fileNameMatch ? decodeURIComponent(fileNameMatch[1]) : null;
        if (fileName) {
            const fileRef = storageRef(storage, `banners/${fileName}`);
            await deleteObject(fileRef);
        }

        const docRef = doc(db, "bannerImages", banner.docId);
        const docSnap = await getDoc(docRef);
        const docData = docSnap.data();
        
        if (docData.urls.length > 1) {
             const newUrls = docData.urls.filter(url => url !== banner.url);
             await updateDoc(docRef, { urls: newUrls });
        } else {
             await deleteDoc(docRef);
        }
        
        alert("Banner image successfully deleted.");
        
        // ডিলিটের পর স্লাইড ইন্ডেক্স অ্যাডজাস্ট করা
        const maxIndex = liveBanners.length - 1; 
        if (currentSlide >= maxIndex && maxIndex > 0) {
             setCurrentSlide(maxIndex - 1); 
        } else if (maxIndex === 0) {
             setCurrentSlide(0);
        }

    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Error deleting image. Check console for details.");
    }
  };

  // ফাইল হ্যান্ডলার, প্রিভিউ বাতিল এবং আপলোড লজিক - অপরিবর্তিত
  const handleFileChange = (event) => {
    const files = event.target.files;
    if (files.length === 0) return;
    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
    event.target.value = null; 
  };
  
  const handleCancelPreview = (indexToCancel) => {
      const newFiles = selectedFiles.filter((_, index) => index !== indexToCancel);
      const newPreviews = previews.filter((_, index) => index !== indexToCancel);
      URL.revokeObjectURL(previews[indexToCancel]);
      setSelectedFiles(newFiles);
      setPreviews(newPreviews);
  };

  const handleAddImageClick = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async () => {
    // ... আপলোড লজিক (আগের মতোই)
    if (selectedFiles.length === 0) {
      alert("অনুগ্রহ করে আপলোড করার জন্য অন্তত একটি ইমেজ নির্বাচন করুন।");
      return;
    }

    setIsUploading(true);
    const uploadedUrls = [];

    try {
      for (const file of selectedFiles) {
        const storageRefPath = storageRef(storage, `banners/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRefPath, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(downloadURL);
      }

      await addDoc(collection(db, "bannerImages"), {
        urls: uploadedUrls,
        uploadDate: new Date(),
      });

      alert(`সাফল্যের সাথে ${selectedFiles.length}টি ইমেজ আপলোড হয়েছে!`);
      
      setSelectedFiles([]);
      previews.forEach(url => URL.revokeObjectURL(url));
      setPreviews([]);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("ইমেজ আপলোড ব্যর্থ হয়েছে। কনসোল দেখুন।");
    } finally {
      setIsUploading(false);
    }
  };
  // --- আপলোড লজিক শেষ ---


  return (
    <div className="admin-dashboard-container">
      
      {/* ১. ব্যানার স্লাইডার সেকশন (সোয়াইপ কন্ট্রোল সহ) */}
      {liveBanners.length > 0 && (
        <div 
            className="banner-slider-container"
            ref={sliderContainerRef} // কন্টেইনার রেফারেন্স
            onMouseDown={handleTouchStart} 
            onMouseMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            onMouseLeave={isDragging ? handleTouchEnd : undefined}
            onTouchStart={handleTouchStart} 
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
          <h2 className="section-title">Live Banners</h2>
          <div 
            className="slider-track" 
            style={{ 
                // শুধুমাত্র 100% প্রস্থ থাকবে, কারণ প্রতিটি স্লাইড 100% প্রস্থ নেবে
                width: `${liveBanners.length * 100}%`, 
                // ট্রান্সলেট পিক্সেল হিসাবে আপডেট হবে
                transform: `translateX(${currentTranslate}px)`,
                cursor: isDragging ? 'grabbing' : 'grab' 
            }}
          >
            {liveBanners.map((banner, index) => (
              <div 
                key={index} 
                className="slide-item" 
                // প্রতিটি স্লাইড কন্টেইনারের 100% প্রস্থ নেবে 
                style={{ width: `${100 / liveBanners.length}%` }} 
              >
                <img src={banner.url} alt={`Banner ${index}`} className="banner-image-display" />
                
                {/* ডিলিট আইকন */}
                <button 
                  className="delete-icon-button live-delete-btn" 
                  onClick={() => handleDeleteImage(banner)}
                  title="Delete Banner Permanently"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              </div>
            ))}
          </div>
          
          {/* ডট নেভিগেশন (ম্যানুয়াল কন্ট্রোল) */}
          <div className="slider-dots">
            {liveBanners.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => handleDotClick(index)}
                title={`Go to slide ${index + 1}`}
              ></span>
            ))}
          </div>
        </div>
      )}
      <div className="image-uploader-container">
          <div className="header">Banner/Cover Upload</div>
          <div className="upload-box">
              <div className="icon-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9370DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="image-icon">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
              </div>
              <p className="upload-text">
                  Upload a banner image for the category. Recommended size is{' '}
                  <strong className="recommended-size">1300×380 pixels</strong>. Maximum file size is{' '}
                  <strong className="max-size">4MB</strong>.
              </p>

              <button 
                  className="add-image-button" 
                  onClick={handleAddImageClick} 
                  disabled={isUploading}
              >
                  {selectedFiles.length > 0 ? `Add More Images (${selectedFiles.length} Selected)` : "Add Image"}
              </button>
              <input type="file" accept="image/*" style={{ display: 'none' }} multiple onChange={handleFileChange} ref={fileInputRef} />
          </div>

          {previews.length > 0 && (
              <div className="previews-section">
                  <h3>Selected Images ({previews.length})</h3>
                  <div className="image-previews-grid">
                      {previews.map((src, index) => (
                          <div key={index} className="image-preview-item">
                              <img src={src} alt={`Preview ${index + 1}`} className="preview-image" />
                              
                              <button 
                                className="cancel-preview-button"
                                onClick={() => handleCancelPreview(index)}
                                title="Cancel this selection"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                          </div>
                      ))}
                  </div>
                  
                  <button className="upload-all-button fancy-upload-btn" onClick={handleUpload} disabled={isUploading}>
                      {isUploading ? 
                        (<>
                            <svg className="spinner" viewBox="0 0 50 50"><circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle></svg>
                            Uploading...
                        </>)
                        : 
                        `Upload ${selectedFiles.length} Images`
                      }
                  </button>
              </div>
          )}
      </div>
    </div>
  );
};

export default ImageUploader;
