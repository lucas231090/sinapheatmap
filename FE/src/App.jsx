import { Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import FilePage from "./pages/FilePage/FilePage";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<FilePage />} />
      </Routes>
    </>
  );
}

export default App;
