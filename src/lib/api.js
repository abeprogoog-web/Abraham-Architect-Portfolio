import axios from "axios";
import { preOptimizeFiles } from "./imageOptimizer";

const DATA_BASE = `${import.meta.env.BASE_URL}data/`;

export const WORLDS = {
  anomaly: {
    key: "anomaly",
    index: "01",
    title: "Design Anomaly",
    titleLines: ["Design", "Anomaly"],
    path: "/anomaly",
    description:
      "Experimental architecture and spatial research. Structures, installations and fragments produced by subtraction, displacement, folding and collision.",
  },

  furniture: {
    key: "furniture",
    index: "02",
    title: "Design Furniture",
    titleLines: ["Design", "Furniture"],
    path: "/furniture",
    description:
      "Objects and furniture understood as small architecture. Each piece records a single design operation — peeling, compression, splitting — made legible in material.",
  },

  work: {
    key: "work",
    index: "03",
    title: "Work",
    titleLines: ["Design", "Work"],
    path: "/work",
    description:
      "Applied practice across supervision, building design and competition entries — where architectural ideas meet real briefs, sites and constraints.",
    categories: ["Supervisor", "Building Design", "Competition Design"],
  },
};

export const getToken = () => localStorage.getItem("editor_token");

export const setToken = (t) => localStorage.setItem("editor_token", t);

export const clearToken = () => localStorage.removeItem("editor_token");

export const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

/* =========================================================
   PUBLIC WEBSITE DATA
   These functions read static JSON files from /public/data/
   so GitHub Pages can serve the website without Express.
   ========================================================= */

export const fetchPublished = async (world) => {
  const response = await fetch(`${DATA_BASE}projects.json`);

  if (!response.ok) {
    throw new Error("Failed to load projects");
  }

  const data = await response.json();

  const projects = Array.isArray(data)
    ? data
    : Array.isArray(data.projects)
      ? data.projects
      : [];

  const published = projects.filter(
    (project) => project?.published !== false
  );

  const filtered = world
    ? published.filter((project) => project?.world === world)
    : published;

  return [...filtered].sort((a, b) => {
    const orderA = Number.isFinite(Number(a?.order))
      ? Number(a.order)
      : 999999;

    const orderB = Number.isFinite(Number(b?.order))
      ? Number(b.order)
      : 999999;

    return orderA - orderB;
  });
};

export const fetchProject = async (slug) => {
  const response = await fetch(`${DATA_BASE}projects.json`);

  if (!response.ok) {
    throw new Error("Failed to load projects");
  }

  const data = await response.json();

  const projects = Array.isArray(data)
    ? data
    : Array.isArray(data.projects)
      ? data.projects
      : [];

  const project = projects.find(
    (item) =>
      item?.slug === slug &&
      item?.published !== false
  );

  if (!project) {
    throw new Error("Project not found");
  }

  return project;
};

export const fetchAbout = async () => {
  const response = await fetch(`${DATA_BASE}about.json`);

  if (!response.ok) {
    throw new Error("Failed to load about data");
  }

  return response.json();
};

export const fetchHomeIntro = async () => {
  const response = await fetch(`${DATA_BASE}home-intro.json`);

  if (!response.ok) {
    throw new Error("Failed to load home intro");
  }

  return response.json();
};

/* =========================================================
   ADMIN / EDITOR API
   Keep these functions for the existing Express backend.
   ========================================================= */

const getBackendApi = () => {
  const backendUrl =
    typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_BACKEND_URL
      ? process.env.REACT_APP_BACKEND_URL
      : "";

  return backendUrl ? `${backendUrl}/api` : "/api";
};

/* =========================================================
   AUTH
   ========================================================= */

export const adminLogin = async (passcode) => {
  const API = getBackendApi();

  const { data } = await axios.post(`${API}/auth/login`, {
    passcode,
  });

  return data;
};

export const adminVerify = async () => {
  const API = getBackendApi();

  const { data } = await axios.get(
    `${API}/auth/verify`,
    authHeaders()
  );

  return data;
};

/* =========================================================
   ADMIN PROJECTS
   ========================================================= */

export const adminFetchAll = async () => {
  const API = getBackendApi();

  const { data } = await axios.get(
    `${API}/admin/projects`,
    authHeaders()
  );

  return data;
};

export const adminFetchBySlug = async (slug) => {
  const API = getBackendApi();

  const { data } = await axios.get(
    `${API}/admin/projects/by-slug/${slug}`,
    authHeaders()
  );

  return data;
};

export const adminCreate = async (payload) => {
  const API = getBackendApi();

  const { data } = await axios.post(
    `${API}/admin/projects`,
    payload,
    authHeaders()
  );

  return data;
};

export const adminUpdate = async (id, payload) => {
  const API = getBackendApi();

  const { data } = await axios.put(
    `${API}/admin/projects/${id}`,
    payload,
    authHeaders()
  );

  return data;
};

export const adminDelete = async (id) => {
  const API = getBackendApi();

  const { data } = await axios.delete(
    `${API}/admin/projects/${id}`,
    authHeaders()
  );

  return data;
};

export const adminReorder = async (ids) => {
  const API = getBackendApi();

  const { data } = await axios.post(
    `${API}/admin/projects/reorder`,
    { ids },
    authHeaders()
  );

  return data;
};

/* =========================================================
   ADMIN IMAGE UPLOAD
   ========================================================= */

export const adminUpload = async (files, onProgress) => {
  if (!files || !files.length) return [];

  const readyFiles = await preOptimizeFiles(files);

  const form = new FormData();

  for (const file of readyFiles) {
    form.append("files", file);
  }

  const API = getBackendApi();
  const headers = authHeaders();

  const { data } = await axios.post(
    `${API}/admin/uploads`,
    form,
    {
      ...headers,

      onUploadProgress: (progressEvent) => {
        if (
          onProgress &&
          progressEvent.total
        ) {
          const percent = Math.round(
            (progressEvent.loaded * 100) /
              progressEvent.total
          );

          onProgress(percent);
        }
      },
    }
  );

  if (
    !data ||
    !Array.isArray(data.urls)
  ) {
    throw new Error(
      data?.detail ||
        "Server failed to return image URLs"
    );
  }

  return data.urls;
};

/* =========================================================
   ADMIN ABOUT
   ========================================================= */

export const adminUpdateAbout = async (payload) => {
  const API = getBackendApi();

  const { data } = await axios.put(
    `${API}/admin/about`,
    payload,
    authHeaders()
  );

  return data;
};

export const adminChangePasscode = async (
  current_passcode,
  new_passcode
) => {
  const API = getBackendApi();

  const { data } = await axios.post(
    `${API}/admin/change-passcode`,
    {
      current_passcode,
      new_passcode,
    },
    authHeaders()
  );

  return data;
};

/* =========================================================
   ADMIN HOME INTRO
   ========================================================= */

export const adminUpdateHomeIntro = async (
  payload
) => {
  const API = getBackendApi();

  const body =
    typeof payload === "string"
      ? { bg_image: payload }
      : payload;

  const { data } = await axios.put(
    `${API}/admin/home-intro`,
    body,
    authHeaders()
  );

  return data;
};

/* =========================================================
   ADMIN SYNC
   ========================================================= */

export const adminSyncToCode = async () => {
  const API = getBackendApi();

  const { data } = await axios.post(
    `${API}/admin/sync-code`,
    {},
    authHeaders()
  );

  return data;
};

/* =========================================================
   HELPERS
   ========================================================= */

export const pad = (n) =>
  String(n + 1).padStart(2, "0");
