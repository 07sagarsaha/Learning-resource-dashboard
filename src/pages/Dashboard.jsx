import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Resources from "../components/Resources";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { db } from "../utils/firebase";
import { collection, onSnapshot, addDoc } from "firebase/firestore";

function Dashboard() {
  const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState(false);
  const [isNewClusterModalOpen, setIsNewClusterModalOpen] = useState(false);
  const [newClusterName, setNewClusterName] = useState("");
  const [clusters, setClusters] = useState([]);
  const [totalResources, setTotalResources] = useState(0);
  const [inProgressResources, setInProgressResources] = useState(0);
  const [completedResources, setCompletedResources] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [type, setType] = useState("website");
  const [selectedCluster, setSelectedCluster] = useState("");

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAddResourceModal = () => {
    setIsAddResourceModalOpen(true);
  };

  const handleCloseAddResourceModal = () => {
    setIsAddResourceModalOpen(false);
  };

  const handleOpenNewClusterModal = () => {
    setIsNewClusterModalOpen(true);
  };

  const handleCloseNewClusterModal = () => {
    setIsNewClusterModalOpen(false);
  };

  const handleCreateNewCluster = async () => {
    if (currentUser) {
      const clustersRef = collection(db, "users", currentUser.uid, "clusters");
      await addDoc(clustersRef, {
        name: newClusterName,
      });
      setIsNewClusterModalOpen(false);
      setNewClusterName("");
    }
  };

  useEffect(() => {
    if (currentUser) {
      const resourcesRef = collection(
        db,
        "users",
        currentUser.uid,
        "resources"
      );
      const unsubscribe = onSnapshot(resourcesRef, (snapshot) => {
        const resourcesData = snapshot.docs.map((doc) => doc.data());
        setTotalResources(resourcesData.length);
        setInProgressResources(
          resourcesData.filter(
            (resource) => resource.progress === "In Progress"
          ).length
        );
        setCompletedResources(
          resourcesData.filter((resource) => resource.progress === "Completed")
            .length
        );
      });

      const clustersRef = collection(db, "users", currentUser.uid, "clusters");
      const unsubscribeClusters = onSnapshot(clustersRef, (snapshot) => {
        const clustersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClusters(clustersData);
      });

      return () => {
        unsubscribe();
        unsubscribeClusters();
      };
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentUser) {
      const resourcesRef = collection(
        db,
        "users",
        currentUser.uid,
        "resources"
      );
      await addDoc(resourcesRef, {
        title,
        url,
        description,
        category,
        tags: tags.split(",").map((tag) => tag.trim()),
        type,
        progress: "Not Started",
        clusterId: selectedCluster || "default",
      });
      setTitle("");
      setUrl("");
      setDescription("");
      setCategory("");
      setTags("");
      setType("website");
      setSelectedCluster("");
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="dark:bg-gray-800 dark:text-white min-h-screen">
        <div className="container mx-auto p-4">
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">LearnTrack</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
          </header>
          <div className="flex gap-4 mb-6">
            <div className="bg-white dark:bg-gray-700 p-4 rounded shadow-md w-1/4 text-center">
              <h3 className="text-lg font-semibold mb-2">Total Resources</h3>
              <p className="text-3xl">{totalResources}</p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-4 rounded shadow-md w-1/4 text-center">
              <h3 className="text-lg font-semibold mb-2">In Progress</h3>
              <p className="text-3xl">{inProgressResources}</p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-4 rounded shadow-md w-1/4 text-center">
              <h3 className="text-lg font-semibold mb-2">Completed</h3>
              <p className="text-3xl">{completedResources}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center bg-white dark:bg-gray-700 p-2 rounded shadow-md w-1/2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search resources..."
                className="bg-transparent outline-none text-gray-800 dark:text-white w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {/* <button className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-bold py-2 px-4 rounded">
                Filter
              </button> */}
              <button className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-bold py-2 px-4 rounded">
                Export
              </button>
            </div>
          </div>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">Your Learning Resources</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleOpenNewClusterModal}
                  className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-bold py-2 px-4 rounded"
                >
                  + New Cluster
                </button>
                <button
                  onClick={handleOpenAddResourceModal}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  + Add Resource
                </button>
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              Track and manage your learning materials
            </p>
          </div>
          <Resources searchQuery={searchQuery} />
          {isAddResourceModalOpen && (
            <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center backdrop-blur-md">
              <div className="bg-white dark:bg-gray-700 p-8 rounded shadow-md">
                <div className="flex justify-between items-center mb-4 w-96">
                  <h2 className="text-2xl font-bold mb-4">Add New Resource</h2>
                  <button
                    onClick={handleCloseAddResourceModal}
                    className="text-gray-500 dark:text-gray-400"
                  >
                    X
                  </button>
                </div>
                <form
                  onSubmit={handleSubmit}
                  className="mb-4 flex flex-col gap-4"
                >
                  <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="border p-2 rounded text-gray-800 dark:text-white dark:bg-gray-600"
                  />
                  <input
                    type="url"
                    placeholder="URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="border p-2 rounded text-gray-800 dark:text-white dark:bg-gray-600"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="border p-2 rounded text-gray-800 dark:text-white dark:bg-gray-600"
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="border p-2 rounded text-gray-800 dark:text-white dark:bg-gray-600"
                  />
                  <input
                    type="text"
                    placeholder="Tags (comma separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="border p-2 rounded text-gray-800 dark:text-white dark:bg-gray-600"
                  />
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="border p-2 rounded text-gray-800 dark:text-white dark:bg-gray-600"
                  >
                    <option value="website">Website</option>
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="pdf">PDF</option>
                    <option value="article">Article</option>
                  </select>
                  <select
                    value={selectedCluster}
                    onChange={(e) => setSelectedCluster(e.target.value)}
                    className="border p-2 rounded text-gray-800 dark:text-white dark:bg-gray-600"
                  >
                    <option value="">Default</option>
                    {clusters.map((cluster) => (
                      <option key={cluster.id} value={cluster.id}>
                        {cluster.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Add Resource
                  </button>
                </form>
              </div>
            </div>
          )}
          {isNewClusterModalOpen && (
            <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center">
              <div className="bg-white dark:bg-gray-700 p-8 rounded shadow-md ">
                <div className="flex justify-between items-center mb-4">
                  <h2>Add New Cluster</h2>
                  <button onClick={handleCloseNewClusterModal}>X</button>
                </div>
                <div className="flex gap-1 justify-center items-center">
                  <input
                    type="text"
                    placeholder="Cluster Name"
                    className="border p-2 rounded text-gray-800 dark:text-white dark:bg-gray-600 "
                    value={newClusterName}
                    onChange={(e) => setNewClusterName(e.target.value)}
                  />
                  <button
                    onClick={handleCreateNewCluster}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
}

export default Dashboard;
