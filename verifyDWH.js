const Database = require('better-sqlite3');

try {
    const db = new Database('toko_beras_dwh.db', { readonly: true });
    console.log('✅ Terhubung ke toko_beras_dwh.db untuk verifikasi.');

    function viewTable(tableName) {
        console.log(`\n===================================`);
        console.log(` Isi Tabel: ${tableName}`);
        console.log(`===================================`);
        const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
        rows.length > 0 ? console.table(rows) : console.log(`Tabel ${tableName} kosong.`);
    }

    viewTable('fact_sales');
    viewTable('fact_stock_order');
    viewTable('fact_goods_receiving');

    viewTable('dim_time')
    viewTable('dim_product')
    viewTable('dim_supplier')
    viewTable('dim_customer')
    viewTable('dim_employee')
    viewTable('dim_purchase_order')
    
    db.close();
} catch (error) {
    console.error('❌ Gagal terhubung ke DWH:', error.message);
}