import './App.css';
import InputSection from './InputSection/InputSection';
import Eyeheatmap from './EyeHeatmap/EyeHeatmap';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import Header from './Header/Header';
import Modal from 'react-modal';
import HeatVideo from './HeatVideo/HeatVideo'

// Código necessário para os recursos de acessibilidade
Modal.setAppElement('#root');

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Header />}>
            <Route index element={<InputSection />} />
            <Route path="/eyeheatmap/:id" element={<Eyeheatmap />} />
            <Route path="/heatvideo" element={<HeatVideo />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
