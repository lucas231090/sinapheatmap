import { Outlet } from "react-router-dom";
import backgroundImage from "../assets/backgroundImage.png";

export default function NUserLayout() {
  return (
    <div
      className="h-screen w-screen bg-cover bg-center fixed inset-0"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-[#00BED5] opacity-60 "></div>
      <div className="absolute inset-0 bg-black opacity-40 "></div>
      <main className="relative flex w-full h-full items-center justify-center overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
