'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function HistoryPage() {
  // รายการประวัติการขายทั้งหมด
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // โหลดข้อมูลประวัติการขายเมื่อ mount
  useEffect(() => {
    fetchSales();
  }, []);

  async function fetchSales() {
    setLoading(true);
    setError('');

    // ดึงข้อมูลจากตาราง sales เรียงจากล่าสุดไปเก่าสุด
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('sold_at', { ascending: false });

    if (error) {
      setError('โหลดประวัติการขายไม่สำเร็จ: ' + error.message);
    } else {
      setSales(data || []);
    }
    setLoading(false);
  }

  // คำนวณยอดขายรวมทั้งหมดจากทุกรายการ
  const grandTotal = sales.reduce((sum, sale) => sum + Number(sale.total_price), 0);

  // แปลงวันเวลาให้อ่านง่ายตามรูปแบบไทย
  function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  return (
    <div>
      <h1>ประวัติการขาย</h1>

      {error && <p className="error-text">{error}</p>}

      {/* สรุปยอดขายรวมทั้งหมด */}
      <div className="card">
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>
          ยอดขายรวมทั้งหมด: {grandTotal.toFixed(2)} บาท
        </p>
        <p style={{ margin: '4px 0 0', color: '#6b7280' }}>
          จำนวนรายการขาย: {sales.length} รายการ
        </p>
      </div>

      {/* ตารางประวัติการขาย */}
      {loading ? (
        <p>กำลังโหลดข้อมูล...</p>
      ) : sales.length === 0 ? (
        <p>ยังไม่มีประวัติการขาย</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>วันเวลาที่ขาย</th>
              <th>ชื่อสินค้า</th>
              <th>จำนวน</th>
              <th>ยอดรวม (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>{formatDateTime(sale.sold_at)}</td>
                <td>{sale.product_name}</td>
                <td>{sale.quantity}</td>
                <td>{Number(sale.total_price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
