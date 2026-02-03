"use client";

import React, { useState } from 'react';
import { 
User,
Mail,
Eye,
EyeOff,
LogIn,
UserPlus,
Gamepad2,
Lock,
Github,
Chrome
} from 'lucide-react';

const LoginPage = ({ onLogin }) => {
const [loginMode, setLoginMode] = useState('login'); // 'login' or 'register'
const [loginForm, setLoginForm] = useState({
email: '',
password: '',
username: '',
fullName: '',
confirmPassword: ''
});
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [loginError, setLoginError] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [selectedAvatar, setSelectedAvatar] = useState(0);
const [showAvatarPicker, setShowAvatarPicker] = useState(false);

const avatars = [
"https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4",
"https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede",
"https://api.dicebear.com/7.x/avataaars/svg?seed=Mittens&backgroundColor=d1d4f9",
"https://api.dicebear.com/7.x/avataaars/svg?seed=Fluffy&backgroundColor=ffd93d",
"https://api.dicebear.com/7.x/avataaars/svg?seed=Snickers&backgroundColor=ffb3ba",
"https://api.dicebear.com/7.x/avataaars/svg?seed=Princess&backgroundColor=bae1ff",
"https://api.dicebear.com/7.x/avataaars/svg?seed=Smokey&backgroundColor=caffbf",
"https://api.dicebear.com/7.x/avataaars/svg?seed=Bandit&backgroundColor=a8dadc",
"https://api.dicebear.com/7.x/avataaars/svg?seed=Oreo&backgroundColor=f1faee",
"https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow&backgroundColor=e9c46a",
"https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky&backgroundColor=f4a261",
"https://api.dicebear.com/7.x/avataaars/svg?seed=Max&backgroundColor=e76f51",
"https://api.dicebear.com/7.x/avataaars/svg?seed=Bella&backgroundColor=264653",
"https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie&backgroundColor=2a9d8f",
"https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&backgroundColor=457b9d",
"https://api.dicebear.com/7.x/avataaars/svg?seed=Cooper&backgroundColor=1d3557",
"https://api.dicebear.com/7.x/avataaars/svg?seed=Daisy&backgroundColor=f72585",
"https://api.dicebear.com/7.x/avataaars/svg?seed=Rocky&backgroundColor=b5179e"
];

const handleAvatarSelect = (index) => {
setSelectedAvatar(index);
setShowAvatarPicker(false);
};

const handleRandomAvatar = () => {
const randomIndex = Math.floor(Math.random() * avatars.length);
setSelectedAvatar(randomIndex);
setShowAvatarPicker(false);
};

const handleSocialLogin = (provider) => {
setIsLoading(true);
setTimeout(() => {
// Simulate social login
onLogin(`user_${provider}_${Date.now()}`);
setIsLoading(false);
}, 1500);
};

const handleLogin = async (e) => {
e.preventDefault();
setIsLoading(true);
setLoginError('');

// Simulate API call
setTimeout(() => {
if (loginMode === 'login') {
// Simple validation for demo
if (!loginForm.email || !loginForm.password) {
setLoginError('Please fill in all fields');
setIsLoading(false);
return;
}

// Mock login - in real app, this would be an API call
if (loginForm.email === 'zbakkas@example.com' && loginForm.password === 'password') {
onLogin('zbakkas');
} else {
// For demo purposes, allow any email/password
const username = loginForm.email.split('@')[0];
onLogin(username);
}
} else if (loginMode === 'register') {
// Registration validation
if (!loginForm.email || !loginForm.password || !loginForm.username || !loginForm.fullName || !loginForm.confirmPassword) {
setLoginError('Please fill in all fields');
setIsLoading(false);
return;
}

if (loginForm.password !== loginForm.confirmPassword) {
setLoginError('Passwords do not match');
setIsLoading(false);
return;
}

if (loginForm.password.length < 6) {
setLoginError('Password must be at least 6 characters');
setIsLoading(false);
return;
}

// Mock registration success
onLogin(loginForm.username);
}
setIsLoading(false);
}, 1500); // Simulate network delay
};

const resetLoginForm = () => {
setLoginForm({
email: '',
password: '',
username: '',
fullName: '',
confirmPassword: ''
});
setLoginError('');
};

const switchMode = () => {
setLoginMode(loginMode === 'login' ? 'register' : 'login');
resetLoginForm();
setShowPassword(false);
setShowConfirmPassword(false);
setShowAvatarPicker(false);
};

return (
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center py-6 px-4">
{/* Animated Background Elements */}
<div className="absolute inset-0 overflow-hidden">
<div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
<div className="absolute -bottom-4 -left-4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
</div>

<div className="relative max-w-md w-full">
{/* Logo/Header */}
<div className="text-center mb-8">
<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-2xl">
<Gamepad2 size={32} className="text-white" />
</div>
<h1 className="text-4xl font-bold text-white mb-2">Skyjo Online</h1>
<p className="text-blue-200">Join the ultimate card game experience</p>
</div>

{/* Login Form */}
<div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
<div className="flex items-center justify-center gap-4 mb-6">
<button
  onClick={() => loginMode !== 'login' && switchMode()}
  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
    loginMode === 'login'
      ? 'bg-blue-500 text-white shadow-lg'
      : 'text-blue-300 hover:bg-white/10'
  }`}
>
  <LogIn size={16} className="inline mr-2" />
  Login
</button>
<button
  onClick={() => loginMode !== 'register' && switchMode()}
  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
    loginMode === 'register'
      ? 'bg-green-500 text-white shadow-lg'
      : 'text-green-300 hover:bg-white/10'
  }`}
