"use client"

import React from "react"
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Home_ from "./pages/Home"
import Profile from "./pages/Profile"
import Layout from "./components/Layout"
import "./App.css" // Add this import

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  return (
    <Router>
      <div className="  app-container">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route
            path="/"
            element={
              isLoggedIn ? (
                <Layout>
                  <Home_ />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/profile"
            element={
              isLoggedIn ? (
                <Layout>
                  <Profile />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App