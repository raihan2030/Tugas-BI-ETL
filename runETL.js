const Database = require('better-sqlite3');

const oltp_db = new Database('toko_beras_oltp.db', { readonly: true });
const dwh_db = new Database('toko_beras_dwh.db');

console.log('🚀 Memulai proses ETL...');
dwh_db.exec('PRAGMA foreign_keys = ON;');

const etlTransaction = dwh_db.transaction(() => {
    console.log('1. Menghapus data lama di DWH...');
    dwh_db.exec(`
        DELETE FROM fact_sales;
        DELETE FROM fact_stock_order;
        DELETE FROM fact_goods_receiving;
        DELETE FROM dim_time;
        DELETE FROM dim_product;
        DELETE FROM dim_supplier;
        DELETE FROM dim_customer;
        DELETE FROM dim_employee;
        DELETE FROM dim_purchase_order;
    `);

    console.log('2. Memuat Tabel Dimensi...');

    // dim_time (Generated)
    const insertTime = dwh_db.prepare('INSERT INTO dim_time (time_id, full_date, day, month, year, quarter, is_weekend) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const startDate = new Date('2025-10-01');
    const endDate = new Date('2025-10-31');
    for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
        const time_id = parseInt(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`);
        const isWeekend = (d.getDay() === 6 || d.getDay() === 0);
        insertTime.run(time_id, d.toISOString().split('T')[0], d.getDate(), d.toLocaleString('en-US', { month: 'long'}), d.getFullYear(), 'Q4', isWeekend ? 1 : 0);
    }

    // dim_product
    const products = oltp_db.prepare('SELECT p.product_id, p.product_name, pc.category_name FROM products p JOIN product_categories pc ON p.category_id = pc.category_id').all();
    const insertProduct = dwh_db.prepare('INSERT INTO dim_product (product_id, product_name, category_name) VALUES (?, ?, ?)');
    products.forEach(p => insertProduct.run(p.product_id, p.product_name, p.category_name));

    // dim_supplier
    const suppliers = oltp_db.prepare('SELECT supplier_id, supplier_name, address FROM suppliers').all();
    const insertSupplier = dwh_db.prepare('INSERT INTO dim_supplier (supplier_id, supplier_name, supplier_city) VALUES (?, ?, ?)');
    suppliers.forEach(s => insertSupplier.run(s.supplier_id, s.supplier_name, s.address.split(',')[1]?.trim() || 'Unknown'));
    
    // dim_customer
    const customers = oltp_db.prepare('SELECT customer_id, customer_name, address FROM customers').all();
    const insertCustomer = dwh_db.prepare('INSERT INTO dim_customer (customer_id, customer_name, customer_city) VALUES (?, ?, ?)');
    customers.forEach(c => insertCustomer.run(c.customer_id, c.customer_name, c.address.split(',')[1]?.trim() || 'Unknown'));
    
    // dim_employee
    const employees = oltp_db.prepare('SELECT employee_id, employee_name, role FROM employees').all();
    const insertEmployee = dwh_db.prepare('INSERT INTO dim_employee (employee_id, employee_name, role) VALUES (?, ?, ?)');
    employees.forEach(e => insertEmployee.run(e.employee_id, e.employee_name, e.role));
    
    // dim_purchase_order
    const purchaseOrders = oltp_db.prepare('SELECT order_id, order_id, order_status FROM purchase_orders').all();
    const insertPO = dwh_db.prepare('INSERT INTO dim_purchase_order (purchase_order_id, purchase_order_number, order_status) VALUES (?, ?, ?)');
    purchaseOrders.forEach(po => insertPO.run(po.order_id, po.order_id, po.order_status));
    

    console.log('3. Memuat Tabel Fakta...');

    // 1. fact_stock_order
    const stockOrders = oltp_db.prepare(`
        SELECT po.order_date, pod.product_id, po.supplier_id, po.order_id, pod.quantity, pod.unit_selling_price
        FROM purchase_order_details pod
        JOIN purchase_orders po ON pod.order_id = po.order_id
    `).all();
    const insertFactStockOrder = dwh_db.prepare('INSERT INTO fact_stock_order VALUES (?, ?, ?, ?, ?, ?, ?)');
    for(const row of stockOrders) {
        const time_id = parseInt(row.order_date.replace(/-/g, ''));
        const total_cost = row.quantity * row.unit_selling_price;
        insertFactStockOrder.run(time_id, row.product_id, row.supplier_id, row.order_id, row.quantity, row.unit_selling_price, total_cost);
    }

    // 2. fact_goods_receiving
    const goodsReceivings = oltp_db.prepare(`
        SELECT gr.date_received, grd.product_id, po.supplier_id, gr.employee_id, gr.order_id, grd.number_received, grd.number_rejected, po.order_date
        FROM goods_receiving_details grd
        JOIN goods_receivings gr ON grd.receiving_id = gr.receiving_id
        JOIN purchase_orders po ON gr.order_id = po.order_id
    `).all();
    const insertFactGoodsReceiving = dwh_db.prepare('INSERT INTO fact_goods_receiving VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for(const row of goodsReceivings) {
        const time_id = parseInt(row.date_received.replace(/-/g, ''));
        const delivery_duration = (new Date(row.date_received) - new Date(row.order_date)) / (1000 * 60 * 60 * 24);
        insertFactGoodsReceiving.run(time_id, row.product_id, row.supplier_id, row.employee_id, row.order_id, row.number_received, row.number_rejected, delivery_duration);
    }

    // 3. fact_sales
    const sales = oltp_db.prepare(`
        SELECT s.sales_date, sd.product_id, s.customer_id, s.employee_id, sd.number_sold, sd.unit_selling_price, s.total_price
        FROM sales_details sd
        JOIN sales s ON sd.sales_id = s.sales_id
    `).all();
    const insertFactSales = dwh_db.prepare('INSERT INTO fact_sales VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for(const row of sales) {
        const time_id = parseInt(row.sales_date.replace(/-/g, ''));
        const total_revenue = row.number_sold * row.unit_selling_price;
        insertFactSales.run(time_id, row.product_id, row.customer_id, row.employee_id, row.number_sold, row.unit_selling_price, total_revenue, 1);
    }
});

etlTransaction();

console.log('✅ Proses ETL selesai.');
oltp_db.close();
dwh_db.close();