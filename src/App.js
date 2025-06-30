import React, { useState, useEffect, useRef } from 'react';

// --- FIREBASE SDK IMPORTS ---
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    doc,
    addDoc, 
    getDocs, 
    setDoc,
    getDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    updateDoc,
    runTransaction
} from 'firebase/firestore';
import {
    getStorage,
    ref,
    uploadBytesResumable,
    getDownloadURL
} from 'firebase/storage';


// --- PASTE YOUR FIREBASE CONFIGURATION HERE ---
const firebaseConfig = {
  apiKey: "AIzaSyBMX_4TgliafTMsEp_nCXNmJbz2bNULbLg",
  authDomain: "clip-connect-57dbd.firebaseapp.com",
  projectId: "clip-connect-57dbd",
  storageBucket: "clip-connect-57dbd.firebasestorage.app",
  messagingSenderId: "107978636841",
  appId: "1:107978636841:web:fa6b1af0972ee912afa638",
  measurementId: "G-YCX42HBB0S"};



// --- INITIALIZE FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


// --- UI HELPER COMPONENTS ---
const Tag = ({ children }) => ( <span className="bg-gray-700 text-indigo-300 text-xs font-semibold mr-2 mb-2 inline-block px-2.5 py-1 rounded-full">{children}</span> );
const Toast = ({ message, show, isSuccess }) => ( <div className={`fixed bottom-10 right-10 text-white py-3 px-6 rounded-lg shadow-xl transform transition-all duration-300 ${show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`}>{message}</div> );
const Spinner = ({ text }) => ( <div className="text-center py-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div><p className="mt-4">{text}</p></div> );

// --- HEADER COMPONENT ---
const Header = ({ user, onLogout, onNavigate, notifications, onToggleNotifications, showNotifications, userData }) => {
    const unreadCount = notifications.filter(n => !n.read).length;
    const notificationRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                if(showNotifications) onToggleNotifications(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [notificationRef, showNotifications, onToggleNotifications]);

    return (
        <nav className="bg-gray-900/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-700">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div onClick={() => onNavigate('dashboard')} className="text-2xl font-bold text-white flex items-center cursor-pointer">
                    <i className="fa-solid fa-film mr-3 text-indigo-400"></i>
                    <span>Clip-Connect</span>
                </div>
                {user && (
                    <div className="flex items-center space-x-6">
                        <div className="text-sm font-semibold text-white">Balance: <span className="text-green-400">${userData?.balance?.toFixed(2) || '0.00'}</span></div>
                         {userData?.userType === 'editor' && <button onClick={() => onNavigate('conversations')} className="text-sm font-semibold text-gray-300 hover:text-white">Messages</button>}
                         {userData?.userType === 'editor' && <button onClick={() => onNavigate('payouts')} className="text-sm font-semibold text-gray-300 hover:text-white">Payouts</button>}
                        <button onClick={() => onNavigate('billing')} className="text-sm font-semibold text-gray-300 hover:text-white">Account</button>
                        <div className="relative" ref={notificationRef}>
                            <button onClick={() => onToggleNotifications(true)} className="relative">
                                <i className="fa-regular fa-bell text-xl text-gray-400 hover:text-white"></i>
                                {unreadCount > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-900">{unreadCount}</span>}
                            </button>
                            {showNotifications && <NotificationsPanel notifications={notifications} onNavigate={onNavigate} />}
                        </div>
                        <img onClick={() => onNavigate('profile')} src={user.photoURL || `https://placehold.co/40x40/7c3aed/ffffff?text=${user.email[0].toUpperCase()}`} className="w-10 h-10 rounded-full border-2 border-indigo-500 cursor-pointer" alt="User Avatar" />
                        <button onClick={onLogout} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm py-2 px-3 rounded-lg">Logout</button>
                    </div>
                )}
            </div>
        </nav>
    );
};

// --- NOTIFICATIONS PANEL ---
const NotificationsPanel = ({ notifications, onNavigate }) => { const handleMarkAsRead = async (id) => { const notifRef = doc(db, "notifications", id); await updateDoc(notifRef, { read: true }); }; const handleNotificationClick = (notification) => { if (notification.applicantId) { onNavigate('viewProfile', notification.applicantId); } else if (notification.projectId) { onNavigate('projectMessages', notification.projectId); } }; return ( <div className="absolute top-full right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 overflow-hidden"> <div className="p-4 font-bold border-b border-gray-700">Notifications</div> <div className="max-h-96 overflow-y-auto"> {notifications.length > 0 ? notifications.map(n => ( <div key={n.id} className={`p-4 border-b border-gray-700 ${n.read ? 'opacity-60' : ''}`}> <p onClick={() => handleNotificationClick(n)} className="text-sm cursor-pointer"> <strong className="font-bold text-indigo-400 hover:underline">{n.applicantUsername || 'System'}</strong> {` ${n.message}`} </p> <div className="text-xs text-gray-400 mt-1 flex justify-between items-center"> <span>{n.createdAt ? new Date(n.createdAt.toDate()).toLocaleString() : 'Just now'}</span> {!n.read && <button onClick={() => handleMarkAsRead(n.id)} className="text-indigo-400 hover:underline">Mark as read</button>} </div> </div> )) : <p className="p-4 text-sm text-gray-400">No new notifications.</p>} </div> </div> ); }

// --- APPLICANT MODAL ---
const ApplicantModal = ({ show, onClose, applicants, onNavigate, onHire, project }) => { if (!show) return null; return( <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}> <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-2xl" onClick={e => e.stopPropagation()}> <div className="flex justify-between items-center mb-6"> <h2 className="text-2xl font-bold">Applicants for "{project.title}"</h2> <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button> </div> <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4"> {applicants.length === 0 ? <p>No applications yet.</p> : applicants.map(app => ( <div key={app.id} className="p-4 bg-gray-700 rounded-lg"> <div className="flex justify-between items-center"> <h3 onClick={() => onNavigate('viewProfile', app.editorId)} className="font-bold text-lg text-indigo-300 hover:underline cursor-pointer">{app.username || app.editorEmail}</h3> <button onClick={() => onHire(project.id, app)} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-500">Hire</button> </div> <p className="text-sm text-gray-300 my-2">{app.bio || "No bio provided."}</p></div> ))} </div> </div> </div> ); };

// --- AUTH & PROFILE PAGES ---
const AuthPage = ({ showToast }) => { const [isLogin, setIsLogin] = useState(true); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [username, setUsername] = useState(''); const [userType, setUserType] = useState('videographer'); const [error, setError] = useState(''); const handleAuthAction = async (e) => { e.preventDefault(); setError(''); try { if (isLogin) { await signInWithEmailAndPassword(auth, email, password); showToast("Logged in successfully!"); } else { const userCredential = await createUserWithEmailAndPassword(auth, email, password); await setDoc(doc(db, "users", userCredential.user.uid), { email: userCredential.user.email, username: username, userType: userType, createdAt: serverTimestamp(), portfolioLink: "", bio: "", portfolioVideoUrl: "", balance: 0 }); showToast("Account created successfully!"); } } catch (err) { setError(err.message); } }; return ( <div className="min-h-screen flex items-center justify-center bg-gray-900 -mt-20"> <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md"> <h2 className="text-3xl font-bold text-white text-center mb-6">{isLogin ? 'Login' : 'Create Account'}</h2> <form onSubmit={handleAuthAction} className="space-y-4"> {!isLogin && <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg px-4 py-3" required />} <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg px-4 py-3" required /> <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg px-4 py-3" required /> {!isLogin && ( <select value={userType} onChange={(e) => setUserType(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg px-4 py-3"> <option value="videographer">I'm a Videographer</option> <option value="editor">I'm an Editor</option> </select> )} <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-500">{isLogin ? 'Login' : 'Sign Up'}</button> {error && <p className="text-red-500 text-sm text-center">{error}</p>} </form> <p className="text-center text-gray-400 text-sm mt-6"> {isLogin ? "Don't have an account?" : "Already have an account?"} <button onClick={() => setIsLogin(!isLogin)} className="text-indigo-400 font-semibold ml-1 hover:underline"> {isLogin ? 'Sign Up' : 'Login'} </button> </p> </div> </div> ); };
const ProfilePage = ({ user, showToast }) => { const [profile, setProfile] = useState({ portfolioLink: '', bio: '', portfolioVideoUrl: '', username: '' }); const [isLoading, setIsLoading] = useState(true); const [uploadProgress, setUploadProgress] = useState(0); useEffect(() => { const fetchProfile = async () => { if (!user) return; const docRef = doc(db, "users", user.uid); const docSnap = await getDoc(docRef); if (docSnap.exists()) { setProfile(docSnap.data()); } setIsLoading(false); }; fetchProfile(); }, [user]); const handleSave = async () => { await setDoc(doc(db, "users", user.uid), profile, { merge: true }); showToast("Profile saved!"); }; const handleFileUpload = (e) => { const file = e.target.files[0]; if (!file) return; const storageRef = ref(storage, `portfolios/${user.uid}/${file.name}`); const uploadTask = uploadBytesResumable(storageRef, file); uploadTask.on('state_changed', (snapshot) => { setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100); }, (error) => { console.error("Upload error:", error); showToast("Upload failed!", false); }, () => { getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => { setProfile({...profile, portfolioVideoUrl: downloadURL}); showToast("Upload complete!"); setUploadProgress(0); }); } ); }; if (isLoading) return <Spinner text="Loading Profile..." />; return ( <div className="max-w-4xl mx-auto"> <h1 className="text-3xl font-bold mb-6">My Profile</h1> <div className="bg-gray-800 p-8 rounded-xl space-y-6"> <div> <label className="block text-sm font-medium text-gray-300 mb-1">Username</label> <input type="text" value={profile.username || ''} onChange={(e) => setProfile({...profile, username: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3" /> </div> <div> <label className="block text-sm font-medium text-gray-300 mb-1">Bio / About Me</label> <textarea value={profile.bio || ''} onChange={(e) => setProfile({...profile, bio: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3" rows="4"></textarea> </div> <div> <label className="block text-sm font-medium text-gray-300 mb-1">Upload Portfolio Video (MP4)</label> <input type="file" onChange={handleFileUpload} accept="video/mp4" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"/> {uploadProgress > 0 && <div className="w-full bg-gray-600 rounded-full h-2.5 mt-2"><div className="bg-green-500 h-2.5 rounded-full" style={{width: `${uploadProgress}%`}}></div></div>} {profile.portfolioVideoUrl && <video src={profile.portfolioVideoUrl} controls className="w-full rounded-lg mt-4 max-h-80"></video>}</div> <div> <label className="block text-sm font-medium text-gray-300 mb-1">Or, Link YouTube Portfolio</label> <input type="text" value={profile.portfolioLink || ''} onChange={(e) => setProfile({...profile, portfolioLink: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3" placeholder="https://youtube.com/..."/></div> <button onClick={handleSave} className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg">Save Profile</button> </div> </div> ) };
const PublicProfilePage = ({ userId }) => { const [profile, setProfile] = useState(null); const [isLoading, setIsLoading] = useState(true); const getYouTubeEmbedUrl = (url) => { try { const videoId = new URL(url).searchParams.get('v'); return videoId ? `https://www.youtube.com/embed/${videoId}` : null; } catch (e) { return null; } }; useEffect(() => { const fetchProfile = async () => { if (!userId) { setIsLoading(false); return; } const docRef = doc(db, "users", userId); const docSnap = await getDoc(docRef); if (docSnap.exists()) { setProfile(docSnap.data()); } setIsLoading(false); }; fetchProfile(); }, [userId]); if (isLoading) return <Spinner text="Loading Profile..." />; if (!profile) return <p className="text-center text-gray-400">Could not find user profile.</p>; return ( <div className="max-w-4xl mx-auto"> <h1 className="text-3xl font-bold mb-6">{profile.username}'s Profile</h1> <div className="bg-gray-800 p-8 rounded-xl space-y-6"> <p>{profile.bio || "This user hasn't written a bio yet."}</p> {profile.portfolioVideoUrl && <div className="mt-4"><h4 className="font-semibold mb-2">Uploaded Work</h4><video src={profile.portfolioVideoUrl} controls className="w-full rounded-lg"></video></div>} {profile.portfolioLink && getYouTubeEmbedUrl(profile.portfolioLink) && ( <div className="mt-4"> <h4 className="font-semibold mb-2">YouTube Portfolio</h4> <div className="aspect-video bg-black rounded-lg overflow-hidden"> <iframe width="100%" height="100%" src={getYouTubeEmbedUrl(profile.portfolioLink)} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe> </div> </div> )} </div> </div> ); };

// --- OTHER PAGES ---
const ProjectModal = ({ show, onClose, onAddProject, user }) => { const [title, setTitle] = useState(''); const [budget, setBudget] = useState(500); const [skills, setSkills] = useState(''); const [dueDate, setDueDate] = useState(''); if (!show) return null; const handleSubmit = async (e) => { e.preventDefault(); const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s); await onAddProject({ title, budget: parseInt(budget), skills: skillsArray, dueDate, ownerId: user.uid, clientName: user.email }); setTitle(''); setBudget(500); setSkills(''); setDueDate(''); }; return ( <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}> <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-2xl" onClick={e => e.stopPropagation()}> <div className="flex justify-between items-center mb-6"> <h2 className="text-2xl font-bold">Create New Project</h2> <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button> </div> <form onSubmit={handleSubmit} className="space-y-4"> <div> <label className="block mb-2 text-sm font-medium text-gray-300">Project Title</label> <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., 'Wedding Highlight Reel'" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2" required /> </div> <div className="grid grid-cols-2 gap-4"> <div><label className="block mb-2 text-sm font-medium text-gray-300">Budget ($)</label> <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="500" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2" required /></div> <div><label className="block mb-2 text-sm font-medium text-gray-300">Due Date</label> <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2" required /></div> </div> <div> <label className="block mb-2 text-sm font-medium text-gray-300">Required Skills (comma-separated)</label> <input type="text" value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g., Color Grading, Motion Graphics" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2" required /> </div> <div className="pt-4 flex justify-end"> <button type="button" onClick={onClose} className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg mr-2">Cancel</button> <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg">Post Project</button> </div> </form> </div> </div> ); };
const BillingPage = ({ onSelectPlan, user, showToast }) => { const handleDeposit = async () => { const amount = 100; const userRef = doc(db, "users", user.uid); await runTransaction(db, async (transaction) => { const userDoc = await transaction.get(userRef); if (!userDoc.exists()) { throw "Document does not exist!"; } const newBalance = (userDoc.data().balance || 0) + amount; transaction.update(userRef, { balance: newBalance }); }); showToast(`$${amount} deposited successfully!`); }; return ( <div className="max-w-4xl mx-auto"> <h1 className="text-3xl font-bold mb-6 text-center">Account & Billing</h1><div className="bg-gray-800 p-8 rounded-xl mb-8 flex justify-between items-center"><h2 className="text-xl">Your Balance</h2><button onClick={handleDeposit} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-500">Deposit $100</button></div> <div className="grid grid-cols-1 md:grid-cols-3 gap-8"> <div className="bg-gray-800 p-8 rounded-xl border-2 border-gray-700 flex flex-col"> <h2 className="text-2xl font-bold text-indigo-400">Basic</h2> <p className="text-4xl font-bold my-4">$0 <span className="text-lg font-normal text-gray-400">/ month</span></p> <ul className="space-y-2 text-gray-300 flex-grow"> <li><i className="fa-solid fa-check text-green-500 mr-2"></i>Browse all projects</li> <li><i className="fa-solid fa-check text-green-500 mr-2"></i>Apply to 5 projects per month</li> </ul> <button className="w-full mt-6 bg-gray-600 text-white font-bold py-3 rounded-lg cursor-not-allowed">Current Plan</button> </div> <div className="bg-gray-800 p-8 rounded-xl border-2 border-indigo-500 flex flex-col"> <h2 className="text-2xl font-bold text-indigo-400">Pro Monthly</h2> <p className="text-4xl font-bold my-4">$15 <span className="text-lg font-normal text-gray-400">/ month</span></p> <ul className="space-y-2 text-gray-300 flex-grow"> <li><i className="fa-solid fa-check text-green-500 mr-2"></i>Unlimited applications</li> <li><i className="fa-solid fa-check text-green-500 mr-2"></i>Featured profile listing</li> </ul> <button onClick={() => onSelectPlan({name: 'Pro Monthly', price: 15})} className="w-full mt-6 bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-500">Upgrade to Monthly</button> </div> <div className="bg-gray-800 p-8 rounded-xl border-2 border-gray-700 flex flex-col"> <h2 className="text-2xl font-bold text-indigo-400">Pro Yearly <span className="text-sm bg-yellow-400 text-yellow-900 font-bold px-2 py-1 rounded-full">Save $30</span></h2> <p className="text-4xl font-bold my-4">$150 <span className="text-lg font-normal text-gray-400">/ year</span></p> <ul className="space-y-2 text-gray-300 flex-grow"> <li><i className="fa-solid fa-check text-green-500 mr-2"></i>All Pro features</li> <li><i className="fa-solid fa-check text-green-500 mr-2"></i>Two months free</li> </ul> <button onClick={() => onSelectPlan({name: 'Pro Yearly', price: 150})} className="w-full mt-6 bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-500">Upgrade to Yearly</button> </div> </div> </div> ); };
const CheckoutPage = ({ showToast, onNavigate, plan }) => { const handlePayment = (e) => { e.preventDefault(); showToast(`Payment of $${plan.price} for ${plan.name} successful!`); onNavigate('dashboard'); }; return( <div className="max-w-md mx-auto"> <h1 className="text-3xl font-bold mb-2">Checkout</h1> <p className="text-gray-400 mb-6">You are subscribing to the <span className="font-bold text-indigo-400">{plan.name}</span> plan.</p> <div className="bg-gray-800 p-8 rounded-xl"> <form onSubmit={handlePayment} className="space-y-4"> <div> <label className="block text-sm font-medium text-gray-300 mb-1">Name on Card</label> <input type="text" className="w-full bg-gray-700 rounded-lg p-3" required/> </div> <div> <label className="block text-sm font-medium text-gray-300 mb-1">Card Number</label> <input type="text" placeholder=".... .... .... ...." className="w-full bg-gray-700 rounded-lg p-3" required/> </div> <div className="grid grid-cols-2 gap-4"> <div> <label className="block text-sm font-medium text-gray-300 mb-1">Expiry (MM/YY)</label> <input type="text" placeholder="MM/YY" className="w-full bg-gray-700 rounded-lg p-3" required/> </div> <div> <label className="block text-sm font-medium text-gray-300 mb-1">CVC</label> <input type="text" placeholder="..." className="w-full bg-gray-700 rounded-lg p-3" required/> </div> </div> <button type="submit" className="w-full mt-6 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-500">Confirm Payment of ${plan.price}</button> </form> </div> </div> ); };
const PayoutsPage = ({user}) => { const [completedProjects, setCompletedProjects] = useState([]); const [isLoading, setIsLoading] = useState(true); const commissionRate = 0.15; useEffect(() => { const fetchCompleted = async() => { if(!user) return; const q = query(collection(db, 'projects'), where("editorId", "==", user.uid), where("status", "==", "Completed")); const querySnapshot = await getDocs(q); setCompletedProjects(querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}))); setIsLoading(false); }; fetchCompleted(); }, [user]); const totalPayout = completedProjects.reduce((acc, proj) => acc + (proj.budget * (1 - commissionRate)), 0); if(isLoading) return <Spinner text="Loading Completed Projects..." />; return ( <div className="max-w-4xl mx-auto"> <h1 className="text-3xl font-bold mb-6">My Payouts</h1> <div className="bg-gray-800 p-8 rounded-xl"> <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-4"> <h2 className="text-xl font-bold">Available to Withdraw</h2> <p className="text-3xl font-bold text-green-400">${totalPayout.toFixed(2)}</p> </div> <div className="space-y-2 mb-6"> {completedProjects.map(p => ( <div key={p.id} className="flex justify-between items-center text-gray-300"> <span>{p.title}</span> <span>+ ${(p.budget * (1 - commissionRate)).toFixed(2)}</span> </div> ))} </div> <button disabled={totalPayout <= 0} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed">Withdraw Funds</button> <p className="text-xs text-center text-gray-500 mt-2">Payouts are handled via Stripe. A 15% platform fee is deducted from the project budget.</p> </div> </div> ); };
const ProjectMessagesPage = ({ projectId, user, showToast }) => { const [messages, setMessages] = useState([]); const [newMessage, setNewMessage] = useState(''); const [project, setProject] = useState(null); const [isLoading, setIsLoading] = useState(true); const [uploadProgress, setUploadProgress] = useState(0); const fetchProjectAndMessages = async () => { if(!projectId) return; setIsLoading(true); const projectRef = doc(db, 'projects', projectId); const projectSnap = await getDoc(projectRef); if(projectSnap.exists()) setProject(projectSnap.data()); const q = query(collection(db, 'messages'), where('projectId', '==', projectId)); const querySnapshot = await getDocs(q); const messageList = querySnapshot.docs.map(doc => doc.data()).sort((a,b) => a.createdAt - b.createdAt); setMessages(messageList); setIsLoading(false); }; useEffect(() => { fetchProjectAndMessages(); }, [projectId]); const handleSendMessage = async (e) => { e.preventDefault(); if(newMessage.trim() === '') return; await addDoc(collection(db, 'messages'), { text: newMessage, projectId: projectId, senderId: user.uid, senderEmail: user.email, createdAt: serverTimestamp() }); setNewMessage(''); fetchProjectAndMessages(); }; const handleDeliveryUpload = (e) => { const file = e.target.files[0]; if (!file || !project) return; const storageRef = ref(storage, `deliveries/${projectId}/${file.name}`); const uploadTask = uploadBytesResumable(storageRef, file); uploadTask.on('state_changed', (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100), (error) => { console.error("Upload error:", error); showToast("Upload failed!", false); }, () => { getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => { const projectRef = doc(db, 'projects', projectId); await updateDoc(projectRef, { status: 'Delivered', deliveryUrl: downloadURL }); await addDoc(collection(db, "notifications"), { userId: project.ownerId, message: `has delivered the final video for project: ${project.title}`, read: false, createdAt: serverTimestamp(), applicantId: user.uid, applicantUsername: user.displayName || user.email, projectId: projectId }); showToast("Project delivered successfully!"); setUploadProgress(0); fetchProjectAndMessages(); }); } ); }; if (isLoading) return <Spinner text="Loading Messages..." />; return ( <div className="max-w-4xl mx-auto"> <h1 className="text-3xl font-bold mb-6">Project Chat: {project?.title}</h1> <div className="bg-gray-800 rounded-xl p-6"> <div className="space-y-4 h-96 overflow-y-auto mb-4 pr-4"> {messages.map((msg, index) => ( <div key={index} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}> <div className={`p-3 rounded-lg max-w-lg ${msg.senderId === user.uid ? 'bg-indigo-600' : 'bg-gray-700'}`}> <p>{msg.text}</p> <p className="text-xs text-gray-400 mt-1">{msg.senderEmail}</p> </div> </div> ))} </div> <form onSubmit={handleSendMessage} className="flex space-x-4"> <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type your message..." className="flex-grow bg-gray-700 rounded-lg p-3" /> <button type="submit" className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg">Send</button> </form> {user.uid === project?.editorId && project?.status === 'In Progress' && ( <div className="mt-6 border-t border-gray-700 pt-6"> <label className="block text-sm font-medium text-gray-300 mb-2">Deliver Final Video</label> <input type="file" onChange={handleDeliveryUpload} accept="video/mp4" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-500"/> {uploadProgress > 0 && <div className="w-full bg-gray-600 rounded-full h-2.5 mt-2"><div className="bg-green-500 h-2.5 rounded-full" style={{width: `${uploadProgress}%`}}></div></div>} </div> )} </div> </div>); };
const ConversationsPage = ({ user, onNavigate }) => {
    const [hiredProjects, setHiredProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHiredProjects = async () => {
            if (!user) return;
            // This query is simplified. For better performance at scale, an index on editorId and status would be needed.
            const q = query(collection(db, 'projects'), where("editorId", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const projects = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(p => p.status === 'In Progress' || p.status === 'Delivered');
            setHiredProjects(projects);
            setIsLoading(false);
        };
        fetchHiredProjects();
    }, [user]);

    if (isLoading) return <Spinner text="Loading Conversations..." />;
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">My Conversations</h1>
            <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                {hiredProjects.length > 0 ? hiredProjects.map(p => (
                    <div key={p.id} onClick={() => onNavigate('projectMessages', p.id)} className="p-4 bg-gray-700 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-600">
                        <div>
                            <h3 className="font-bold text-lg">{p.title}</h3>
                            <p className="text-sm text-gray-400">with {p.clientName}</p>
                        </div>
                        <span className="text-indigo-400 font-semibold">View Chat <i className="fa-solid fa-arrow-right ml-2"></i></span>
                    </div>
                )) : <p className="text-center text-gray-400 py-8">You have not been hired for any projects yet.</p>}
            </div>
        </div>
    );
};

// --- DASHBOARD COMPONENTS ---
const VideographerDashboard = ({ onPostProjectClick, projects, isLoading, applications, onSelectProject, onMarkComplete, onNavigate }) => { const getStatusClass = (status) => { switch (status) { case 'In Progress': return 'text-yellow-400'; case 'Delivered': return 'text-orange-400'; case 'Completed': return 'text-green-400'; default: return 'text-blue-400'; } }; return ( <div> <div className="flex justify-between items-center mb-6"> <h1 className="text-3xl font-bold">My Projects</h1> <button onClick={onPostProjectClick} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-500"> <i className="fa-solid fa-plus mr-2"></i> Post New Project </button> </div> {isLoading ? ( <Spinner text="Loading Projects..."/> ) : projects.length === 0 ? ( <div className="text-center py-16 px-6 bg-gray-800 rounded-xl border-2 border-dashed border-gray-700"> <i className="fa-solid fa-folder-open text-4xl text-gray-500 mb-4"></i> <h3 className="text-xl font-semibold">No Projects Yet</h3> <p className="text-gray-400 mt-2">Click "Post New Project" to get started and find an editor.</p> </div> ) : ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {projects.map(p => { const projectApps = applications.filter(app => app.projectId === p.id); return ( <div key={p.id} className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-5 flex flex-col justify-between"> <div> <div className="flex justify-between items-start"> <h3 className="text-lg font-bold mb-2">{p.title}</h3> <span className={`text-xs font-semibold ${getStatusClass(p.status)} bg-gray-700 px-2 py-1 rounded`}>{p.status}</span> </div> <p className="text-xs text-gray-500 mb-2">Due: {p.dueDate || 'Not set'}</p> <p className="text-xs text-gray-500 mb-4">Posted: {p.createdAt ? new Date(p.createdAt.toDate()).toLocaleString() : 'N/A'}</p> <div className="mb-4 mt-2"> {p.skills && p.skills.map(skill => <Tag key={skill}>{skill}</Tag>)} </div> </div> <div> {p.status === 'In Progress' && <button onClick={() => onNavigate('projectMessages', p.id)} className="w-full mb-2 bg-blue-600 text-white font-bold py-2 rounded-lg text-sm">View Messages</button>} {p.status === 'Delivered' && <button onClick={() => onMarkComplete(p.id)} className="w-full mb-2 bg-green-600 text-white font-bold py-2 rounded-lg text-sm">Approve & Pay</button>} <div className="border-t border-gray-700 pt-4 flex justify-between items-center text-sm"> <div><span className="text-gray-400">Budget:</span> <span className="font-bold text-white">${p.budget}</span></div> <button onClick={() => onSelectProject(p)} disabled={p.status !== 'Finding Editor'} className="text-indigo-400 font-bold disabled:text-gray-500 disabled:cursor-not-allowed">{projectApps.length} Applicants</button> </div> </div> </div> ) })} </div> )} </div> ); };
const EditorDashboard = ({ showToast, user, userData, onNavigate }) => { const [jobs, setJobs] = useState([]); const [isLoading, setIsLoading] = useState(true); const [appliedJobs, setAppliedJobs] = useState([]); useEffect(() => { const fetchJobsAndApplications = async () => { if(!db || !user) { setIsLoading(false); return; } setIsLoading(true); try { const jobsQuery = query(collection(db, 'projects'), where("status", "==", "Finding Editor")); const jobSnapshot = await getDocs(jobsQuery); const jobList = jobSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setJobs(jobList); const appsQuery = query(collection(db, 'applications'), where("editorId", "==", user.uid)); const appSnapshot = await getDocs(appsQuery); const appList = appSnapshot.docs.map(doc => doc.data().projectId); setAppliedJobs(appList); } catch (error) { console.error("Error fetching jobs:", error); } finally { setIsLoading(false); } }; fetchJobsAndApplications(); }, [user]); const handleApply = async (job) => { if(!db) { showToast("Error: Database not connected.", false); return; } try { await addDoc(collection(db, "applications"), { projectId: job.id, editorId: user.uid, editorEmail: user.email, editorUsername: userData.username, appliedAt: serverTimestamp() }); await addDoc(collection(db, "notifications"), { userId: job.ownerId, message: `applied to your project: ${job.title}`, read: false, createdAt: serverTimestamp(), applicantId: user.uid, applicantUsername: userData.username, projectId: job.id }); setAppliedJobs([...appliedJobs, job.id]); showToast("Application sent successfully!"); } catch (error) { console.error("Error applying to job:", error); showToast("Failed to apply.", false); } }; return ( <div> <div className="flex justify-between items-center mb-6"> <h1 className="text-3xl font-bold">Project Feed</h1> </div> {isLoading ? ( <Spinner text="Loading Jobs..."/> ) : jobs.length === 0 ? ( <div className="text-center py-16 px-6 bg-gray-800 rounded-xl border-2 border-dashed border-gray-700"> <i className="fa-solid fa-inbox text-4xl text-gray-500 mb-4"></i> <h3 className="text-xl font-semibold">No Jobs in the Feed</h3> <p className="text-gray-400 mt-2">New projects from videographers will appear here live.</p> </div> ) : ( <div className="space-y-4"> {jobs.map(j => ( <div key={j.id} className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-5"> <div className="flex justify-between items-start"> <div> <h3 className="text-lg font-bold">{j.title}</h3> <p className="text-sm text-gray-400">by <span className="font-semibold text-indigo-400">{j.clientName || "A Videographer"}</span></p> </div> <div className="text-right flex-shrink-0 ml-4"> <div className="text-xl font-bold text-green-400">${j.budget}</div> </div> </div> <p className="text-xs text-gray-500 my-2">Due: {j.dueDate || 'Not set'}</p> <div className="mt-4 mb-5"> {Array.isArray(j.skills) && j.skills.map(skill => <Tag key={skill}>{skill}</Tag>)} </div> <div className="border-t border-gray-700 pt-4 flex justify-between items-center"> <span className="text-xs text-gray-500">Posted: {j.createdAt ? new Date(j.createdAt.toDate()).toLocaleDateString() : 'N/A'}</span> <button onClick={() => handleApply(j)} disabled={appliedJobs.includes(j.id) || j.ownerId === user.uid} className={`font-semibold py-2 px-4 rounded-lg text-sm transition ${appliedJobs.includes(j.id) ? 'bg-green-600 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed'}`}> {appliedJobs.includes(j.id) ? <><i className="fa-solid fa-check mr-2"></i>Applied</> : <><i className="fa-solid fa-bolt mr-2"></i>Apply Now</>} </button> </div> </div> ))} </div> )} </div> ); };

// --- MAIN DASHBOARD / WRAPPER PAGE ---
const DashboardPage = ({ user, userData, showToast, onNavigate }) => { const [projects, setProjects] = useState([]); const [applications, setApplications] = useState([]); const [isLoading, setIsLoading] = useState(true); const [isPostModalOpen, setIsPostModalOpen] = useState(false); const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false); const [selectedProject, setSelectedProject] = useState(null); const [viewAs, setViewAs] = useState(userData?.userType); const fetchData = async () => { if(!db || !user) return; setIsLoading(true); try { if (userData.userType === 'videographer') { const projectsQuery = query(collection(db, 'projects'), where("ownerId", "==", user.uid)); const projectSnapshot = await getDocs(projectsQuery); const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => b.createdAt - a.createdAt); setProjects(projectList); if (projectList.length > 0) { const appsQuery = query(collection(db, "applications"), where("projectId", "in", projectList.map(p => p.id))); const appSnapshot = await getDocs(appsQuery); setApplications(appSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); } } } catch (error) { console.error("Error fetching data:", error); showToast("Could not fetch projects. Please check console.", false) } finally { setIsLoading(false); } }; useEffect(() => { setViewAs(userData?.userType); fetchData(); }, [user, userData]); const handleAddProject = async (newProjectData) => { if(!db) { showToast("Error: Database not connected.", false); return; } try { await addDoc(collection(db, "projects"), { ...newProjectData, status: 'Finding Editor', createdAt: serverTimestamp() }); showToast("Project Posted Successfully!"); setIsPostModalOpen(false); fetchData(); } catch (error) { console.error("Error adding project:", error); showToast("Failed to post project.", false); } }; const handleSelectProject = async (project) => { if (project.status !== 'Finding Editor') return; const projectApps = applications.filter(app => app.projectId === project.id); const editorIds = [...new Set(projectApps.map(app => app.editorId))]; if (editorIds.length === 0) { setSelectedProject({...project, applicants: []}); setIsApplicantModalOpen(true); return; }; const usersQuery = query(collection(db, 'users'), where('__name__', 'in', editorIds)); const userDocs = await getDocs(usersQuery); const editorProfiles = {}; userDocs.forEach(doc => { editorProfiles[doc.id] = doc.data(); }); const fullApplicantData = projectApps.map(app => ({ ...app, bio: editorProfiles[app.editorId]?.bio, username: editorProfiles[app.editorId]?.username })); setSelectedProject({...project, applicants: fullApplicantData}); setIsApplicantModalOpen(true); }; const handleHire = async (projectId, applicant) => { if(!db) return; const projectRef = doc(db, 'projects', projectId); await updateDoc(projectRef, { status: 'In Progress', editorId: applicant.editorId, editorUsername: applicant.username || applicant.editorEmail }); await addDoc(collection(db, "notifications"), { userId: applicant.editorId, message: `You have been hired for the project: ${selectedProject.title}`, read: false, createdAt: serverTimestamp(), projectId: projectId }); setIsApplicantModalOpen(false); showToast(`${applicant.username || applicant.editorEmail} has been hired!`); fetchData(); }; const handleMarkComplete = async (projectId) => { const project = projects.find(p => p.id === projectId); if (!project) return; try { await runTransaction(db, async (transaction) => { const videographerRef = doc(db, "users", project.ownerId); const editorRef = doc(db, "users", project.editorId); const projectRef = doc(db, "projects", projectId); const videographerDoc = await transaction.get(videographerRef); const editorDoc = await transaction.get(editorRef); if (!videographerDoc.exists() || !editorDoc.exists()) { throw "User not found!"; } const videographerBalance = videographerDoc.data().balance || 0; if (videographerBalance < project.budget) { throw "Insufficient funds"; } transaction.update(videographerRef, { balance: videographerBalance - project.budget }); transaction.update(editorRef, { balance: (editorDoc.data().balance || 0) + project.budget }); transaction.update(projectRef, { status: 'Completed' }); }); showToast("Payment successful and project marked as complete!"); fetchData(); } catch (e) { console.error(e); showToast(e === "Insufficient funds" ? "Payment failed: Insufficient funds in wallet." : "Payment failed.", false); } }; if (!userData) return <Spinner text="Loading user data..." />; return ( <div> <div className="flex items-center space-x-4 mb-6 p-2 bg-gray-800 rounded-lg max-w-sm"> <span className="text-sm font-semibold text-gray-300">View Dashboard as:</span> <div className="bg-gray-700 p-1 rounded-lg flex space-x-1"> <button onClick={() => setViewAs('videographer')} className={`text-sm font-semibold px-3 py-1 rounded-md transition ${viewAs === 'videographer' ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}>Videographer</button> <button onClick={() => setViewAs('editor')} className={`text-sm font-semibold px-3 py-1 rounded-md transition ${viewAs === 'editor' ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}>Editor</button> </div> </div> {viewAs === 'videographer' ? ( <VideographerDashboard onPostProjectClick={() => setIsPostModalOpen(true)} projects={projects} isLoading={isLoading} applications={applications} onSelectProject={handleSelectProject} onMarkComplete={handleMarkComplete} onNavigate={onNavigate}/> ) : ( <EditorDashboard showToast={showToast} user={user} userData={userData} onNavigate={onNavigate} /> )} <ProjectModal show={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} onAddProject={handleAddProject} user={user} /> {selectedProject && <ApplicantModal show={isApplicantModalOpen} onClose={() => setIsApplicantModalOpen(false)} applicants={selectedProject.applicants} project={selectedProject} onNavigate={onNavigate} onHire={handleHire} />} </div> ); };

// --- ROOT APP COMPONENT ---
export default function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [toastInfo, setToastInfo] = useState({ show: false, message: '', isSuccess: true });
    const [notifications, setNotifications] = useState([]);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [pagePayload, setPagePayload] = useState(null);
    const [showNotifications, setShowNotifications] = useState(false);
    
    const fetchNotifications = async (currentUser) => {
        if (!currentUser) return;
        const q = query(collection(db, "notifications"), where("userId", "==", currentUser.uid), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        setNotifications(querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDocRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) { setUserData(docSnap.data()); } 
                else { setUserData(null); }
                fetchNotifications(currentUser);
            } else {
                setUser(null);
                setUserData(null);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (user) {
            const interval = setInterval(() => { fetchNotifications(user); }, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);
    
    const showToast = (message, isSuccess = true) => {
        setToastInfo({ show: true, message, isSuccess });
        setTimeout(() => setToastInfo({ show: false, message: '', isSuccess: true }), 3000);
    };

    const handleLogout = async () => {
        await signOut(auth);
        setCurrentPage('dashboard');
        showToast("Logged out successfully.");
    };

    const handleNavigate = (page, payload = null) => {
        setCurrentPage(page);
        setPagePayload(payload);
        setShowNotifications(false);
    };

    const handleSelectPlan = (plan) => {
        handleNavigate('checkout', plan);
    };

    const renderPage = () => {
        if (!user) { return <AuthPage showToast={showToast} />; }
        switch (currentPage) {
            case 'profile':
                return <ProfilePage user={user} showToast={showToast} />;
            case 'viewProfile':
                return <PublicProfilePage userId={pagePayload} />;
            case 'billing':
                 return <BillingPage onSelectPlan={handleSelectPlan} user={user} showToast={showToast} />;
            case 'checkout':
                return <CheckoutPage showToast={showToast} onNavigate={handleNavigate} plan={pagePayload} />;
            case 'payouts':
                return <PayoutsPage user={user} />;
            case 'projectMessages':
                return <ProjectMessagesPage projectId={pagePayload} user={user} showToast={showToast} />;
            case 'conversations':
                return <ConversationsPage user={user} onNavigate={handleNavigate} />;
            case 'dashboard':
            default:
                return <DashboardPage user={user} userData={userData} showToast={showToast} onNavigate={handleNavigate} />;
        }
    };

    if (isLoading) {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white"><Spinner text="Authenticating..." /></div>;
    }

    return (
        <div className="bg-gray-900 min-h-screen text-gray-100">
             <Header user={user} onLogout={handleLogout} onNavigate={handleNavigate} notifications={notifications} showNotifications={showNotifications} onToggleNotifications={(val) => setShowNotifications(val ?? !showNotifications)} userData={userData} />
             <main className="container mx-auto p-6">
                {renderPage()}
             </main>
             <Toast message={toastInfo.message} show={toastInfo.show} isSuccess={toastInfo.isSuccess} />
        </div>
    );
}
