"use client";

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios  from "axios";
import bcryptjs from "bcryptjs";
// require("dotenv").config();

function Login({ onLogin }) {

  useEffect(()=> {
    setUsername("");
    setPassword("");
    setIncorrectP(0);
    setIncorrectU(0)
  }, []);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [incorrectp, setIncorrectP] = useState(0);
  const [incorrectu, setIncorrectU] = useState(0);

  const navigate = useNavigate();

  const fetchData = async (username, password) => {
    try {
      const response = await axios.get("http://localhost:3000/password/users");
      if (!response.ok) {
        console.log("Network response was not ok");
      }
      const users = response.data;
      // console.log(users)
      
      const user = users.find((user) => user.username === username);
      // console.log(user)

      if(!user)
      {
        setIncorrectU(1);
      }

      const comparison = await bcryptjs.compare(password, user.password)
      if(comparison) {
        navigate("/")
      } else {
        setIncorrectP(1);
        
        navigate("/login");
      }


    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSubmit= async(e) => {
    e.preventDefault();
    
    await fetchData(username, password);
    onLogin();
    // navigate('/login')
  };

  
  
  


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-lg p-10 rounded-2xl shadow-xl shadow-gray-900 border border-gray-700 transition-all duration-300">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold text-white tracking-wide">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Please sign in to continue
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
                placeholder="Enter your username"
                value={username}
                onChange={(e) => {setUsername(e.target.value); setIncorrectU(0)}}
              />
            </div>
            {(incorrectu === 1) && <div className="redText">Invalid Username</div>}
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {setPassword(e.target.value); setIncorrectP(0)}}
              />
            </div>
            {incorrectp === 1 && <div className="redText">Incorrect Password</div>}
          </div>

          <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="form-checkbox text-indigo-500 bg-gray-800 border-gray-600 rounded focus:ring-indigo-400" />
              <span>Remember me</span>
            </label>
            <a href="#" className="text-indigo-400 hover:underline">
              Forgot password?
            </a>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-gray-700 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-indigo-500/50"
            >
              Sign in
            </button>
          </div>

          <div className="text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <Link to="/signup" className="text-indigo-400 hover:underline">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
