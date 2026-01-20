const express = require("express");
const router = express.Router();
const db = require("../config/db");
const PDFDocument = require("pdfkit");

// Total Users Endpoint
router.get("/total-users", (req, res) => {
  db.query("SELECT COUNT(*) AS total FROM register", (err, result) => {
    if (err) {
      console.error("Error fetching total users:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ total: result[0].total });
  });
});

// Route to get total orders count
router.get("/total-orders", (req, res) => {
  const query = "SELECT COUNT(*) AS totalOrders FROM orders";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching total orders:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json({ totalOrders: results[0].totalOrders });
  });
});

// Total Revenue Route
router.get('/total-revenue', (req, res) => {
  const query = 'SELECT SUM(total_price) AS revenue FROM orders';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch revenue' });
    }
    res.json({ revenue: results[0].revenue || 0 });
  });
});

// Top Products Route
router.get('/top-products', (req, res) => {
  const query = `
    SELECT p.id, p.name, p.image, SUM(oi.quantity) AS sales
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    GROUP BY p.id, p.name, p.image
    ORDER BY sales DESC
    LIMIT 5
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('🔥 Error in /top-products route:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json({ products: results });
  });
});

// Category Sales Route
router.get('/category-sales', (req, res) => {
  const query = `
    SELECT c.name AS category, SUM(oi.quantity) AS totalSales
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    GROUP BY c.name
    ORDER BY totalSales DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching category sales:', err);
      return res.status(500).json({ error: "Failed to fetch category sales" });
    }
    res.json({ data: results });
  });
});

