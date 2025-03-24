"use client"

import React from "react"
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import SignUp from "./pages/SignUp"
import Home from "./pages/Home"
import Profile from "./pages/Profile"
import Layout from "./components/Layout"
import "./App.css" // Add this import

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleSignUp = () => {
    setIsLoggedIn(true)
  }

  return (
    <Router>
      <div className="  app-container">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<SignUp onSignUp={handleSignUp} />} />
          <Route
            path="/"
            element={
              isLoggedIn ? (
                <Layout>
                  <Home />
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