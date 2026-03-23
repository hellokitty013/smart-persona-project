import React, { useState, useEffect } from 'react'
import { getUsers, deleteUser, promoteUserToAdmin, demoteAdminToUser, getCurrentUser, impersonateUser, updateUser } from '../services/auth'
import './css/styles.css'

export default function UserManagement() {
    const [users, setUsers] = useState([])
    const [currentUser, setCurrentUser] = useState(null)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    // Edit Modal State
    const [editingUser, setEditingUser] = useState(null)
    const [editFormData, setEditFormData] = useState({ firstName: '', lastName: '', email: '', role: 'user' })

    useEffect(() => {
        loadUsers()
        setCurrentUser(getCurrentUser())
    }, [])

    const loadUsers = async () => {
        setUsers(await getUsers())
    }

    const handleDelete = async (username) => {
        if (window.confirm(`Are you sure you want to delete user ${username}?`)) {
            if (await deleteUser(username)) {
                setMessage(`User ${username} deleted successfully`)
                loadUsers()
            } else {
                setError('Failed to delete user')
            }
        }
    }

    const handlePromote = async (username) => {
        if (await promoteUserToAdmin(username)) {
            setMessage(`User ${username} promoted to admin`)
            loadUsers()
        } else {
            setError('Failed to promote user')
        }
    }

    const handleDemote = async (username) => {
        if (await demoteAdminToUser(username)) {
            setMessage(`User ${username} demoted to user`)
            loadUsers()
        } else {
            setError('Failed to demote user')
        }
    }

    const handleResetPassword = async (username) => {
        const newPass = 'password123'
        const allUsers = await getUsers()
        const idx = allUsers.findIndex(u => u.username === username)
        if (idx !== -1) {
            allUsers[idx].password = newPass
            localStorage.setItem('spa_users', JSON.stringify(allUsers))
            setMessage(`Password for ${username} reset to: ${newPass}`)
        } else {
            setError('User not found')
        }
    }



    const handleEditClick = (user) => {
        setEditingUser(user)
        setEditFormData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            role: user.role || 'user'
        })
    }

    const handleEditSave = async () => {
        if (await updateUser(editingUser.username, editFormData)) {
            setMessage(`User ${editingUser.username} updated successfully`)
            setEditingUser(null)
            loadUsers()
        } else {
            setError('Failed to update user')
        }
    }

    return (
        <div className="sb-nav-fixed">
            <nav className="sb-topnav navbar navbar-expand navbar-light bg-white border-bottom">
                <a className="navbar-brand ps-3 vere-brand" href="/admin">Vere Admin</a>
                <div className="ms-auto me-3">
                    <a className="btn btn-outline-primary btn-sm" href="/">Home</a>
                </div>
            </nav>

            <div id="layoutSidenav">
                <div id="layoutSidenav_nav">
                    <nav className="sb-sidenav accordion sb-sidenav-light" id="sidenavAccordion">
                        <div className="sb-sidenav-menu">
                            <div className="nav">
                                <div className="sb-sidenav-menu-heading">Core</div>
                                <a className="nav-link" href="/admin">
                                    <div className="sb-nav-link-icon"><i className="fas fa-tachometer-alt"></i></div>
                                    Dashboard
                                </a>
                                <div className="sb-sidenav-menu-heading">Management</div>
                                <a className="nav-link active" href="/admin/users">
                                    <div className="sb-nav-link-icon"><i className="fas fa-users"></i></div>
                                    Users
                                </a>
                                <a className="nav-link" href="/admin/themes">
                                    <div className="sb-nav-link-icon"><i className="fas fa-palette"></i></div>
                                    Themes
                                </a>
                                <a className="nav-link" href="/admin/profiles">
                                    <div className="sb-nav-link-icon"><i className="fas fa-id-card"></i></div>
                                    Profiles
                                </a>
                                <a className="nav-link" href="/admin/reports">
                                    <div className="sb-nav-link-icon"><i className="fas fa-flag"></i></div>
                                    Reports
                                </a>
                            </div>
                        </div>
                        <div className="sb-sidenav-footer">
                            <div className="small">Logged in as:</div>
                            {currentUser?.username}
                        </div>
                    </nav>
                </div>

                <div id="layoutSidenav_content">
                    <main>
                        <div className="container-fluid px-4">
                            <h1 className="mt-4">User Management</h1>
                            <ol className="breadcrumb mb-4">
                                <li className="breadcrumb-item"><a href="/admin">Dashboard</a></li>
                                <li className="breadcrumb-item active">Users</li>
                            </ol>

                            {message && <div className="alert alert-success alert-dismissible fade show" role="alert">
                                {message}
                                <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                            </div>}

                            {error && <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                {error}
                                <button type="button" className="btn-close" onClick={() => setError('')}></button>
                            </div>}

                            <div className="card mb-4">
                                <div className="card-header">
                                    <i className="fas fa-table me-1"></i>
                                    All Users
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-bordered table-striped">
                                            <thead>
                                                <tr>
                                                    <th>Username</th>
                                                    <th>Email</th>
                                                    <th>Role</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map(user => (
                                                    <tr key={user.username}>
                                                        <td>{user.username}</td>
                                                        <td>{user.email}</td>
                                                        <td>
                                                            <span className={`badge ${user.role === 'admin' ? 'bg-primary' : 'bg-secondary'}`}>
                                                                {user.role || 'user'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {user.username !== currentUser?.username && (
                                                                <div className="btn-group" role="group">

                                                                    <button
                                                                        className="btn btn-sm btn-outline-primary"
                                                                        onClick={() => handleEditClick(user)}
                                                                    >
                                                                        <i className="fas fa-edit"></i> Edit
                                                                    </button>
                                                                    {user.role !== 'admin' ? (
                                                                        <button className="btn btn-sm btn-success" onClick={() => handlePromote(user.username)}>
                                                                            Promote
                                                                        </button>
                                                                    ) : (
                                                                        <button className="btn btn-sm btn-warning" onClick={() => handleDemote(user.username)}>
                                                                            Demote
                                                                        </button>
                                                                    )}
                                                                    <button className="btn btn-sm btn-info text-white" onClick={() => handleResetPassword(user.username)}>
                                                                        Reset Pass
                                                                    </button>
                                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(user.username)}>
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                            {user.username === currentUser?.username && (
                                                                <span className="text-muted fst-italic">Current User</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {users.length === 0 && (
                                                    <tr>
                                                        <td colSpan="4" className="text-center">No users found</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Edit User: {editingUser.username}</h5>
                                <button type="button" className="btn-close" onClick={() => setEditingUser(null)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">First Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editFormData.firstName}
                                        onChange={e => setEditFormData({ ...editFormData, firstName: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Last Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editFormData.lastName}
                                        onChange={e => setEditFormData({ ...editFormData, lastName: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={editFormData.email}
                                        onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Role</label>
                                    <select
                                        className="form-select"
                                        value={editFormData.role}
                                        onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={handleEditSave}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