// User Analytics PDF Report Route
router.get('/user-report', async (req, res) => {
  try {
    const totalUsersResult = await new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) AS total FROM register", (err, result) => {
        if (err) reject(err);
        else resolve(result[0].total);
      });
    });

    const recentSignupsResult = await new Promise((resolve, reject) => {
      db.query(
        "SELECT COUNT(*) AS recent FROM register WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)",
        (err, result) => {
          if (err) reject(err);
          else resolve(result[0].recent);
        }
      );
    });

    const userDetails = await new Promise((resolve, reject) => {
      db.query(
        "SELECT firstName, email, phone FROM register ORDER BY createdAt DESC LIMIT 50",
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=user_analytics_report.pdf');
    doc.pipe(res);

    // Title and summary
    doc.fontSize(22).text('User Analytics Report', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(16).text(`Total Users: ${totalUsersResult}`);
    doc.moveDown();
    doc.text(`New Users (Last 30 days): ${recentSignupsResult}`);
    doc.moveDown(2);

    // Table Header
    doc.fontSize(18).text('User Details', { underline: true });
    doc.moveDown(0.5);

    // Column titles with background
    const startX = 50;
    let startY = doc.y;
    const colWidths = { name: 120, email: 230, phone: 160 };

    doc.rect(startX - 5, startY - 5, colWidths.name + colWidths.email + colWidths.phone + 20, 25)
       .fill('#f0f0f0')
       .fillColor('#000');

    doc.fontSize(14).font('Helvetica-Bold')
      .text('Name', startX, startY, { width: colWidths.name, align: 'left' })
      .text('Email', startX + colWidths.name + 10, startY, { width: colWidths.email, align: 'left' })
      .text('Mobile Number', startX + colWidths.name + colWidths.email + 20, startY, { width: colWidths.phone, align: 'left' });

    startY += 25;
    doc.moveTo(startX - 5, startY).lineTo(startX - 5 + colWidths.name + colWidths.email + colWidths.phone + 20, startY).stroke();
    doc.font('Helvetica').fontSize(12);

    // User Rows
    userDetails.forEach(user => {
      doc.text(user.firstName || '-', startX, startY, { width: colWidths.name });
      doc.text(user.email || '-', startX + colWidths.name + 10, startY, { width: colWidths.email });
      doc.text(user.phone || '-', startX + colWidths.name + colWidths.email + 20, startY, { width: colWidths.phone });

      startY += 20;

      // Horizontal line
      doc.moveTo(startX - 5, startY).lineTo(startX - 5 + colWidths.name + colWidths.email + colWidths.phone + 20, startY).stroke();

      // Page break if needed
      if (startY > 750) {
        doc.addPage();
        startY = 50;
      }
    });

    doc.end();
  } catch (error) {
    console.error('Error generating user report PDF:', error);
    res.status(500).json({ error: 'Failed to generate user report' });
  }
});

//Order-Report

router.get('/orders-report', async (req, res) => {
  try {
    const query = `
      SELECT 
        o.order_id AS orderId,
        r.firstName AS customerName,
        o.total_price,
        o.status,
        o.created_at,
        p.name AS productName,
        oi.quantity
      FROM orders o
      JOIN register r ON o.user_id = r.id
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      ORDER BY o.created_at DESC, o.order_id, p.name
    `;

    const orders = await new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=orders_report.pdf');
    doc.pipe(res);

    // Title
    doc.fontSize(22).font('Helvetica-Bold').text('Orders Report', { align: 'center' });
    doc.moveDown(1.5);

    let y = doc.y;
    const pageHeight = doc.page.height - doc.page.margins.bottom;

    // Helper function for page break
    const checkPageSpace = (heightNeeded = 100) => {
      if (y + heightNeeded > pageHeight) {
        doc.addPage();
        y = doc.y;
      }
    };

    // Group orders by orderId to display order info once with products below
    const groupedOrders = {};
    for (const row of orders) {
      if (!groupedOrders[row.orderId]) {
        groupedOrders[row.orderId] = {
          orderId: row.orderId,
          customerName: row.customerName,
          total_price: row.total_price,
          status: row.status,
          created_at: row.created_at,
          products: [],
        };
      }
      groupedOrders[row.orderId].products.push({
        productName: row.productName,
        quantity: row.quantity,
      });
    }

    // Convert groupedOrders to array and iterate
    const orderList = Object.values(groupedOrders);

    orderList.forEach((order, idx) => {
      checkPageSpace(110); // enough space for order + products

      // Order main info block
      doc
        .fontSize(14)
        .fillColor('#003366')
        .font('Helvetica-Bold')
        .text(`Order ID: `, { continued: true })
        .font('Helvetica')
        .text(order.orderId);

      doc
        .font('Helvetica-Bold')
        .text(`Customer: `, { continued: true })
        .font('Helvetica')
        .text(order.customerName || '-');

      doc
        .font('Helvetica-Bold')
        .text(`Total Price: `, { continued: true })
        .font('Helvetica')
        .text(`$${order.total_price.toFixed(2)}`, { continued: true });

      doc
        .font('Helvetica-Bold')
        .text(`   Status: `, { continued: true })
        .font('Helvetica')
        .text(order.status);

      doc
        .font('Helvetica-Bold')
        .text(`Order Date: `, { continued: true })
        .font('Helvetica')
        .text(new Date(order.created_at).toLocaleDateString());

      doc.moveDown(0.5);

      // Products header
      doc
        .fontSize(13)
        .fillColor('#555555')
        .font('Helvetica-Bold')
        .text('Products:', { underline: true });

      // List products with indentation
      order.products.forEach((prod) => {
        doc
          .fontSize(12)
          .fillColor('black')
          .font('Helvetica')
          .list([`${prod.productName} (Quantity: ${prod.quantity})`], { bulletIndent: 15, textIndent: 25 });
      });

      doc.moveDown(1.2);
      y = doc.y;

      // Draw a subtle separator line between orders
      if (idx < orderList.length - 1) {
        doc
          .strokeColor('#cccccc')
          .lineWidth(1)
          .moveTo(doc.page.margins.left, y)
          .lineTo(doc.page.width - doc.page.margins.right, y)
          .stroke();
        doc.moveDown(1);
        y = doc.y;
      }
    });

    doc.end();
  } catch (error) {
    console.error('Error generating orders report:', error);
    res.status(500).json({ error: 'Failed to generate orders report' });
  }
});


module.exports = router;
