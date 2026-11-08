import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import UploadNote from "./pages/UploadNote.jsx";
import NoteDetail from "./pages/NoteDetail.jsx";
import QuizPlayer from "./pages/QuizPlayer.jsx";
import QuizResult from "./pages/QuizResult.jsx";
import Analytics from "./pages/Analytics.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Everything below requires login */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/upload" element={<UploadNote />} />
        <Route path="/notes/:id" element={<NoteDetail />} />
        <Route path="/quiz/:id" element={<QuizPlayer />} />
        <Route path="/result/:id" element={<QuizResult />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
