'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function SellPage() {
  // รายการสินค้าทั้งหมด สำหรับ dropdown
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ฟอร์มการขาย
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selling, setSelling] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // โหลดรายการสินค้าเมื่อ mount
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      setError('โหลดรายการสินค้าไม่สำเร็จ: ' + error.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  // หาข้อมูลสินค้าที่เลือกอยู่ในปัจจุบัน
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // คำนวณยอดรวมอัตโนมัติ
  const qtyNumber = parseInt(quantity, 10) || 0;
  const totalPrice = selectedProduct ? selectedProduct.price * qtyNumber : 0;

  function resetForm() {
    setSelectedProductId('');
    setQuantity('');
  }

  async function handleSell(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!selectedProductId) {
      setError('กรุณาเลือกสินค้า');
      return;
    }
    if (qtyNumber <= 0) {
      setError('กรุณากรอกจำนวนที่ต้องการขายให้ถูกต้อง');
      return;
    }
    if (!selectedProduct) {
      setError('ไม่พบข้อมูลสินค้าที่เลือก');
      return;
    }

    // ตรวจสอบ stock คงเหลือให้เพียงพอ
    if (qtyNumber > selectedProduct.stock) {
      setError(
        `สินค้าคงเหลือไม่เพียงพอ (คงเหลือ ${selectedProduct.stock} ${selectedProduct.unit})`
      );
      return;
    }

    setSelling(true);

    // 1) บันทึกรายการลงตาราง sales
    const { error: saleError } = await supabase.from('sales').insert([
      {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        quantity: qtyNumber,
        total_price: totalPrice,
        sold_at: new Date().toISOString(),
      },
    ]);

    if (saleError) {
      setSelling(false);
      setError('บันทึกการขายไม่สำเร็จ: ' + saleError.message);
      return;
    }

    // 2) อัปเดต stock ในตาราง products ให้ลดลงตามจำนวนที่ขาย
    const newStock = selectedProduct.stock - qtyNumber;
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', selectedProduct.id);

    setSelling(false);

    if (updateError) {
      setError(
        'บันทึกการขายสำเร็จ แต่ปรับปรุงสต๊อกไม่สำเร็จ: ' + updateError.message
      );
      // ยังคงรีเฟรชข้อมูลสินค้าเพื่อให้ตรงกับฐานข้อมูลจริง
      fetchProducts();
      return;
    }

    setSuccessMsg(
      `ขาย "${selectedProduct.name}" จำนวน ${qtyNumber} ${selectedProduct.unit} สำเร็จ (รวม ${totalPrice.toFixed(2)} บาท)`
    );
    resetForm();
    fetchProducts(); // โหลดข้อมูลสินค้าใหม่เพื่อให้ stock อัปเดตล่าสุด
  }

  return (
    <div>
      <h1>ขายสินค้า</h1>

      {error && <p className="error-text">{error}</p>}
      {successMsg && <p className="success-text">{successMsg}</p>}

      <div className="card">
        {loading ? (
          <p>กำลังโหลดรายการสินค้า...</p>
        ) : products.length === 0 ? (
          <p>ยังไม่มีสินค้าในระบบ กรุณาเพิ่มสินค้าก่อน</p>
        ) : (
          <form onSubmit={handleSell}>
            <div className="form-row">
              <label>
                เลือกสินค้า
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">-- เลือกสินค้า --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({Number(product.price).toFixed(2)} บาท/{product.unit})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                จำนวน
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </label>
            </div>

            {/* แสดงข้อมูลสินค้าที่เลือกและยอดรวม */}
            {selectedProduct && (
              <div style={{ marginBottom: '14px' }}>
                <p>
                  คงเหลือในสต๊อก: {selectedProduct.stock} {selectedProduct.unit}
                </p>
                <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                  ยอดรวม: {totalPrice.toFixed(2)} บาท
                </p>
              </div>
            )}

            <button type="submit" disabled={selling}>
              {selling ? 'กำลังบันทึกการขาย...' : 'ขาย'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
