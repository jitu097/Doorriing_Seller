import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import './Booking.css';
import { bookingService } from '../../services/bookingService';

const statusColors = {
	pending: '#f59e42',
	confirmed: '#22d06a',
	cancelled: '#dc2626',
	completed: '#3b82f6'
};

export default function Booking() {
	const [bookings, setBookings] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
	const [filter, setFilter] = useState('all');

	// Fetch bookings from backend
	useEffect(() => {
		fetchBookings();
	}, [selectedDate, filter]);

	const fetchBookings = async () => {
		try {
			setLoading(true);
			const filters = {};
			if (filter !== 'all') filters.status = filter;
			if (selectedDate) filters.date = selectedDate;
			
			const data = await bookingService.getBookings(filters);
			setBookings(data.bookings || data);
		} catch (error) {
			console.error('Failed to fetch bookings:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleStatusUpdate = async (bookingId, newStatus) => {
		try {
			await bookingService.updateStatus(bookingId, newStatus);
			fetchBookings();
		} catch (error) {
			console.error('Failed to update booking status:', error);
			alert('Failed to update booking status');
		}
	};
	
	const filteredBookings = bookings;

	if (loading) {
		return (
			<>
				<Navbar />
				<div className="booking-container">
					<div className="loading">Loading bookings...</div>
				</div>
			</>
		);
	}

	return (
		<>
			<Navbar />
			<div className="booking-container">
				<div className="booking-header">
					<div>
						<h1>📅 Table Bookings</h1>
						<p>Manage your restaurant reservations</p>
					</div>
					<button className="btn-new-booking">+ New Booking</button>
				</div>

				<div className="booking-filters">
					<input 
						type="date" 
						value={selectedDate} 
						onChange={(e) => setSelectedDate(e.target.value)}
						className="date-input"
					/>
					<select 
						value={filter} 
						onChange={(e) => setFilter(e.target.value)}
						className="status-filter"
					>
						<option value="all">All Status</option>
						<option value="Pending">Pending</option>
						<option value="Confirmed">Confirmed</option>
						<option value="Completed">Completed</option>
						<option value="Cancelled">Cancelled</option>
					</select>
				</div>

				<div className="bookings-grid">
					{filteredBookings.length === 0 ? (
						<div className="no-bookings">No bookings found</div>
					) : (
						filteredBookings.map((booking) => (
							<div key={booking.id} className="booking-card">
								<div className="booking-card-header">
									<div>
										<h3>{booking.customer_name}</h3>
										<span className="booking-id">#{booking.id?.substring(0, 8)}</span>
									</div>
									<span 
										className="status-badge" 
										style={{ backgroundColor: statusColors[booking.status] }}
									>
										{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
									</span>
								</div>
								
								<div className="booking-details">
									<div className="detail-row">
										<span className="detail-icon">📞</span>
										<span>{booking.phone}</span>
									</div>
									<div className="detail-row">
										<span className="detail-icon">👥</span>
										<span>{booking.party_size} People</span>
									</div>
									<div className="detail-row">
										<span className="detail-icon">📅</span>
										<span>{new Date(booking.booking_date).toLocaleDateString()}</span>
									</div>
									<div className="detail-row">
										<span className="detail-icon">🕒</span>
										<span>{booking.booking_time}</span>
									</div>
									{booking.table_number && (
										<div className="detail-row">
											<span className="detail-icon">🪑</span>
											<span>Table {booking.table_number}</span>
										</div>
									)}
									{booking.special_request && (
										<div className="detail-row special-request">
											<span className="detail-icon">💬</span>
											<span>{booking.special_request}</span>
										</div>
									)}
								</div>

								<div className="booking-actions">
									{booking.status === 'pending' && (
										<>
											<button 
												className="btn-confirm"
												onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
											>
												✓ Confirm
											</button>
											<button 
												className="btn-cancel"
												onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
											>
												✕ Cancel
											</button>
										</>
									)}
									{booking.status === 'confirmed' && (
										<button 
											className="btn-complete"
											onClick={() => handleStatusUpdate(booking.id, 'completed')}
										>
											✓ Complete
										</button>
									)}
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</>
	);
}
