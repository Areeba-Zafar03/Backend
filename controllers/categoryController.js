const db = require('../config/db');

// Get all categories
const getAllCategories = async (req, res) => {
  console.log("Fetching categories...");
  try {
    const [results] = await db.promise().query('SELECT * FROM categories');
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Add a new category
const addCategory = async (req, res) => {
  const { name } = req.body; // Remove description here
  try {
    const [result] = await db.promise().query(
      "INSERT INTO categories (name) VALUES (?)",
      [name]  // Pass name as value here
    );
    res.status(201).json({ message: 'Category added successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Update category by ID
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body; // Remove description

  try {
    await db.promise().query(
      'UPDATE categories SET name = ? WHERE id = ?',
      [name, id]
    );
    res.status(200).json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error(`Error updating category with id ${id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// Delete category by ID
const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    await db.promise().query('DELETE FROM categories WHERE id = ?', [id]);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(`Error deleting category with id ${id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get subcategories by category ID
const getSubcategoriesByCategoryId = async (req, res) => {
  const { id: categoryId } = req.params;
  try {
    const [results] = await db.promise().query(
      'SELECT * FROM subcategories WHERE category_id = ?',
      [categoryId]
    );
    res.status(200).json(results);
  } catch (error) {
    console.error(`Error fetching subcategories for category ${categoryId}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get products by subcategory ID
const getProductsBySubcategory = async (req, res) => {
  const { subcategoryId } = req.params;
  try {
    const [results] = await db.promise().query(
      'SELECT * FROM products WHERE subcategory_id = ?',
      [subcategoryId]
    );
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getAllCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getSubcategoriesByCategoryId,
  getProductsBySubcategory,
};
