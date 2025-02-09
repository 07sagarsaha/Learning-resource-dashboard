import React from "react";

function ResourceViewer({ url, type }) {
  if (!url) {
    return <div>No URL provided</div>;
  }

  if (type === "youtube" || type === "vimeo") {
    const videoId = url.split("/").pop();
    const embedUrl =
      type === "youtube"
        ? `https://www.youtube.com/embed/${videoId}`
        : `https://player.vimeo.com/video/${videoId}`;
    return (
      <iframe
        width="560"
        height="315"
        src={embedUrl}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
    );
  }

  if (type === "pdf" || type === "article" || type === "website") {
    return (
      <iframe
        src={url}
        className="w-full h-[500px]"
        title="Resource Viewer"
      ></iframe>
    );
  }

  return <div>Unsupported resource type</div>;
}

export default ResourceViewer;
