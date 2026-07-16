import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/Layout/AppLayout";
import ArticleListPage from "./pages/ArticleListPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<ArticleListPage />} />
        <Route path="/feed/:feedId" element={<ArticleListPage />} />
        <Route path="/starred" element={<ArticleListPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
