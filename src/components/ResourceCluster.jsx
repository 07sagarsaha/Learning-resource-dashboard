import React from "react";
import { useDrop } from "react-dnd";
import { db } from "../utils/firebase";
import {
  doc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

const ResourceCluster = ({ id, name, children, currentUser }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "resource",
    drop: async (item) => {
      console.log(`Dropped ${item.id} into cluster ${id}`);
      if (currentUser) {
        const resourceRef = doc(
          db,
          "users",
          currentUser.uid,
          "resources",
          item.id
        );
        await updateDoc(resourceRef, { clusterId: id });
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`cluster p-4 rounded-lg  mb-4  ${
        isOver ? "bg-blue-100 dark:bg-blue-900" : "bg-white dark:bg-gray-700"
      }`}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          <span className="flex items-center">{name}</span>
        </h3>
        <button
          onClick={async () => {
            // Delete cluster logic here
            console.log("Delete cluster", id);
            if (currentUser) {
              const clusterRef = doc(
                db,
                "users",
                currentUser.uid,
                "clusters",
                id
              );
              // Delete resources associated with the cluster
              const resourcesRef = collection(
                db,
                "users",
                currentUser.uid,
                "resources"
              );
              const q = query(resourcesRef, where("clusterId", "==", id));
              const querySnapshot = await getDocs(q);
              querySnapshot.forEach(async (doc) => {
                await deleteDoc(doc.ref);
              });
              // Delete the cluster itself
              await deleteDoc(clusterRef);
            }
          }}
          className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-700"
        >
          Delete
        </button>
      </div>
      {children}
    </div>
  );
};

export default ResourceCluster;
