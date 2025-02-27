import { Link, useLocation } from "react-router-dom"
import { HomeIcon, UserIcon } from "@heroicons/react/24/outline"

function Layout({ children }) {
  const location = useLocation()

  return (
    <div className="flex h-screen bg-[#0F172A]">
      {/* Sidebar - Always Visible */}
      <aside className="w-64 h-full fixed bg-[#111834] shadow-lg border-r border-[#1E293B] flex flex-col shadow-blue-900/20">
        <div className="px-6 py-6 border-b border-[#1E293B]">
          <h2 className="text-2xl font-bold text-indigo-500 tracking-wide">VOXINSIGHT</h2>
        </div>
        
        {/* Navigation Links */}
        <nav className="mt-6 px-4 flex flex-col space-y-2">
          <Link
            to="/"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
              location.pathname === "/"
                ? "text-white bg-indigo-600 shadow-md"
                : "text-gray-400 hover:text-white hover:bg-indigo-600/20"
            }`}
          >
            <HomeIcon className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          <Link
            to="/profile"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
              location.pathname === "/profile"
                ? "text-white bg-indigo-600 shadow-md"
                : "text-gray-400 hover:text-white hover:bg-indigo-600/20"
            }`}
          >
            <UserIcon className="mr-3 h-5 w-5" />
            Profile
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-[#111827]">
          <div className="flex-1 w-full px-6 py-8 bg-[#111827]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
