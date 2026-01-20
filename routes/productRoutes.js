const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Important: Place /columns before /:id to avoid route conflict
router.get('/columns', productController.getProductColumns);

// GET all products or filter by subcategoryId
router.get('/', productController.getAllProducts);

// GET single product by ID
router.get('/:id', productController.getProductById);

// POST new product
router.post('/', productController.addProduct);

// PUT update existing product by ID
router.put('/:id', productController.updateProduct);

// DELETE product by ID
router.delete('/:id', productController.deleteProduct);

module.exports = router;
