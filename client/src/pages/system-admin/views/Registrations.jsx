import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../../components/NavBar';
import Footer from '../../../components/Footer';
import Search from '../../../components/Search';
import FilterDropdown from '../../../components/FilterDropdown';
import Table from '../../../components/Table';
import Pagination from '../../../components/Pagination';
import styles from '../css/Registrations.module.css';

const Registrations = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);

    // Sample data
    const pendingCount = 5;

    const tableHeaders = ['Full Name', 'Role', 'Status', 'Action'];

    const [tableData, setTableData] = useState([
        { id: 1, fullName: 'Sarah Jones', email: 'sarah.jones@example.com', role: 'Research Admin', status: 'Approved', enabled: true },
        { id: 2, fullName: 'James Allen', email: 'james.allen@example.com', role: 'Research Admin', status: 'Approved', enabled: false },
        { id: 3, fullName: 'Brandon Smith', email: 'brandon.smith@example.com', role: 'Research Admin', status: 'Approved', enabled: true },
        { id: 4, fullName: 'William King', email: 'william.king@example.com', role: 'Research Admin', status: 'Rejected', enabled: false },
        { id: 5, fullName: 'Emily Chen', email: 'emily.chen@example.com', role: 'Research Admin', status: 'Pending', enabled: false },
        { id: 6, fullName: 'Michael Brown', email: 'michael.brown@example.com', role: 'Research Admin', status: 'Pending', enabled: false },
    ]);

    const roleOptions = ['All', 'Research Admin'];
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

    const handleToggleEnabled = (id) => {
        setTableData((prev) => prev.map((row) => (row.id === id ? { ...row, enabled: !row.enabled } : row)));
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