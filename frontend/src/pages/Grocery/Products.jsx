import React from 'react';
// ...existing code...

import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Products() {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('all');

	// Sample product data
	const products = [
		{
			id: 1,
			name: 'Fresh Organic Tomatoes',
			price: 4.99,
			image: '/api/placeholder/300/200',
			category: 'vegetables',
			shop: 'Green Valley Farm',
			rating: 4.5,
			inStock: true
		},
		{
			id: 2,
			name: 'Artisan Bread',
			price: 8.99,
			image: '/api/placeholder/300/200',
			category: 'bakery',
			shop: 'Local Bakery',
			rating: 4.8,
			inStock: true
		},
		{
			id: 3,
			name: 'Handmade Soap',
			price: 12.99,
			image: '/api/placeholder/300/200',
			category: 'personal-care',
			shop: 'Natural Wellness',
			rating: 4.7,
			inStock: false
		},
		{
			id: 4,
			name: 'Local Honey',
			price: 15.99,
			image: '/api/placeholder/300/200',
			category: 'food',
			shop: 'Honey Bee Farm',
			rating: 4.9,
			inStock: true
		},
		{
			id: 5,
			name: 'Ceramic Mug',
			price: 19.99,
			image: '/api/placeholder/300/200',
			category: 'home',
			shop: 'Potter\'s Corner',
			rating: 4.6,
			inStock: true
		},
		{
			id: 6,
			name: 'Organic Apples',
			price: 6.99,
			image: '/api/placeholder/300/200',
			category: 'fruits',
			shop: 'Orchard Fresh',
			rating: 4.4,
			inStock: true
		}
	];

	const categories = [
		{ id: 'all', name: 'All Products' },
		{ id: 'vegetables', name: 'Vegetables' },
		{ id: 'fruits', name: 'Fruits' },
		{ id: 'bakery', name: 'Bakery' },
		{ id: 'food', name: 'Food' },
		{ id: 'personal-care', name: 'Personal Care' },
		{ id: 'home', name: 'Home & Garden' }
	];

	const filteredProducts = products.filter(product => {
		const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
												 product.shop.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
		return matchesSearch && matchesCategory;
	});

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						<div className="flex items-center space-x-4">
							<Link to="/" className="text-blue-600 hover:text-blue-500">
								← Back to Home
							</Link>
							<h1 className="text-2xl font-bold text-gray-900">Products</h1>
						</div>
						<div className="flex items-center space-x-4">
							<button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
								Add to Cart
							</button>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Search and Filters */}
				<div className="mb-8 flex flex-col lg:flex-row gap-4">
					<div className="flex-1">
						<div className="relative">
							<input
								type="text"
								placeholder="Search products or shops..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
							<svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>
					</div>
          
					<div className="lg:w-64">
						<select
							value={selectedCategory}
							onChange={(e) => setSelectedCategory(e.target.value)}
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							{categories.map(category => (
								<option key={category.id} value={category.id}>
									{category.name}
								</option>
							))}
						</select>
					</div>
				</div>

				{/* Results Summary */}
				<div className="mb-6">
					<p className="text-gray-600">
						Showing {filteredProducts.length} of {products.length} products
					</p>
				</div>

				{/* Products Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredProducts.map(product => (
						<div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
							<div className="aspect-w-16 aspect-h-9">
								<div className="w-full h-48 bg-gray-200 flex items-center justify-center">
									<svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
								</div>
							</div>
              
							<div className="p-4">
								<div className="flex justify-between items-start mb-2">
									<h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
									<span className={`px-2 py-1 text-xs rounded-full ${
										product.inStock 
											? 'bg-green-100 text-green-800' 
											: 'bg-red-100 text-red-800'
									}`}>
										{product.inStock ? 'In Stock' : 'Out of Stock'}
									</span>
								</div>
                
								<p className="text-sm text-gray-600 mb-2">by {product.shop}</p>
                
								<div className="flex items-center mb-2">
									<div className="flex items-center">
										{[...Array(5)].map((_, i) => (
											<svg
												key={i}
												className={`w-4 h-4 ${
													i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'
												}`}
												fill="currentColor"
												viewBox="0 0 24 24"
											>
												<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
											</svg>
										))}
									</div>
									<span className="text-sm text-gray-600 ml-2">({product.rating})</span>
								</div>
                
								<div className="flex justify-between items-center">
									<span className="text-xl font-bold text-gray-900">${product.price}</span>
									<button 
										disabled={!product.inStock}
										className={`px-4 py-2 rounded-md text-sm font-medium ${
											product.inStock
												? 'bg-blue-600 text-white hover:bg-blue-700'
												: 'bg-gray-300 text-gray-500 cursor-not-allowed'
										} transition-colors`}
									>
										{product.inStock ? 'Add to Cart' : 'Out of Stock'}
									</button>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Empty State */}
				{filteredProducts.length === 0 && (
					<div className="text-center py-12">
						<svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414a1 1 0 00-.707-.293H4" />
						</svg>
						<h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
						<p className="text-gray-600">Try adjusting your search or filter criteria</p>
					</div>
				)}
			</div>
		</div>
	);
}
						