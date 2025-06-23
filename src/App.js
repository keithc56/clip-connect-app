import React, { useState, useEffect } from 'react';
// STEP 1: ADD FIREBASE IMPORTS
// These lines import the necessary functions from the Firebase SDK.
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

// STEP 2: PASTE YOUR FIREBASE CONFIGURATION HERE
// Replace this with the firebaseConfig object from your Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyBMX_4TgliafTMsEp_nCXNmJbz2bNULbLg",
  authDomain: "clip-connect-57dbd.firebaseapp.com",
  projectId: "clip-connect-57dbd",
  storageBucket: "clip-connect-57dbd.firebasestorage.app",
  messagingSenderId: "107978636841",
  appId: "1:107978636841:web:fa6b1af0972ee912afa638",
  measurementId: "G-YCX42HBB0S"};

// STEP 3: INITIALIZE FIREBASE AND FIRESTORE
// This connects your app to your Firebase project.
let app;
let db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
    console.error("Firebase initialization error:", error);
    // You might want to display a user-friendly error message on the screen
}


const Tag = ({ children }) => (
    <span className="bg-gray-700 text-indigo-300 text-xs font-semibold mr-2 mb-2 inline-block px-2.5 py-1 rounded-full">{children}</span>
);

const Toast = ({ message, show, isSuccess }) => (
    <div className={`fixed bottom-10 right-10 text-white py-3 px-6 rounded-lg shadow-xl transform transition-all duration-300 ${show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'} ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`}>
        {message}
    </div>
);

