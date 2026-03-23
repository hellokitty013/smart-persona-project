import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser, promoteUserToAdmin, getUsers, setSession } from '../services/auth'

export default function AdminSetup() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    const res = await registerUser({ username, email, password })
    if (!res.ok) {
      // If user exists, try to promote and login
      const users = await getUsers()
      const found = users.find(u => u.username === username || u.email === email)
      if (found) {
        await promoteUserToAdmin(found.username)
        // Re-fetch users to get updated role
        const updatedUsers = await getUsers()
        const updatedUser = updatedUsers.find(u => u.username === found.username)
        setSession({ username: updatedUser.username, email: updatedUser.email, token: updatedUser.token, role: updatedUser.role })
        navigate('/admin')
        return
      }
      setError(res.message || 'Registration failed')
      return
    }

    // Promote to admin
    const ok = await promoteUserToAdmin(username)
    if (!ok) {
      setError('Could not promote user to admin')
      return
    }
    // Refresh users to get updated role and set session with role
    const updatedUsers = await getUsers()
    const newAdmin = updatedUsers.find(u => u.username === username)
    setSession({ username: newAdmin.username, email: newAdmin.email, token: newAdmin.token, role: newAdmin.role })
    setMessage('Admin user created successfully')
    navigate('/admin')
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h3 className="card-title mb-3">Create Admin User</h3>
              {message && <div className="alert alert-success">{message}</div>}
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input className="form-control" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <button className="btn btn-primary">Create Admin</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
