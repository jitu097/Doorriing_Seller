import React, { useState, useEffect } from 'react';
import { bookingService } from '../../services/bookingService';
import { shopService } from '../../services/shopService';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import './Booking.css';

function Booking() {
	const [bookings, setBookings] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filterStatus, setFilterStatus] = useState('');
	const [filterDate, setFilterDate] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [isBookingEnabled, setIsBookingEnabled] = useState(false);
	const [bookingToggleLoading, setBookingToggleLoading] = useState(false);

	useRealtimeSubscription('bookings', () => { setTimeout(fetchBookings, 0); });

	useEffect(() => {
		fetchBookings();
		fetchShopBookingStatus();
	}, [filterStatus, filterDate, currentPage]);

	const fetchShopBookingStatus = async () => {
		try {
			const shop = await shopService.getCurrentShop();
			if (shop) {
				setIsBookingEnabled(shop.is_booking_enabled === true);
			}
		} catch (error) {
			console.error('Failed to fetch shop booking status:', error);
		}
	};

	const fetchBookings = async () => {
		try {
			setLoading(true);
			const filters = {
				page: currentPage,
				limit: 20
			};

			if (filterStatus) {
				filters.status = filterStatus;
			}

			if (filterDate) {
				filters.date = filterDate;
			}


			const response = await bookingService.getBookings(filters);

			setBookings(response.bookings || []);
			setTotalPages(response.pagination?.totalPages || 1);

			if (!response.bookings || response.bookings.length === 0) {
				console.warn('⚠️ No bookings returned from API');
			}
		} catch (error) {
			console.error('❌ Failed to fetch bookings:', error);
			alert('Failed to load bookings. Please check console for details.');
		} finally {
			setLoading(false);
		}
	};

	const handleBookingToggle = async () => {
		try {
			setBookingToggleLoading(true);
			const newValue = !isBookingEnabled;
			await bookingService.toggleBookingStatus(newValue);
			setIsBookingEnabled(newValue);
		} catch (error) {
			console.error('Failed to toggle booking status:', error);
			alert('Failed to update booking settings. Please try again.');
		} finally {
			setBookingToggleLoading(false);
		}
	};

	const handleStatusUpdate = async (bookingId, newStatus) => {
		try {
			await bookingService.updateStatus(bookingId, newStatus);
			// Update local state
			setBookings(prev => prev.map(booking =>
				booking.id === bookingId ? { ...booking, status: newStatus } : booking
			));
		} catch (error) {
			console.error('Failed to update booking status:', error);
			alert('Failed to update booking status');
		}
	};

	const getStatusBadgeClass = (status) => {
		const statusMap = {
			'Pending': 'status-pending',
			'Confirmed': 'status-confirmed',
			'Cancelled': 'status-cancelled',
			'Completed': 'status-completed'
		};
		return statusMap[status] || 'status-default';
	};

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-IN', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	};

	const formatTime = (timeString) => {
		return timeString;
	};

	if (loading && bookings.length === 0) {
		return (
			<div className="bookings-container">
				<div className="loading">Loading bookings...</div>
			</div>
		);
	}

	return (
		<div className="bookings-container">
			<header className="bookings-header">
				<div className="header-content">
					<h1>Table Bookings</h1>
					<p>Manage your restaurant table reservations</p>
				</div>
				<div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff', padding: '0.8rem 1.2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
					<div style={{ display: 'flex', flexDirection: 'column' }}>
						<span style={{ fontWeight: '600', color: '#333' }}>Table Booking</span>
						<span style={{ fontSize: '0.85rem', color: isBookingEnabled ? '#4CAF50' : '#f44336' }}>
							{isBookingEnabled ? 'Enabled' : 'Disabled'}
						</span>
					</div>
					<label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px', margin: 0 }}>
						<input
							type="checkbox"
							checked={isBookingEnabled}
							onChange={handleBookingToggle}
							disabled={bookingToggleLoading}
							style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
						/>
						<span style={{
							position: 'absolute', cursor: bookingToggleLoading ? 'not-allowed' : 'pointer', top: 0, left: 0, right: 0, bottom: 0,
							backgroundColor: isBookingEnabled ? '#4CAF50' : '#ccc', transition: '.4s', borderRadius: '34px',
							opacity: bookingToggleLoading ? 0.7 : 1
						}}>
							<span style={{
								position: 'absolute', content: '""', height: '20px', width: '20px', left: '4px', bottom: '4px',
								backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
								transform: isBookingEnabled ? 'translateX(22px)' : 'translateX(0)'
							}}></span>
						</span>
					</label>
				</div>
			</header>

			{/* Filters */}
			<div className="bookings-filters">
				<div className="filter-group">
					<label>Status</label>
					<select
						value={filterStatus}
						onChange={(e) => {
							setFilterStatus(e.target.value);
							setCurrentPage(1);
						}}
					>
						<option value="">All Status</option>
						<option value="Pending">Pending</option>
						<option value="Confirmed">Confirmed</option>
						<option value="Cancelled">Cancelled</option>
						<option value="Completed">Completed</option>
					</select>
				</div>

				<div className="filter-group">
					<label>Date</label>
					<input
						type="date"
						value={filterDate}
						onChange={(e) => {
							setFilterDate(e.target.value);
							setCurrentPage(1);
						}}
					/>
				</div>
			</div>

			{/* Bookings Stats */}
			<div className="booking-stats">
				<div className="stat-item">
					<span className="stat-label">Total Bookings</span>
					<span className="stat-value">{bookings.length}</span>
				</div>
				<div className="stat-item">
					<span className="stat-label">Pending</span>
					<span className="stat-value">
						{bookings.filter(b => b.status === 'Pending').length}
					</span>
				</div>
				<div className="stat-item">
					<span className="stat-label">Confirmed</span>
					<span className="stat-value">
						{bookings.filter(b => b.status === 'Confirmed').length}
					</span>
				</div>
			</div>

			{/* Bookings List */}
			<div className="bookings-list">
				{bookings.length === 0 ? (
					<div className="empty-state">
						<div className="empty-icon">📅</div>
						<h3>No bookings found</h3>
						<p>No bookings match your current filters</p>
					</div>
				) : (
					<div className="bookings-grid">
						{bookings.map((booking) => (
							<div key={booking.id} className="booking-card">
								<div className="booking-card-header">
									<div className="booking-id">
										<span className="id-label">Booking #</span>
										<span className="id-value">{booking.id.substring(0, 8)}</span>
									</div>
									<span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
										{booking.status}
									</span>
								</div>

								<div className="booking-card-body">
									<div className="booking-info-row">
										<div className="info-item">
											<span className="info-icon">👤</span>
											<div className="info-content">
												<span className="info-label">Customer</span>
												<span className="info-value">{booking.customer_name}</span>
											</div>
										</div>
										<div className="info-item">
											<span className="info-icon">📞</span>
											<div className="info-content">
												<span className="info-label">Phone</span>
												<span className="info-value">{booking.customer_phone}</span>
											</div>
										</div>
									</div>

									<div className="booking-info-row">
										<div className="info-item">
											<span className="info-icon">📅</span>
											<div className="info-content">
												<span className="info-label">Date</span>
												<span className="info-value">{formatDate(booking.booking_date)}</span>
											</div>
										</div>
										<div className="info-item">
											<span className="info-icon">🕒</span>
											<div className="info-content">
												<span className="info-label">Time</span>
												<span className="info-value">{formatTime(booking.booking_time)}</span>
											</div>
										</div>
									</div>

									<div className="booking-info-row">
										<div className="info-item">
											<span className="info-icon">👥</span>
											<div className="info-content">
												<span className="info-label">Guests</span>
												<span className="info-value">{booking.number_of_guests} persons</span>
											</div>
										</div>
									</div>
								</div>

								<div className="booking-card-footer">
									{booking.status === 'Pending' && (
										<>
											<button
												className="action-btn confirm-btn"
												onClick={() => handleStatusUpdate(booking.id, 'Confirmed')}
											>
												✓ Confirm
											</button>
											<button
												className="action-btn cancel-btn"
												onClick={() => handleStatusUpdate(booking.id, 'Cancelled')}
											>
												✗ Cancel
											</button>
										</>
									)}
									{booking.status === 'Confirmed' && (
										<>
											<button
												className="action-btn complete-btn"
												onClick={() => handleStatusUpdate(booking.id, 'Completed')}
											>
												✓ Mark Completed
											</button>
											<button
												className="action-btn cancel-btn"
												onClick={() => handleStatusUpdate(booking.id, 'Cancelled')}
											>
												✗ Cancel
											</button>
										</>
									)}
									{(booking.status === 'Cancelled' || booking.status === 'Completed') && (
										<span className="booking-finalized">Booking {booking.status}</span>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="pagination">
					<button
						className="pagination-btn"
						disabled={currentPage === 1}
						onClick={() => setCurrentPage(prev => prev - 1)}
					>
						Previous
					</button>
					<span className="pagination-info">
						Page {currentPage} of {totalPages}
					</span>
					<button
						className="pagination-btn"
						disabled={currentPage === totalPages}
						onClick={() => setCurrentPage(prev => prev + 1)}
					>
						Next
					</button>
				</div>
			)}
		</div>
	);
}

export default Booking;
