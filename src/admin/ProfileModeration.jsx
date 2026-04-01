import React, { useState, useEffect } from 'react'
import { getAllProfiles, updateProfile } from '../services/profileManager'
import { getCurrentUser } from '../services/auth'
import './css/styles.css'

export default function ProfileModeration() {
    const [personalProfiles, setPersonalProfiles] = useState([])
    const [currentUser, setCurrentUser] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [message, setMessage] = useState('')

    useEffect(() => {
        loadProfiles()
        setCurrentUser(getCurrentUser())
    }, [])

    const loadProfiles = async () => {
        setPersonalProfiles(await getAllProfiles())
    }

    const handleToggleVisibility = async (profile) => {
        const newStatus = !profile.data.isPublic
        await updateProfile(profile.id, { isPublic: newStatus })
        setMessage(`Profile visibility updated to ${newStatus ? 'Public' : 'Private'}`)
        await loadProfiles()
    }

    const filteredProfiles = personalProfiles.filter(p => {
        const name = p.data?.displayName || p.name || ''
        const username = p.username || p.data?.username || ''
        const type = p.type || ''
        const search = searchTerm.toLowerCase()
        return name.toLowerCase().includes(search) ||
            username.toLowerCase().includes(search) ||
            type.toLowerCase().includes(search)
    })

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
                                <a className="nav-link" href="/admin/users">
                                    <div className="sb-nav-link-icon"><i className="fas fa-users"></i></div>
                                    Users
                                </a>
                                <a className="nav-link" href="/admin/themes">
                                    <div className="sb-nav-link-icon"><i className="fas fa-palette"></i></div>
                                    Themes
                                </a>
                                <a className="nav-link active" href="/admin/profiles">
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
                            <h1 className="mt-4">Profile Moderation</h1>
                            <ol className="breadcrumb mb-4">
                                <li className="breadcrumb-item"><a href="/admin">Dashboard</a></li>
                                <li className="breadcrumb-item active">Profiles</li>
                            </ol>

                            {message && <div className="alert alert-success alert-dismissible fade show" role="alert">
                                {message}
                                <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                            </div>}

                            <div className="card mb-4">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <div>
                                        <i className="fas fa-id-card me-1"></i>
                                        All Profiles
                                    </div>
                                    <div className="input-group" style={{ maxWidth: '300px' }}>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="Search profiles..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive">
                                        <table className="table table-bordered table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Username</th>
                                                    <th>Type</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredProfiles.map(profile => (
                                                    <tr key={profile.id}>
                                                        <td>{profile.data?.displayName || profile.name || 'Untitled'}</td>
                                                        <td>{profile.username || profile.data?.username || '-'}</td>
                                                        <td>
                                                            <span className="badge bg-info text-dark">
                                                                {profile.type || 'personal'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {profile.data?.isPublic ? (
                                                                <span className="badge bg-success">Public</span>
                                                            ) : (
                                                                <span className="badge bg-secondary">Private</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className="btn-group">
                                                                <a
                                                                    href={`/u/${profile.data?.username || 'user'}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="btn btn-sm btn-outline-primary"
                                                                >
                                                                    View
                                                                </a>
                                                                <button
                                                                    className={`btn btn-sm ${profile.data?.isPublic ? 'btn-warning' : 'btn-success'}`}
                                                                    onClick={() => handleToggleVisibility(profile)}
                                                                >
                                                                    {profile.data?.isPublic ? 'Hide' : 'Show'}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredProfiles.length === 0 && (
                                                    <tr>
                                                        <td colSpan="5" className="text-center">No profiles found</td>
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
        </div>
    )
}
