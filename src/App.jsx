import { Navigate, Route, Routes } from "react-router-dom";
import Frame from "./components/Frame.jsx";
import Account from "./pages/Account.jsx";
import Board from "./pages/Board.jsx";
import Create from "./pages/Create.jsx";
import Docs from "./pages/Docs.jsx";
import Raid from "./pages/Raid.jsx";

export default function App() {
  return (
    <Frame>
      <Routes>
        <Route path="/" element={<Board />} />
        <Route path="/raid/:id" element={<Raid />} />
        <Route path="/new" element={<Create />} />
        <Route path="/account" element={<Account />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Frame>
  );
}
