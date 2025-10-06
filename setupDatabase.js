// file: setupDatabase.js
const Database = require("better-sqlite3");

function setupOLTP() {
    const db = new Database("toko_beras_oltp.db");
    console.log("Terhubung ke database toko_beras_oltp.db...");
    db.exec("PRAGMA foreign_keys = ON;");

    console.log("Membuat skema OLTP (plural)...");
    db.exec(`
        CREATE TABLE IF NOT EXISTS product_categories (
            category_id INTEGER PRIMARY KEY, 
            category_name VARCHAR NOT NULL
        );
        CREATE TABLE IF NOT EXISTS suppliers (
            supplier_id INTEGER PRIMARY KEY, 
            supplier_name VARCHAR NOT NULL, 
            address TEXT, 
            contact VARCHAR
        );
        CREATE TABLE IF NOT EXISTS customers (
            customer_id INTEGER PRIMARY KEY, 
            customer_name VARCHAR NOT NULL, 
            address TEXT, 
            phone_number VARCHAR
        );
        CREATE TABLE IF NOT EXISTS employees (
            employee_id INTEGER PRIMARY KEY, 
            employee_name VARCHAR NOT NULL, 
            role VARCHAR
        );
        CREATE TABLE IF NOT EXISTS products (
            product_id INTEGER PRIMARY KEY, 
            product_name VARCHAR NOT NULL, 
            unit_selling_price DECIMAL NOT NULL, 
            current_stock INTEGER, 
            category_id INTEGER, 
            FOREIGN KEY (category_id) REFERENCES product_categories(category_id)
        );
        CREATE TABLE IF NOT EXISTS purchase_orders (
            order_id INTEGER PRIMARY KEY, 
            supplier_id INTEGER, 
            order_date DATE, 
            order_status VARCHAR, 
            FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
        );
        CREATE TABLE IF NOT EXISTS sales (
            sales_id INTEGER PRIMARY KEY, 
            customer_id INTEGER, 
            employee_id INTEGER, 
            sales_date DATE, 
            total_price DECIMAL, 
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id), 
            FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
        );
        CREATE TABLE IF NOT EXISTS goods_receivings (
            receiving_id INTEGER PRIMARY KEY, 
            order_id INTEGER, employee_id INTEGER, 
            date_received DATE, 
            delivery_order_number INTEGER, 
            FOREIGN KEY (order_id) REFERENCES purchase_orders(order_id), 
            FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
        );
        CREATE TABLE IF NOT EXISTS purchase_order_details (
            order_detail_id INTEGER PRIMARY KEY, 
            order_id INTEGER, 
            product_id INTEGER, 
            quantity INTEGER, 
            unit_selling_price DECIMAL, 
            FOREIGN KEY (order_id) REFERENCES purchase_orders(order_id), 
            FOREIGN KEY (product_id) REFERENCES products(product_id)
        );
        CREATE TABLE IF NOT EXISTS sales_details (
            sales_detail_id INTEGER PRIMARY KEY, 
            sales_id INTEGER, 
            product_id INTEGER, 
            number_sold INTEGER, 
            unit_selling_price DECIMAL, 
            FOREIGN KEY (sales_id) REFERENCES sales(sales_id), 
            FOREIGN KEY (product_id) REFERENCES products(product_id));
        CREATE TABLE IF NOT EXISTS goods_receiving_details (
            receiving_detail_id INTEGER PRIMARY KEY, 
            receiving_id INTEGER, 
            product_id INTEGER, 
            number_received INTEGER, 
            number_rejected INTEGER, 
            FOREIGN KEY (receiving_id) REFERENCES goods_receivings(receiving_id), 
            FOREIGN KEY (product_id) REFERENCES products(product_id)
        );
    `);
    console.log("Skema OLTP berhasil dibuat.");
    db.close();
    console.log("Koneksi OLTP ditutup.");
}

