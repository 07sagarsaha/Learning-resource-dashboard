import React, { useState, useEffect } from "react";
import { db } from "../utils/firebase";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { useDrag } from "react-dnd";
import ResourceCluster from "./ResourceCluster";
import ResourceViewer from "./ResourceViewer";

function Resources({ searchQuery }) {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [clusters, setClusters] = useState({});

  useEffect(() => {
    if (searchQuery) {
      const filtered = resources.filter((resource) => {
        const searchTerm = searchQuery.toLowerCase();
        return (
          resource.title.toLowerCase().includes(searchTerm) ||
          resource.description.toLowerCase().includes(searchTerm) ||
          resource.category.toLowerCase().includes(searchTerm) ||
          resource.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
        );
      });
      setFilteredResources(filtered);
    } else {
      setFilteredResources(resources);
    }
  }, [searchQuery, resources]);

  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editType, setEditType] = useState("website");
  const [editCluster, setEditCluster] = useState("");
  const [newClusterName, setNewClusterName] = useState("");
  const [selectedResource, setSelectedResource] = useState(null);
  const { currentUser } = useAuth();

  const openResource = (url) => {
    try {
      const popup = window.open(url, "_blank", "width=800,height=600");
      if (!popup || popup.closed || typeof popup.closed == "undefined") {
        window.open(url, "_blank");
      }
    } catch (e) {
      console.error("Error opening resource:", e);
    }
  };

  const handleCreateCluster = async () => {
    if (currentUser && newClusterName) {
      const clustersRef = collection(db, "users", currentUser.uid, "clusters");
      await addDoc(clustersRef, { name: newClusterName });
      setNewClusterName("");
    }
  };

  useEffect(() => {
    let unsubscribe;

    if (currentUser) {
      const resourcesRef = collection(
        db,
        "users",
        currentUser.uid,
        "resources"
      );
      const clustersRef = collection(db, "users", currentUser.uid, "clusters");

      unsubscribe = onSnapshot(
        resourcesRef,
        async (resourceSnapshot) => {
          const resourcesData = resourceSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            clusterId: doc.data().clusterId,
          }));
          setResources(resourcesData);

          const groupedClusters = resourcesData.reduce((acc, resource) => {
            const clusterId = resource.clusterId || "default";
            acc[clusterId] = acc[clusterId] || [];
            acc[clusterId].push(resource);
            return acc;
          }, {});

          onSnapshot(clustersRef, (clusterSnapshot) => {
            const clustersData = clusterSnapshot.docs.reduce((acc, doc) => {
              acc[doc.id] = { ...doc.data(), id: doc.id };
              return acc;
            }, {});

            const updatedClusters = { ...clustersData };
            if (!updatedClusters["default"]) {
              updatedClusters["default"] = { name: "Default", id: "default" };
            }

            for (const clusterId in groupedClusters) {
              updatedClusters[clusterId] = updatedClusters[clusterId] || {};
              updatedClusters[clusterId].resources = groupedClusters[clusterId];
            }
            setClusters(updatedClusters);
          });
        },
        (error) => {
          console.error("Error fetching resources and clusters:", error);
        }
      );
    } else {
      setResources([]);
      setClusters({});
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  const handleDelete = async (id) => {
    if (currentUser) {
      const resourceRef = doc(db, "users", currentUser.uid, "resources", id);
      await deleteDoc(resourceRef);
    }
  };

  const handleEdit = (resource) => {
    setEditId(resource.id);
    setEditTitle(resource.title);
    setEditUrl(resource.url);
    setEditDescription(resource.description);
    setEditCategory(resource.category);
    setEditTags(resource.tags.join(", "));
    setEditType(resource.type);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (currentUser && editId) {
      const resourceRef = doc(
        db,
        "users",
        currentUser.uid,
        "resources",
        editId
      );
      await updateDoc(resourceRef, {
        title: editTitle,
        url: editUrl,
        description: editDescription,
        category: editCategory,
        tags: editTags.split(",").map((tag) => tag.trim()),
        type: editType,
        clusterId: editCluster || "default",
      });
      setEditId(null);
      setEditTitle("");
      setEditUrl("");
      setEditDescription("");
      setEditCategory("");
      setEditTags("");
      setEditType("website");
      setEditCluster("");
    }
  };

  const handleProgressChange = async (id, progress) => {
    if (currentUser) {
      const resourceRef = doc(db, "users", currentUser.uid, "resources", id);
      await updateDoc(resourceRef, { progress });
    }
  };

  const handleResourceClick = (resource) => {
    setSelectedResource(resource);
  };

  const handleCloseViewer = () => {
    setSelectedResource(null);
  };

  const ResourceItem = ({ resource }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: "resource",
      item: { id: resource.id },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }));

    const [notes, setNotes] = useState(resource.notes || "");

    const handleNotesChange = async (e) => {
      setNotes(e.target.value);
      if (currentUser) {
        const resourceRef = doc(
          db,
          "users",
          currentUser.uid,
          "resources",
          resource.id
        );
        await updateDoc(resourceRef, { notes: e.target.value });
      }
    };

    return (
      <div
        ref={drag}
        className={`bg-white w-md flex flex-col gap-3 dark:bg-gray-800 p-4 rounded-lg shadow-md mb-4 hover:shadow-xl transition-shadow duration-200 resource-item  ${
          isDragging ? "opacity-50" : ""
        } `}
      >
        <h3 className="text-xl  font-semibold mb-2 text-gray-900 dark:text-white cursor-pointer hover:underline">
          {resource.title}
        </h3>
        <p className="text-gray-700 dark:text-gray-300 mb-1 overflow-clip line-clamp-2 w-full">
          <span className="font-medium">URL:</span>{" "}
          <a
            href="#"
            onClick={() => openResource(resource.url)}
            className="text-blue-500 hover:text-blue-700 overflow-hidden "
          >
            {resource.url}
          </a>
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-1">
          <span className="font-medium">Description:</span>{" "}
          {resource.description}
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-1">
          <span className="font-medium">Category:</span> {resource.category}
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-1">
          <span className="font-medium">Tags:</span> {resource.tags.join(", ")}
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-2">
          <span className="font-medium">Progress:</span> {resource.progress}
        </p>
        <textarea
          value={notes}
          onChange={handleNotesChange}
          placeholder="Add notes or summaries here..."
          className="border p-2 rounded text-gray-800 dark:text-white dark:bg-gray-600 w-full h-32 mb-2"
        />
        <div className="flex gap-2 mt-2 justify-between items-center">
          <button
            onClick={() =>
              handleProgressChange(
                resource.id,
                resource.progress === "Not Started"
                  ? "In Progress"
                  : resource.progress === "In Progress"
                  ? "Completed"
                  : "Not Started"
              )
            }
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            {resource.progress === "Not Started"
              ? "Start"
              : resource.progress === "In Progress"
              ? "Complete"
              : "Restart"}
          </button>
          <button
            onClick={() => handleEdit(resource)}
            className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(resource.id)}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        Resources
      </h2>

      {Object.entries(clusters).map(([clusterId, cluster]) => (
        <ResourceCluster
          key={clusterId}
          id={clusterId}
          name={cluster?.name || "Default"}
          currentUser={currentUser}
        >
          <div className="flex flex-wrap gap-4 flex-row">
            {cluster &&
              Array.isArray(cluster?.resources) &&
              filteredResources
                .filter((resource) => resource.clusterId === clusterId)
                .map((resource) => (
                  <ResourceItem key={resource.id} resource={resource} />
                ))}
          </div>
        </ResourceCluster>
      ))}
      {editId && (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-500 bg-opacity-75 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              Edit Resource
            </h3>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="border p-2 rounded w-full text-gray-800 dark:text-white dark:bg-gray-700"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                  URL
                </label>
                <input
                  type="text"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="border p-2 rounded w-full text-gray-800 dark:text-white dark:bg-gray-700"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="border p-2 rounded w-full text-gray-800 dark:text-white dark:bg-gray-700"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="border p-2 rounded w-full text-gray-800 dark:text-white dark:bg-gray-700"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="border p-2 rounded w-full text-gray-800 dark:text-white dark:bg-gray-700"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                  Type
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="border p-2 rounded w-full text-gray-800 dark:text-white dark:bg-gray-700"
                >
                  <option value="website">Website</option>
                  <option value="video">Video</option>
                  <option value="article">Article</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                  Cluster
                </label>
                <select
                  value={editCluster}
                  onChange={(e) => setEditCluster(e.target.value)}
                  className="border p-2 rounded w-full text-gray-800 dark:text-white dark:bg-gray-700"
                >
                  <option value="default">Default</option>
                  {Object.keys(clusters).map((clusterId) => (
                    <option key={clusterId} value={clusterId}>
                      {clusters[clusterId].name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setEditId(null)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {selectedResource && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center">
          <div className="bg-white p-5">
            <ResourceViewer
              url={selectedResource.url}
              type={selectedResource.type}
            />
            <button onClick={handleCloseViewer}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Resources;
