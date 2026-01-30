const groceryService = require('./grocery.service');

// --- ITEMS ---

const createItem = async (req, res, next) => {
    try {
        const shopId = req.shop.id; // Fixed: Use proper shop ID from middleware
        const item = await groceryService.createGroceryItem(shopId, req.body);

        res.status(201).json({
            success: true,
            message: 'Grocery item created successfully',
            data: item
        });
    } catch (error) {
        next(error);
    }
};

const getItems = async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        const filters = {
            category_id: req.query.category_id,
            is_available: req.query.is_available
        };
        const items = await groceryService.getGroceryItems(shopId, filters);

        res.status(200).json({
            success: true,
            data: items
        });
    } catch (error) {
        next(error);
    }
};

const getItemById = async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        const { id } = req.params;
        const item = await groceryService.getGroceryItemById(shopId, id);

        res.status(200).json({
            success: true,
            data: item
        });
    } catch (error) {
        next(error);
    }
};

const updateItem = async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        const { id } = req.params;
        const item = await groceryService.updateGroceryItem(shopId, id, req.body);

        res.status(200).json({
            success: true,
            message: 'Item updated successfully',
            data: item
        });
    } catch (error) {
        next(error);
    }
};

const deleteItem = async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        const { id } = req.params;
        await groceryService.deleteGroceryItem(shopId, id);

        res.status(200).json({
            success: true,
            message: 'Item deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

const uploadImage = async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }

        const item = await groceryService.uploadItemImage(id, shopId, req.file);

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: item
        });
    } catch (error) {
        next(error);
    }
};


// --- INVENTORY ---

const updateStock = async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        const { id } = req.params;
        const { quantity } = req.body;

        if (quantity === undefined || quantity < 0) {
            return res.status(400).json({ success: false, message: 'Valid quantity is required' });
        }

        const item = await groceryService.updateInventory(shopId, id, quantity);

        res.status(200).json({
            success: true,
            message: 'Stock updated successfully',
            data: item
        });
    } catch (error) {
        next(error);
    }
};

const toggleAvailability = async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        const { id } = req.params;
        const { is_available } = req.body;

        if (is_available === undefined) {
            return res.status(400).json({ success: false, message: 'is_available status is required' });
        }

        const item = await groceryService.toggleAvailability(shopId, id, is_available);

        res.status(200).json({
            success: true,
            message: 'Availability updated successfully',
            data: item
        });
    } catch (error) {
        next(error);
    }
};


// --- CATEGORIES ---

const createCategory = async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        const { name } = req.body;

        if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

        const category = await groceryService.createGroceryCategory(shopId, name);

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        next(error);
    }
};

const getCategories = async (req, res, next) => {
    try {
        const shopId = req.shop.id;
        const categories = await groceryService.getGroceryCategories(shopId);

        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createItem,
    getItems,
    getItemById,
    updateItem,
    deleteItem,
    updateStock,
    toggleAvailability,
    uploadImage,
    createCategory,
    getCategories
};
