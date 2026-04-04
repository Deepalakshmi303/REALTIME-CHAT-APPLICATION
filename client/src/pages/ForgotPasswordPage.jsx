import React, { useState } from 'react'
import axios from '../lib/axios'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await axios.post("/api/auth/forgot-password", { email, password })
            if (res.data.success) {
                toast.success(res.data.message)
                navigate('/login')
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong")
        }
    }

    return (
        <div className='min-h-screen bg-cover bg-center flex items-center justify-center backdrop-blur-2xl'>
            <form onSubmit={handleSubmit} className='border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg w-[400px]'>
                <h2 className='font-medium text-2xl'>Reset Password</h2>
                <input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
                <input 
                    type="password" 
                    placeholder="Enter new password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    minLength={6}
                    className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
                <button type="submit" className='py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer'>
                    Reset Password
                </button>
                <p className='text-sm text-gray-600 cursor-pointer' onClick={() => navigate('/login')}>Back to Login</p>
            </form>
        </div>
    )
}

export default ForgotPasswordPage
