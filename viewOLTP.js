// file: viewOLTP.js
const Database = require('better-sqlite3');

try {
    // Hubungkan ke database OLTP dalam mode hanya-baca (readonly)
    const db = new Database('toko_beras_oltp.db', { readonly: true });
    console.log('✅ Terhubung ke toko_beras_oltp.db untuk verifikasi.');

    /**
     * Fungsi untuk mengambil semua data dari sebuah tabel dan menampilkannya.
     * console.table() sangat bagus untuk menampilkan data dalam format tabel.
     * @param {string} tableName Nama tabel yang akan ditampilkan.
     */
    function viewTable(tableName) {
        console.log(`\n===================================`);
        console.log(` Isi Tabel: ${tableName}`);
        console.log(`===================================`);
        
        try {
            const stmt = db.prepare(`SELECT * FROM ${tableName}`);
            const rows = stmt.all();
            
            if (rows.length > 0) {
                console.table(rows);
            } else {
                console.log(`Tabel ${tableName} kosong.`);
            }
        } catch (error) {
            console.error(`Gagal membaca tabel ${tableName}:`, error.message);
        }
    }

    // Panggil fungsi untuk beberapa tabel kunci untuk verifikasi
    viewTable('customers');
    viewTable('employees');
    viewTable('suppliers');
    viewTable('product_categories');
    viewTable('products');
    viewTable('purchase_orders');
    viewTable('purchase_order_details');
    viewTable('sales');
    viewTable('sales_details');
    viewTable('goods_receivings');
    viewTable('goods_receiving_details');

    // Tutup koneksi setelah selesai
    db.close();

} catch (error) {
    console.error('❌ Gagal terhubung ke database. Pastikan file "toko_beras_oltp.db" sudah ada dan skrip "seedData.js" sudah dijalankan.', error.message);
}