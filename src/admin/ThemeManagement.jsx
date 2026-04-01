import React, { useState, useEffect } from 'react'
import { getBaseThemesByType, getCommunityThemes, deleteCommunityTheme } from '../services/themeService'
import { getCurrentUser } from '../services/auth'
import './css/styles.css'

export default function ThemeManagement() {
    const [activeTab, setActiveTab] = useState('community')
    const [communityThemes, setCommunityThemes] = useState([])
    const [baseThemes, setBaseThemes] = useState([])
    const [currentUser, setCurrentUser] = useState(null)
    const [message, setMessage] = useState('')

    useEffect(() => {
        loadThemes()
        setCurrentUser(getCurrentUser())
    }, [])

    const loadThemes = async () => {
        const community = await getCommunityThemes()
        setCommunityThemes(community)
        // Load base themes for all types (sync)
        const personal = getBaseThemesByType('personal')
        const vtree = getBaseThemesByType('vtree')
        const resume = getBaseThemesByType('resume')
        setBaseThemes([...personal, ...vtree, ...resume])
    }

    const handleDelete = async (themeId) => {
        if (window.confirm('Are you sure you want to delete this theme? This cannot be undone.')) {
            await deleteCommunityTheme(themeId)
            setMessage('Theme deleted successfully')
            await loadThemes()
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
                                <a className="nav-link" href="/admin/users">
                                    <div className="sb-nav-link-icon"><i className="fas fa-users"></i></div>
                                    Users
                                </a>
                                <a className="nav-link active" href="/admin/themes">
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
                            <h1 className="mt-4">Theme Management</h1>
                            <ol className="breadcrumb mb-4">
                                <li className="breadcrumb-item"><a href="/admin">Dashboard</a></li>
                                <li className="breadcrumb-item active">Themes</li>
                            </ol>

                            {message && <div className="alert alert-success alert-dismissible fade show" role="alert">
                                {message}
                                <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                            </div>}

                            <div className="card mb-4">
                                <div className="card-header">
                                    <ul className="nav nav-tabs card-header-tabs">
                                        <li className="nav-item">
                                            <button
                                                className={`nav-link ${activeTab === 'community' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('community')}
                                            >
                                                Community Themes ({communityThemes.length})
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button
                                                className={`nav-link ${activeTab === 'base' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('base')}
                                            >
                                                Built-in Themes ({baseThemes.length})
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        {(activeTab === 'community' ? communityThemes : baseThemes).map(theme => (
                                            <div key={theme.id} className="col-md-6 col-lg-4 mb-4">
                                                <div className="card h-100">
                                                    <div
                                                        className="card-img-top"
                                                        style={{
                                                            height: '120px',
                                                            background: theme.preview?.value || '#eee',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <span className="badge bg-dark opacity-75">{theme.profileType}</span>
                                                    </div>
                                                    <div className="card-body">
                                                        <h5 className="card-title">{theme.name}</h5>
                                                        <p className="card-text small text-muted">
                                                            By: {theme.author}<br />
                                                            Uses: {theme.stats?.uses || 0}
                                                        </p>
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            {activeTab === 'community' && (
                                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(theme.id)}>
                                                                    Delete
                                                                </button>
                                                            )}
                                                            {activeTab === 'base' && (
                                                                <span className="badge bg-secondary">Protected</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {(activeTab === 'community' && communityThemes.length === 0) && (
                                            <div className="col-12 text-center py-5 text-muted">
                                                No community themes found.
                                            </div>
                                        )}
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
