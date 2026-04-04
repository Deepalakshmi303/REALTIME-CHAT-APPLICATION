import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import { Toaster } from "react-hot-toast"
import { AuthContext } from './context/AuthContext'

const App = () => {
    const { authUser, isCheckingAuth } = useContext(AuthContext)

    if (isCheckingAuth) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="bg-[url('./src/assets/bgImage.svg')] bg-contain min-h-screen">
            <Toaster />
            <Routes>
                <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/login" />} />
                <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
                <Route path='/forgot-password' element={<ForgotPasswordPage />} />
                <Route path='/profile' element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
            </Routes>
        </div>
    )
}

export default App

