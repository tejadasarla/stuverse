import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Page */}
        <Route path="/" element={<Auth />} />

        {/* Future routes (example) */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
