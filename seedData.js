// file: seedData.js
const Database = require('better-sqlite3');
const db = new Database('toko_beras_oltp.db');
console.log('Terhubung ke OLTP untuk seeding...');

db.exec('PRAGMA foreign_keys = ON;');

const seedTransaction = db.transaction(() => {
    console.log('Menghapus data lama (jika ada)...');
    // Hapus dalam urutan terbalik untuk menghindari FK constraint error
    db.exec(`
        DELETE FROM sales_details;
        DELETE FROM goods_receiving_details;
        DELETE FROM purchase_order_details;
        DELETE FROM sales;
        DELETE FROM goods_receivings;
        DELETE FROM purchase_orders;
        DELETE FROM products;
        DELETE FROM customers;
        DELETE FROM suppliers;
        DELETE FROM employees;
        DELETE FROM product_categories;
    `);

    console.log('Memasukkan data baru...');
    // Siapkan statement
    const insertCategory = db.prepare('INSERT INTO product_categories (category_id, category_name) VALUES (?, ?)');
    const insertSupplier = db.prepare('INSERT INTO suppliers (supplier_id, supplier_name, address, contact) VALUES (?, ?, ?, ?)');
    const insertCustomer = db.prepare('INSERT INTO customers (customer_id, customer_name, address, phone_number) VALUES (?, ?, ?, ?)');
    const insertEmployee = db.prepare('INSERT INTO employees (employee_id, employee_name, role) VALUES (?, ?, ?)');
    const insertProduct = db.prepare('INSERT INTO products (product_id, product_name, unit_selling_price, current_stock, category_id) VALUES (?, ?, ?, ?, ?)');

    const insertPO = db.prepare('INSERT INTO purchase_orders (order_id, supplier_id, order_date, order_status) VALUES (?, ?, ?, ?)');
    const insertPODetail = db.prepare('INSERT INTO purchase_order_details (order_detail_id, order_id, product_id, quantity, unit_selling_price) VALUES (?, ?, ?, ?, ?)');
    
    const insertReceiving = db.prepare('INSERT INTO goods_receivings (receiving_id, order_id, employee_id, date_received, delivery_order_number) VALUES (?, ?, ?, ?, ?)');
    const insertReceivingDetail = db.prepare('INSERT INTO goods_receiving_details (receiving_detail_id, receiving_id, product_id, number_received, number_rejected) VALUES (?, ?, ?, ?, ?)');
    
    const insertSale = db.prepare('INSERT INTO sales (sales_id, customer_id, employee_id, sales_date, total_price) VALUES (?, ?, ?, ?, ?)');
    const insertSaleDetail = db.prepare('INSERT INTO sales_details (sales_detail_id, sales_id, product_id, number_sold, unit_selling_price) VALUES (?, ?, ?, ?, ?)');

    // ================= MASTER DATA =================
    // Jalankan insert
    insertCategory.run(1, 'Premium');
    insertCategory.run(2, 'Medium');

    insertSupplier.run(101, 'CV Padi Makmur', 'Jl. Agraria No. 5, Karawang', '08123');
    insertSupplier.run(102, 'CV Abdi Sejahtera', 'Jl. Ahmad Yani No. 3, Karawang', '08123');
    insertSupplier.run(103, 'CV Beras Jaya', 'Jl. Industri No. 12, Bekasi', '08124'); // Data Baru

    insertCustomer.run(701, 'Restoran Padang Jaya', 'Jl. Sudirman No. 1, Jakarta', '08551');
    insertCustomer.run(702, 'Toko Sembako Barokah', 'Jl. Merdeka No. 10, Bogor', '08778');
    insertCustomer.run(703, 'Katering Sehat Ceria', 'Jl. Gatot Subroto No. 25, Jakarta', '08991'); // Data Baru

    insertEmployee.run(1, 'Budi', 'Kasir');
    insertEmployee.run(2, 'Ani', 'Gudang');

    insertProduct.run(11, 'Beras Pandan Wangi Sania', 15000, 20, 1);
    insertProduct.run(12, 'Beras Rojolele Cap Mawar', 14500, 100, 1);
    insertProduct.run(13, 'Beras Merah Organik', 18000, 67, 1); // Data Baru
    insertProduct.run(14, 'Beras Ketan Putih', 16000, 31, 2); // Data Baru

    // ================= TRANSACTIONAL DATA =================
    // Alur Proses: Pesan -> Terima -> Jual
    insertPO.run(5001, 101, '2025-10-01', 'Completed');
    insertPO.run(5002, 103, '2025-10-02', 'Completed');
    insertPO.run(5003, 101, '2025-10-03', 'Completed');
    insertPO.run(5004, 102, '2025-10-05', 'Completed');

    insertPODetail.run(1, 5001, 11, 200, 12000);
    insertPODetail.run(2, 5001, 12, 150, 11500);
    insertPODetail.run(4, 5003, 11, 300, 12000);
    insertPODetail.run(5, 5004, 14, 150, 13000);
    insertPODetail.run(3, 5002, 13, 100, 15000);
    
    insertReceiving.run(601, 5001, 2, '2025-10-04', 701);
    insertReceiving.run(602, 5002, 2, '2025-10-05', 702);
    insertReceiving.run(603, 5003, 2, '2025-10-06', 703);
    insertReceiving.run(604, 5004, 2, '2025-10-08', 704);

    insertReceivingDetail.run(1, 601, 11, 200, 0);
    insertReceivingDetail.run(2, 601, 12, 148, 2); // Ada 2 rusak
    insertReceivingDetail.run(3, 602, 13, 100, 0);
    insertReceivingDetail.run(4, 603, 11, 298, 2); // Ada 2 rusak
    insertReceivingDetail.run(5, 604, 14, 150, 0);

    insertSale.run(9001, 701, 1, '2025-10-06', 750000); // (50 kg * 15000)
    insertSale.run(9003, 703, 1, '2025-10-07', 450000); // (25 kg * 18000)
    insertSale.run(9002, 702, 1, '2025-10-06', 1087500); // (75 kg * 14500)
    insertSale.run(9004, 702, 1, '2025-10-07', 1500000); // (100 kg * 15000)
    insertSale.run(9005, 703, 1, '2025-10-08', 725000); // (50 kg * 14500)
    insertSale.run(9006, 701, 1, '2025-10-09', 800000); // (50 kg * 16000)
    insertSale.run(9007, 701, 1, '2025-10-10', 2250000); // (150 kg * 15000)
    
    insertSaleDetail.run(1, 9001, 11, 50, 15000);
    insertSaleDetail.run(3, 9003, 13, 25, 18000);
    insertSaleDetail.run(2, 9002, 12, 75, 14500);
    insertSaleDetail.run(4, 9004, 11, 100, 15000);
    insertSaleDetail.run(5, 9005, 12, 50, 14500);
    insertSaleDetail.run(6, 9006, 14, 50, 16000);
    insertSaleDetail.run(7, 9007, 11, 150, 15000);
    
    

    
    
    

    
    

    
    
    
    
    
    

    
    
});

seedTransaction();
console.log('Data awal berhasil dimasukkan ke OLTP.');
db.close();