// --- Main Components ---
const Header = ({ userType, setUserType }) => {
    return (
        <nav className="bg-gray-900/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-700">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="text-2xl font-bold text-white flex items-center">
                    <i className="fa-solid fa-film mr-3 text-indigo-400"></i>
                    <span>Clip-Connect</span>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-400">Viewing as:</div>
                    <div className="bg-gray-700 p-1 rounded-lg flex space-x-1">
                        <button onClick={() => setUserType('videographer')} className={`text-sm font-semibold px-3 py-1 rounded-md transition ${userType === 'videographer' ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}>Videographer</button>
                        <button onClick={() => setUserType('editor')} className={`text-sm font-semibold px-3 py-1 rounded-md transition ${userType === 'editor' ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}>Editor</button>
                    </div>
                     <i className="fa-regular fa-bell text-xl text-gray-400 hover:text-white cursor-pointer hidden sm:block"></i>
                    <img src="https://placehold.co/40x40/7c3aed/ffffff?text=U" className="w-10 h-10 rounded-full border-2 border-indigo-500" alt="User Avatar" />
                </div>
            </div>
        </nav>
    );
};

const ProjectModal = ({ show, onClose, onAddProject }) => {
    const [title, setTitle] = useState('');
    const [budget, setBudget] = useState(500);
    const [skills, setSkills] = useState('');
    
    if (!show) return null;
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);
        await onAddProject({ title, budget: parseInt(budget), skills: skillsArray });
        setTitle('');
        setBudget(500);
        setSkills('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-2xl transform transition-transform duration-300 scale-100" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Create New Project</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-300">Project Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., 'Wedding Highlight Reel'" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-300">Budget ($)</label>
                        <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="500" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-300">Required Skills (comma-separated)</label>
                        <input type="text" value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g., Color Grading, Motion Graphics" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button type="button" onClick={onClose} className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg mr-2">Cancel</button>
                        <button type="submit" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg">Post Project</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const VideographerView = ({ onPostProjectClick, projects, isLoading, applications }) => {
    const getStatusClass = (status) => {
        switch (status) {
            case 'In Progress': return 'text-yellow-400';
            case 'Completed': return 'text-green-400';
            default: return 'text-blue-400';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">My Projects</h1>
                <button onClick={onPostProjectClick} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-500 transition-transform transform hover:scale-105">
                    <i className="fa-solid fa-plus mr-2"></i> Post New Project
                </button>
            </div>
            {isLoading ? (
                 <div className="text-center py-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div><p className="mt-4">Loading Projects...</p></div>
            ) : projects.length === 0 ? (
                <div className="text-center py-16 px-6 bg-gray-800 rounded-xl border-2 border-dashed border-gray-700">
                    <i className="fa-solid fa-folder-open text-4xl text-gray-500 mb-4"></i>
                    <h3 className="text-xl font-semibold">No Projects Yet</h3>
                    <p className="text-gray-400 mt-2">Click "Post New Project" to get started and find an editor.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(p => {
                        const applicantCount = applications.filter(app => app.projectId === p.id).length;
                        return (
                            <div key={p.id} className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-5 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-bold mb-2">{p.title}</h3>
                                        <span className={`text-xs font-semibold ${getStatusClass(p.status)} bg-gray-700 px-2 py-1 rounded`}>{p.status}</span>
                                    </div>
                                    <div className="mb-4 mt-2">
                                        {p.skills && p.skills.map(skill => <Tag key={skill}>{skill}</Tag>)}
                                    </div>
                                </div>
                                <div className="border-t border-gray-700 pt-4 flex justify-between items-center text-sm">
                                    <div><span className="text-gray-400">Budget:</span> <span className="font-bold text-white">${p.budget}</span></div>
                                    {p.status === 'Finding Editor' ? 
                                        <div className="text-indigo-400 font-bold">{applicantCount} Applicants</div> : 
                                        <div className="text-gray-400">Editor: <span className="font-semibold text-white">{p.editor || 'N/A'}</span></div>
                                    }
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

const EditorView = ({ showToast }) => {
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [appliedJobs, setAppliedJobs] = useState([]);
    
    useEffect(() => {
        const fetchJobs = async () => {
            if(!db) {
                console.log("Firestore is not initialized.");
                setIsLoading(false);
                return;
            }
            try {
                const jobsCollection = collection(db, 'projects'); // Read from the 'projects' collection
                const jobSnapshot = await getDocs(jobsCollection);
                const jobList = jobSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setJobs(jobList.filter(job => job.status === 'Finding Editor')); // Only show open jobs
            } catch (error) {
                console.error("Error fetching jobs:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const handleApply = async (jobId) => {
        if(!db) {
            showToast("Error: Database not connected.", false);
            return;
        }
        try {
            // Add a new document to the 'applications' collection
            await addDoc(collection(db, "applications"), {
                projectId: jobId,
                editorId: "CURRENT_USER_ID", // In a real app, this would be the logged-in user's ID
                appliedAt: serverTimestamp()
            });
            setAppliedJobs([...appliedJobs, jobId]);
            showToast("Application sent successfully!");
        } catch (error) {
            console.error("Error applying to job:", error);
            showToast("Failed to apply.", false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Project Feed</h1>
            </div>
             {isLoading ? (
                <div className="text-center py-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div><p className="mt-4">Loading Jobs...</p></div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-16 px-6 bg-gray-800 rounded-xl border-2 border-dashed border-gray-700">
                    <i className="fa-solid fa-inbox text-4xl text-gray-500 mb-4"></i>
                    <h3 className="text-xl font-semibold">No Jobs in the Feed</h3>
                    <p className="text-gray-400 mt-2">New projects from videographers will appear here live.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {jobs.map(j => (
                        <div key={j.id} className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-5 transition-all hover:border-indigo-500 hover:shadow-indigo-500/10">
                            <div className="flex justify-between items-start">
                                 <div>
                                    <h3 className="text-lg font-bold">{j.title}</h3>
                                    <p className="text-sm text-gray-400">by <span className="font-semibold text-indigo-400">{j.clientName || "A Videographer"}</span></p>
                                </div>
                                 <div className="text-right flex-shrink-0 ml-4">
                                    <div className="text-xl font-bold text-green-400">${j.budget}</div>
                                </div>
                            </div>
                            <div className="mt-4 mb-5">
                                {Array.isArray(j.skills) && j.skills.map(skill => <Tag key={skill}>{skill}</Tag>)}
                            </div>
                            <div className="border-t border-gray-700 pt-4 flex justify-between items-center">
                                <span className="text-xs text-gray-500">Posted recently</span>
                                <button 
                                    onClick={() => handleApply(j.id)} 
                                    disabled={appliedJobs.includes(j.id)}
                                    className={`font-semibold py-2 px-4 rounded-lg text-sm transition ${appliedJobs.includes(j.id) ? 'bg-green-600 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                                >
                                   {appliedJobs.includes(j.id) ? <><i className="fa-solid fa-check mr-2"></i>Applied</> : <><i className="fa-solid fa-bolt mr-2"></i>Apply Now</>}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


// --- App Component ---
export default function App() {
    const [userType, setUserType] = useState('videographer');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [toastInfo, setToastInfo] = useState({ show: false, message: '', isSuccess: true });
    const [projects, setProjects] = useState([]);
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        if(!db) return;
        setIsLoading(true);
        try {
            // Fetch both projects and applications
            const projectsCollection = collection(db, 'projects');
            const projectSnapshot = await getDocs(projectsCollection);
            const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProjects(projectList);

            const appsCollection = collection(db, 'applications');
            const appSnapshot = await getDocs(appsCollection);
            const appList = appSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setApplications(appList);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if(db) fetchData();
    }, []);

    const showToast = (message, isSuccess = true) => {
        setToastInfo({ show: true, message, isSuccess });
        setTimeout(() => setToastInfo({ show: false, message: '', isSuccess: true }), 3000);
    };

    const handleAddProject = async (newProjectData) => {
        if(!db) {
            showToast("Error: Database not connected.", false);
            return;
        }
        try {
            await addDoc(collection(db, "projects"), {
                ...newProjectData,
                status: 'Finding Editor',
                createdAt: serverTimestamp()
            });
            showToast("Project Posted Successfully!");
            setIsModalOpen(false);
            fetchData(); // Re-fetch all data to show the new project
        } catch (error) {
            console.error("Error adding project:", error);
            showToast("Failed to post project.", false);
        }
    };

    return (
        <div className="bg-gray-900 min-h-screen text-gray-100">
            <Header userType={userType} setUserType={setUserType} />
            <main className="container mx-auto p-6">
                {userType === 'videographer' ? 
                    <VideographerView 
                        onPostProjectClick={() => setIsModalOpen(true)}
                        projects={projects}
                        isLoading={isLoading}
                        applications={applications}
                    /> 
                    : <EditorView showToast={showToast} />}
            </main>
            <ProjectModal show={isModalOpen} onClose={() => setIsModalOpen(false)} onAddProject={handleAddProject} />
            <Toast message={toastInfo.message} show={toastInfo.show} isSuccess={toastInfo.isSuccess} />
        </div>
    );
}