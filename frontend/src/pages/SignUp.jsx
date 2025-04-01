"use client";

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function SignUp({ onSignUp }) {

  useEffect(()=>{
    setUsername('');
    setConfirmPassword("");
    setPassword("");
    setEmail("");
    setDuplicate(0);
  }, [])

  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const [duplicate, setDuplicate] = useState(0);

  const newUser = async(username, password) => {
    const data = {
      "username": username,
      "password": password
    }

    const user =  await fetch("http://localhost:3000/password/users", {
      method: "POST",  
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if(!user.ok) {
      console.log("Error posting data")
    }
  }

  const handleSubmit = async(e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    await newUser(username, password);
    onSignUp();
    if(duplicate){
      navigate('/signup')
    } else {
      navigate('/')
    }
  };

  const checkDuplicate = async(e) => {
    setDuplicate(0);
    setUsername(e);
    const response = await axios.get("http://localhost:3000/password/users");
    const userData = response.data;
    const user = userData.find((user) => user.username === e);
    if(user){
      setDuplicate(1);
    }

  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-lg p-10 rounded-2xl shadow-xl shadow-gray-900 border border-gray-700 transition-all duration-300">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold text-white tracking-wide">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Join us to get started
          </p>
        </div>
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => checkDuplicate(e.target.value)}
              />
            </div>
            {duplicate === 1 && <div className="redText">Username already exists</div>}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-gray-700 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-indigo-500/50"
            >
              Sign up
            </button>
          </div>

          <div className="text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-400 hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignUp; 