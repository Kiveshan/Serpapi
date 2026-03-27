import React, { useState } from 'react';
import NavBar from '../../../components/NavBar';
import Footer from '../../../components/Footer';
import Search from '../../../components/Search';
import FilterDropdown from '../../../components/FilterDropdown';
import Table from '../../../components/Table';
import Pagination from '../../../components/Pagination';
import styles from '../css/Registrations.module.css';

const Registrations = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('Pending');
    const [currentPage, setCurrentPage] = useState(2);

    // Sample data
    const pendingCount = 5;

    const tableHeaders = ['Full Name', 'Role', 'Status', 'Action'];

    const tableData = [
        { id: 1, fullName: 'Sarah Jones', role: 'Research Admin', status: 'Pending' },
        { id: 2, fullName: 'James Allen', role: 'Research Admin', status: 'Pending' },
        { id: 3, fullName: 'Brandon Smith', role: 'Research Admin', status: 'Pending' },
        { id: 4, fullName: 'William King', role: 'Research Admin', status: 'Pending' },
    ];

    const roleOptions = ['All', 'Research Admin'];
    const statusOptions = ['Pending', 'Approved', 'Rejected'];

    const handleSearch = (term) => {
        setSearchTerm(term);
    };

    const handleRoleFilter = (role) => {
        setRoleFilter(role);
    };

    const handleStatusFilter = (status) => {
        setStatusFilter(status);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleViewAction = (id) => {
        console.log('View registration:', id);
    };

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
                                data={tableData}
                                onAction={handleViewAction}
                                actionLabel="View"
                            />
                        </div>

                        <div className={styles.paginationContainer}>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={11}
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