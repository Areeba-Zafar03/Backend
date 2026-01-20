const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// GET all categories
router.get('/', categoryController.getAllCategories);

// POST: Add a new category
router.post('/', categoryController.addCategory);

// PUT: Update an existing category by ID
router.put('/:id', categoryController.updateCategory);

// DELETE: Delete a category by ID
router.delete('/:id', categoryController.deleteCategory);

// GET products for a specific subcategory (more specific route first)
router.get('/subcategories/:subcategoryId/products', categoryController.getProductsBySubcategory);

// GET subcategories by category ID
router.get('/:id/subcategories', categoryController.getSubcategoriesByCategoryId);

module.exports = router;
