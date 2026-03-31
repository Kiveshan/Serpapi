import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../../components/NavBar';
import Footer from '../../../components/Footer';
import Search from '../../../components/Search';
import FilterDropdown from '../../../components/FilterDropdown';
import Table from '../../../components/Table';
import Pagination from '../../../components/Pagination';
import styles from '../css/Registrations.module.css';
import { authAPI } from '../../../api/auth/auth';
import { applicationsAPI } from '../../../api/systemadmin/applications';

const Registrations = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dataLoading, setDataLoading] = useState(false);
    const [applications, setApplications] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);

    // Check authentication and System Admin role
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = authAPI.getToken();
                if (!token) {
                    navigate('/login');
                    return;
                }

                const user = await authAPI.getProfile(token);
                
                // Check if user is System Admin (roleid = 1)
                if (user.roleid !== 1) {
                    navigate('/search');
                    return;
                }

                // Fetch applications data
                await fetchApplicationsData();
                setLoading(false);
            } catch (err) {
                setError('Failed to authenticate. Please login again.');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        };

        checkAuth();
    }, [navigate]);

    // Fetch applications data
    const fetchApplicationsData = async () => {
        try {
            setDataLoading(true);
            const data = await applicationsAPI.getAllApplications();
            setApplications(data.applications);
            setPendingCount(data.pendingCount);
        } catch (err) {
            setError('Failed to load applications. Please refresh the page.');
        } finally {
            setDataLoading(false);
        }
    };

    const tableHeaders = ['Full Name', 'Role', 'Status', 'Action'];

    // Transform data for table
    const tableData = applications.map((app) => ({
        id: app.userid,
        fullName: app.fullname,
        email: app.institutionemail,
        role: app.rolename,
        status: app.status,
        enabled: app.enabled
    }));

    // Get unique roles for filter options
    const uniqueRoles = [...new Set(applications.map(app => app.rolename))];
    const roleOptions = ['All', ...uniqueRoles];
    const statusOptions = ['All', 'Pending', 'Approved', 'Rejected'];

    const handleSearch = (term) => {
        setSearchTerm(term);
        setCurrentPage(1);
    };

    const handleRoleFilter = (role) => {
        setRoleFilter(role);
        setCurrentPage(1);
    };

    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleViewAction = (id) => {
        navigate(`/system-admin/registrations/${id}`);
    };

    const handleToggleEnabled = async (id) => {
        try {
            // Find the current application
            const currentApp = applications.find(app => app.userid === id);
            if (!currentApp) return;

            // Determine new status based on current enabled state
            const newStatus = currentApp.enabled ? 'rejected' : 'approved';
            const newEnabled = !currentApp.enabled;

            // Update via API
            await applicationsAPI.updateApplicationStatus(id, newStatus, newEnabled);

            // Refresh data
            await fetchApplicationsData();
        } catch (err) {
            setError('Failed to update application status. Please try again.');
        }
    };

    // Pagination logic
    const itemsPerPage = 4;
    
    // Filter logic
    const filteredData = tableData.filter((row) => {
        const matchesSearch = searchTerm === '' || 
            row.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesRole = roleFilter === 'All' || row.role === roleFilter;
        const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
        
        return matchesSearch && matchesRole && matchesStatus;
    });
    
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // Show loading state
    if (loading) {
        return (
            <div className={styles.page}>
                <NavBar />
                <main className={styles.main}>
                    <div className={styles.wrapper}>
                        <div className={styles.loadingCard}>
                            <div className={styles.loadingText}>Authenticating...</div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className={styles.page}>
                <NavBar />
                <main className={styles.main}>
                    <div className={styles.wrapper}>
                        <div className={styles.errorCard}>
                            <div className={styles.errorText}>{error}</div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <NavBar />

            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.titleSection}>
                            <h1 className={styles.title}>
                                Pending Registrations
                                <span className={styles.badge}>{pendingCount}</span>
                            </h1>
                            <p className={styles.description}>
                                Approve, or reject new user access requests to the system.
                            </p>
                        </div>
                    </div>

                    <div className={styles.container2}>
                        <div className={styles.controls}>
                            <Search
                                placeholder="Search by name or email."
                                onSearch={handleSearch}
                                className={styles.search}
                            />

                            <div className={styles.filters}>
                                <FilterDropdown
                                    label="Role"
                                    value={roleFilter}
                                    options={roleOptions}
                                    onChange={handleRoleFilter}
                                    className={styles.filter}
                                />

                                <FilterDropdown
                                    label="Status"
                                    value={statusFilter}
                                    options={statusOptions}
                                    onChange={handleStatusFilter}
                                    className={styles.filter}
                                />
                            </div>
                        </div>

                        <div className={styles.tableContainer}>
                            <Table
                                headers={tableHeaders}
                                data={paginatedData}
                                onAction={handleViewAction}
                                actionLabel="View"
                                showEnableToggle
                                onToggleEnabled={handleToggleEnabled}
                            />
                        </div>

                        <div className={styles.paginationContainer}>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Registrations;