function setupDWH() {
    const db = new Database("toko_beras_dwh.db");
    console.log("Terhubung ke database toko_beras_dwh.db...");
    db.exec("PRAGMA foreign_keys = ON;");

    console.log("Membuat skema DWH (Dimensional Model)...");
    db.exec(`
        -- DIMENSION TABLES
        CREATE TABLE IF NOT EXISTS dim_time (
            time_id      INTEGER PRIMARY KEY,
            full_date    DATE,
            day          INTEGER,
            month        VARCHAR,
            year         INTEGER,
            quarter      VARCHAR,
            is_weekend   BOOLEAN
        );

        CREATE TABLE IF NOT EXISTS dim_product (
            product_id      INTEGER PRIMARY KEY,
            product_name    VARCHAR,
            category_name   VARCHAR
        );

        CREATE TABLE IF NOT EXISTS dim_supplier (
            supplier_id     INTEGER PRIMARY KEY,
            supplier_name   VARCHAR,
            supplier_city   VARCHAR
        );

        CREATE TABLE IF NOT EXISTS dim_customer (
            customer_id     INTEGER PRIMARY KEY,
            customer_name   VARCHAR,
            customer_city   VARCHAR
        );

        CREATE TABLE IF NOT EXISTS dim_employee (
            employee_id     INTEGER PRIMARY KEY,
            employee_name   VARCHAR,
            role            VARCHAR
        );

        CREATE TABLE IF NOT EXISTS dim_purchase_order (
            purchase_order_id       INTEGER PRIMARY KEY,
            purchase_order_number   INTEGER,
            order_status            VARCHAR
        );

        -- FACT TABLES
        CREATE TABLE IF NOT EXISTS fact_sales (
            time_id                 INTEGER,
            product_id              INTEGER,
            customer_id             INTEGER,
            employee_id             INTEGER,
            number_sold             INTEGER,
            unit_selling_price      DECIMAL,
            total_revenue           DECIMAL,
            number_of_transactions  INTEGER,
            FOREIGN KEY (time_id) REFERENCES dim_time(time_id),
            FOREIGN KEY (product_id) REFERENCES dim_product(product_id),
            FOREIGN KEY (customer_id) REFERENCES dim_customer(customer_id),
            FOREIGN KEY (employee_id) REFERENCES dim_employee(employee_id)
        );
        
        CREATE TABLE IF NOT EXISTS fact_stock_order (
            order_time_id           INTEGER,
            product_id              INTEGER,
            supplier_id             INTEGER,
            purchase_order_id       INTEGER,
            quantity_ordered        INTEGER,
            purchase_unit_price     DECIMAL,
            total_order_cost        DECIMAL,
            FOREIGN KEY (order_time_id) REFERENCES dim_time(time_id),
            FOREIGN KEY (product_id) REFERENCES dim_product(product_id),
            FOREIGN KEY (supplier_id) REFERENCES dim_supplier(supplier_id),
            FOREIGN KEY (purchase_order_id) REFERENCES dim_purchase_order(purchase_order_id)
        );

        CREATE TABLE IF NOT EXISTS fact_goods_receiving (
            receiving_time_id       INTEGER,
            product_id              INTEGER,
            supplier_id             INTEGER,
            employee_id             INTEGER,
            purchase_order_id       INTEGER,
            number_received         INTEGER,
            number_rejected         INTEGER,
            delivery_duration_days  INTEGER,
            FOREIGN KEY (receiving_time_id) REFERENCES dim_time(time_id),
            FOREIGN KEY (product_id) REFERENCES dim_product(product_id),
            FOREIGN KEY (supplier_id) REFERENCES dim_supplier(supplier_id),
            FOREIGN KEY (employee_id) REFERENCES dim_employee(employee_id),
            FOREIGN KEY (purchase_order_id) REFERENCES dim_purchase_order(purchase_order_id)
        );
    `);
    console.log("Skema DWH berhasil dibuat.");
    db.close();
    console.log("Koneksi DWH ditutup.");
}

// Menjalankan kedua fungsi
setupOLTP();
setupDWH();

console.log("Semua proses setup database selesai.");