>
  <UserPlus size={16} className="inline mr-2" />
  Register
</button>
</div>

<div onSubmit={handleLogin} className="space-y-4">
{loginMode === 'register' && (
  <>
    

    {/* Username with Avatar */}
    <div>
      <label className="block text-blue-200 mb-2 text-sm font-medium">
        Username & Avatar
      </label>
      <div className="flex gap-3">
        {/* Avatar Selection */}
        <div className="relative">
          <div 
            className="w-12 h-12 bg-white/10 border border-white/30 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all hover:scale-105 overflow-hidden"
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
          >
            <img 
              src={avatars[selectedAvatar]} 
              alt="Avatar" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          
          {/* Avatar Picker Dropdown */}
          {showAvatarPicker && (
            <div className="absolute top-14 left-0 z-50 bg-gray-800/95 backdrop-blur-sm border border-white/30 rounded-lg p-3 shadow-2xl min-w-max">
              <div className="grid grid-cols-6 gap-2 mb-2">
                {avatars.map((avatar, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleAvatarSelect(index)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden hover:bg-white/20 transition-all border-2 ${
                      selectedAvatar === index ? 'border-blue-500 scale-110' : 'border-white/30'
                    }`}
                  >
                    <img 
                      src={avatar} 
                      alt={`Avatar ${index + 1}`} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  </button>
                ))}
              </div>
              <button 
                type="button"
                onClick={handleRandomAvatar}
                className="w-full text-xs text-blue-300 hover:text-white bg-white/10 hover:bg-white/20 rounded px-2 py-1 transition-colors"
              >
                🎲 Random
              </button>
            </div>
          )}
        </div>
        
        <div className="relative flex-1">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" size={16} />
          <input
            type="text"
            value={loginForm.username}
            onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
            placeholder="Enter your username"
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>
    </div>

    {/* Full Name Field */}
    <div>
      <label className="block text-blue-200 mb-2 text-sm font-medium">
        Full Name
      </label>
      <div className="relative">
        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" size={16} />
        <input
          type="text"
          value={loginForm.fullName}
          onChange={(e) => setLoginForm(prev => ({ ...prev, fullName: e.target.value }))}
          placeholder="Enter your full name"
          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
        />
      </div>
    </div>
  </>
)}

{loginMode === 'login' && (
  <div>
    <label className="block text-blue-200 mb-2 text-sm font-medium">
      Email or Username
    </label>
    <div className="relative">
      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" size={16} />
      <input
        type="text"
        value={loginForm.email}
        onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
        placeholder="Enter your email or username"
        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
      />
    </div>
  </div>
)}

<div>
  <label className="block text-blue-200 mb-2 text-sm font-medium">
    Password
  </label>
  <div className="relative">
    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" size={16} />
    <input
      type={showPassword ? 'text' : 'password'}
      value={loginForm.password}
      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
      placeholder="Enter your password"
      className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-blue-200 transition-colors"
    >
      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  </div>
</div>

{loginMode === 'register' && (
  <div>
    <label className="block text-blue-200 mb-2 text-sm font-medium">
      Confirm Password
    </label>
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" size={16} />
      <input
        type={showConfirmPassword ? 'text' : 'password'}
        value={loginForm.confirmPassword}
        onChange={(e) => setLoginForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
        placeholder="Confirm your password"
        className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
      />
      <button
        type="button"
        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-blue-200 transition-colors"
      >
        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  </div>
)}

{loginError && (
  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
    <p className="text-red-300 text-sm text-center">{loginError}</p>
  </div>
)}

<button
  type="button"
  onClick={handleLogin}
  disabled={isLoading}
  className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
    loginMode === 'login'
      ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
  } ${isLoading ? 'animate-pulse' : ''}`}
>
  {isLoading ? (
    <div className="flex items-center justify-center gap-2">
      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      {loginMode === 'login' ? 'Signing In...' : 'Creating Account...'}
    </div>
  ) : (
    <>
      {loginMode === 'login' ? (
        <>
          <LogIn size={16} className="inline mr-2" />
          Sign In
        </>
      ) : (
        <>
          <UserPlus size={16} className="inline mr-2" />
          Create Account
        </>
      )}
    </>
  )}
</button>
</div>

{/* Social Login Options */}
<div className="mt-6">
<div className="relative">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-white/30"></div>
  </div>
  <div className="relative flex justify-center text-sm">
    <span className="px-2 bg-white/10 text-blue-200 rounded">Or continue with</span>
  </div>
</div>

<div className="mt-4 grid grid-cols-2 gap-3">
  <button
    type="button"
    onClick={() => handleSocialLogin('google')}
    disabled={isLoading}
    className="flex items-center justify-center px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
  >
    <Chrome size={16} className="mr-2" />
    Google
  </button>
  
  <button
    type="button"
    onClick={() => handleSocialLogin('github')}
    disabled={isLoading}
    className="flex items-center justify-center px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
  >
    <Github size={16} className="mr-2" />
    GitHub
  </button>
</div>
</div>

{loginMode === 'login' && (
<div className="mt-4 text-center">
  <button className="text-blue-300 hover:text-blue-200 text-sm transition-colors">
    Forgot Password?
  </button>
</div>
)}

<div className="mt-6 text-center">
<p className="text-blue-200 text-sm">
  {loginMode === 'login' ? "Don't have an account? " : "Already have an account? "}
  <button
    onClick={switchMode}
    className="text-white font-semibold hover:underline transition-all duration-200"
  >
    {loginMode === 'login' ? 'Register here' : 'Login here'}
  </button>
</p>
</div>

{/* Demo Credentials */}
<div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
<p className="text-blue-200 text-xs text-center mb-2">Demo Credentials:</p>
<p className="text-white text-xs text-center">Email: zbakkas@example.com</p>
<p className="text-white text-xs text-center">Password: password</p>
<p className="text-blue-200 text-xs text-center mt-1">(or register with any email)</p>
</div>
</div>

{/* Footer */}
<div className="text-center mt-8">
<p className="text-blue-300 text-sm">
© 2025 Skyjo Online. Play responsibly.
</p>
</div>
</div>
</div>
);
};

export default LoginPage;