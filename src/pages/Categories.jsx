import React, { useState, useEffect } from 'react';
import { FiTrash2, FiPlus } from 'react-icons/fi'; 

// 🌟🌟🌟 Firebase এবং Firestore সংযোগ 🌟🌟🌟
import { initializeApp } from 'firebase/app';
import { 
    getFirestore, collection, addDoc, getDocs, 
    query, deleteDoc, doc, where, // 'where' ফিল্টারিং এর জন্য ইমপোর্ট করা হলো
    count // ⚠️ Count ফাংশন ব্যবহার করতে চাইলে, Firebase v9.4+ এবং সঠিক SDK ইমপোর্ট নিশ্চিত করুন।
} from 'firebase/firestore'; 

import firebaseConfig from '../components/FirebaseConfig'; 

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

console.log("🔥 Firebase App Successfully Initialized and Database Connected!");
// 🌟🌟🌟 Firebase সংযোগ শেষ 🌟🌟🌟

import './Categories.css';

const CategoryListPage = () => {
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isLoading, setIsLoading] = useState(true); 
    const [isCounting, setIsCounting] = useState(false); // আইটেম গণনা লোডিং স্টেট
    
    const isAddButtonDisabled = newCategoryName.trim() === '';

    // -------------------------------------------------------------
    // 🌟🌟🌟 ফাংশন ১: প্রতিটি ক্যাটেগরির জন্য প্রোডাক্ট সংখ্যা গণনা 🌟🌟🌟
    // -------------------------------------------------------------
    const fetchCategoryItemCounts = async (loadedCategories) => {
        setIsCounting(true);
        const productsRef = collection(db, "products");
        const categoriesWithCounts = await Promise.all(
            loadedCategories.map(async (category) => {
                try {
                    // সেই ক্যাটেগরি ID দিয়ে 'products' কালেকশনে কোয়েরি চালানো
                    const q = query(productsRef, where("categoryId", "==", category.id));
                    
                    // 💡 NOTE: আদর্শভাবে, 'count()' এগ্রিগেশন ফাংশন ব্যবহার করা উচিত।
                    // কিন্তু যদি আপনার SDK/ভার্সন সাপোর্ট না করে, তবে getDocs ব্যবহার করে ম্যানুয়ালি গণনা করা যায়:
                    const querySnapshot = await getDocs(q);
                    const itemCount = querySnapshot.size; // এখানে গণনা করা হচ্ছে

                    return { ...category, totalItems: itemCount };

                } catch (error) {
                    console.error(`Error counting items for category ${category.name}: `, error);
                    return { ...category, totalItems: 0 }; // ব্যর্থ হলে 0 দেখাবে
                }
            })
        );
        setCategories(categoriesWithCounts);
        setIsCounting(false);
    };

    // -------------------------------------------------------------
    // 🌟🌟🌟 ফাংশন ২: ক্যাটেগরি লোড এবং কাউন্টিং কল করা 🌟🌟🌟
    // -------------------------------------------------------------
    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoading(true);
            try {
                const q = query(collection(db, "categories"));
                const querySnapshot = await getDocs(q);
                
                const loadedCategories = [];
                querySnapshot.forEach((doc) => {
                    loadedCategories.push({
                        id: doc.id,
                        ...doc.data(),
                        totalItems: 0, // প্রথমে 0 বা undefined দিয়ে শুরু করা যেতে পারে
                    });
                });
                
                // ক্যাটেগরিগুলো সেভ করা এবং কাউন্টিং শুরু করা
                setCategories(loadedCategories); 
                if (loadedCategories.length > 0) {
                    await fetchCategoryItemCounts(loadedCategories); // 👈 কাউন্টিং শুরু
                }

            } catch (error) {
                console.error("Error fetching categories: ", error);
                alert("ক্যাটেগরি লোড করতে সমস্যা হয়েছে।");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, []); 


    // -------------------------------------------------------------
    // 🌟🌟🌟 নতুন ক্যাটেগরি যোগ করার ফাংশন 🌟🌟🌟
    // -------------------------------------------------------------
    const handleAddCategory = async () => {
        const categoryName = newCategoryName.trim();

        if (categoryName !== '') {
            try {
                const newCategoryData = {
                    name: categoryName,
                    totalItems: 0, // নতুন ক্যাটেগরিতে আইটেম সংখ্যা ০ দিয়ে শুরু
                    createdAt: new Date(), 
                };

                const docRef = await addDoc(collection(db, "categories"), newCategoryData);
                
                // লোকাল স্টেট আপডেট, যাতে নতুন ক্যাটেগরি সঙ্গে সঙ্গে দেখায়
                const newCategoryWithId = { ...newCategoryData, id: docRef.id };
                setCategories([newCategoryWithId, ...categories]);
                
                setNewCategoryName('');

            } catch (error) {
                console.error("Error adding document: ", error);
                alert("ক্যাটেগরি যুক্ত করতে সমস্যা হয়েছে।");
            }
        }
    };
    
    // -------------------------------------------------------------
    // 🌟🌟🌟 ক্যাটেগরি ডিলিট করার ফাংশন 🌟🌟🌟
    // -------------------------------------------------------------
    const handleDelete = async (categoryId, categoryName) => {
        if (window.confirm(`Are you sure you want to delete the category: "${categoryName}"?`)) {
             // ⚠️ এখানে ডিলিট করার আগে সেই ক্যাটেগরির সব প্রোডাক্টের 'categoryId' আপডেট/ডিলিট করা উচিত।
            try {
                await deleteDoc(doc(db, "categories", categoryId));
                
                const updatedCategories = categories.filter(cat => cat.id !== categoryId);
                setCategories(updatedCategories);
                
                alert(`Category "${categoryName}" successfully deleted.`);

            } catch (error) {
                console.error("Error removing document: ", error);
                alert("ক্যাটেগরি ডিলিট করতে সমস্যা হয়েছে।");
            }
        }
    };
    

    return (
        <div className="category-list-page">
            
            <header className="page-header">
                <h2 className="page-title">Categories</h2>
                
                <div className="header-actions">
                    <div className="category-input-group">
                        <input
                            type="text"
                            placeholder="Enter new category name..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !isAddButtonDisabled) {
                                    handleAddCategory();
                                }
                            }}
                        />
                        
                        <button 
                            className="add-category-button-page"
                            onClick={handleAddCategory}
                            disabled={isAddButtonDisabled} 
                        >
                            <FiPlus className="plus-icon-react" />
                            Add Category
                        </button>
                    </div>
                </div>
            </header>

            <div className="category-table-container">
                
                {/* লোডিং এবং কাউন্টিং স্টেট */}
                {(isLoading || isCounting) && (
                    <div className="loading-message">
                        {isLoading ? 'Loading Categories...' : 'Counting items...'}
                    </div>
                )}
                
                {/* ডেটা এবং টেবিল */}
                {!isLoading && (
                    <table className="category-table">
                        
                        <thead>
                            <tr>
                                <th className="th-category">Category Name</th>
                                <th className="th-item-count">Total Item</th> 
                                <th className="th-action">Action</th>
                            </tr>
                        </thead>
                        
                        <tbody>
                            {categories.map((cat) => (
                                <tr key={cat.id}>
                                    <td>
                                        <div className="category-details">
                                            <div className="category-name">{cat.name}</div>
                                        </div>
                                    </td>
                                    
                                    {/* 🌟🌟🌟 টোটাল আইটেম সংখ্যা দেখানো হচ্ছে 🌟🌟🌟 */}
                                    <td>
                                        {/* isCounting চলাকালীন লোডার বা হাইফেন দেখানো যেতে পারে */}
                                        {isCounting ? '-' : (cat.totalItems || 0)} 
                                    </td>
                                    
                                    <td>
                                        <div className="action-buttons-table">
                                            <button 
                                                className="action-button-table delete-button"
                                                onClick={() => handleDelete(cat.id, cat.name)}
                                                title="Delete Category"
                                                // যদি আইটেম থাকে, তবে ডিলিট বাটন ডিজেবল করা যেতে পারে (ঐচ্ছিক)
                                                // disabled={cat.totalItems > 0} 
                                            >
                                                <FiTrash2 /> 
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* যদি কোনো ক্যাটেগরি না থাকে */}
                {!isLoading && categories.length === 0 && (
                    <div className="no-data-message">
                        No categories found. Start by adding a new category above.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryListPage;
