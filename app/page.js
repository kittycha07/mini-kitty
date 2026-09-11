'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ProductsPage() {
  // รายการสินค้าทั้งหมด
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ฟอร์มเพิ่มสินค้าใหม่
  const emptyForm = { sku: '', name: '', price: '', stock: '', unit: '' };
  const [newProduct, setNewProduct] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // สถานะแก้ไขแบบ inline: เก็บ id ของแถวที่กำลังแก้ และค่าที่กำลังแก้
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // โหลดข้อมูลสินค้าเมื่อ mount
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError('โหลดข้อมูลสินค้าไม่สำเร็จ: ' + error.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  function clearMessages() {
    setError('');
    setSuccessMsg('');
  }

  // เพิ่มสินค้าใหม่
  async function handleAddProduct(e) {
    e.preventDefault();
    clearMessages();

    if (!newProduct.sku || !newProduct.name) {
      setError('กรุณากรอก SKU และชื่อสินค้า');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('products').insert([
      {
        sku: newProduct.sku,
        name: newProduct.name,
        price: parseFloat(newProduct.price) || 0,
        stock: parseInt(newProduct.stock, 10) || 0,
        unit: newProduct.unit,
      },
    ]);
    setSaving(false);

    if (error) {
      setError('เพิ่มสินค้าไม่สำเร็จ: ' + error.message);
      return;
    }

    setSuccessMsg('เพิ่มสินค้าเรียบร้อยแล้ว');
    setNewProduct(emptyForm);
    fetchProducts();
  }

  // เริ่มแก้ไขแถว
  function startEdit(product) {
    clearMessages();
    setEditingId(product.id);
    setEditForm({
      sku: product.sku,
      name: product.name,
      price: product.price,
      stock: product.stock,
      unit: product.unit,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  // บันทึกการแก้ไข
  async function saveEdit(id) {
    clearMessages();
    const { error } = await supabase
      .from('products')
      .update({
        sku: editForm.sku,
        name: editForm.name,
        price: parseFloat(editForm.price) || 0,
        stock: parseInt(editForm.stock, 10) || 0,
        unit: editForm.unit,
      })
      .eq('id', id);

    if (error) {
      setError('แก้ไขสินค้าไม่สำเร็จ: ' + error.message);
      return;
    }

    setSuccessMsg('แก้ไขสินค้าเรียบร้อยแล้ว');
    setEditingId(null);
    fetchProducts();
  }

  // ลบสินค้า
  async function handleDelete(id) {
    clearMessages();
    const confirmed = window.confirm('ยืนยันการลบสินค้านี้หรือไม่?');
    if (!confirmed) return;

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      setError('ลบสินค้าไม่สำเร็จ: ' + error.message);
      return;
    }

    setSuccessMsg('ลบสินค้าเรียบร้อยแล้ว');
    fetchProducts();
  }

  return (
    <div>
      <h1>รายการสินค้า</h1>

      {error && <p className="error-text">{error}</p>}
      {successMsg && <p className="success-text">{successMsg}</p>}

      {/* ฟอร์มเพิ่มสินค้าใหม่ */}
      <div className="card">
        <h2>เพิ่มสินค้าใหม่</h2>
        <form onSubmit={handleAddProduct}>
          <div className="form-row">
            <label>
              SKU
              <input
                type="text"
                value={newProduct.sku}
                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
              />
            </label>
            <label>
              ชื่อสินค้า
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </label>
            <label>
              ราคา
              <input
                type="number"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              />
            </label>
            <label>
              คงเหลือ
              <input
                type="number"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
              />
            </label>
            <label>
              หน่วย
              <input
                type="text"
                placeholder="ชิ้น, กล่อง, ..."
                value={newProduct.unit}
                onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
              />
            </label>
          </div>
          <button type="submit" disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'เพิ่มสินค้า'}
          </button>
        </form>
      </div>

      {/* ตารางรายการสินค้า */}
      {loading ? (
        <p>กำลังโหลดข้อมูล...</p>
      ) : products.length === 0 ? (
        <p>ยังไม่มีสินค้าในระบบ</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>ชื่อสินค้า</th>
              <th>ราคา</th>
              <th>คงเหลือ</th>
              <th>หน่วย</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const isEditing = editingId === product.id;
              return (
                <tr key={product.id}>
                  {isEditing ? (
                    <>
                      <td>
                        <input
                          type="text"
                          value={editForm.sku}
                          onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editForm.stock}
                          onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editForm.unit}
                          onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                        />
                      </td>
                      <td>
                        <button onClick={() => saveEdit(product.id)}>บันทึก</button>{' '}
                        <button onClick={cancelEdit}>ยกเลิก</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{product.sku}</td>
                      <td>{product.name}</td>
                      <td>{Number(product.price).toFixed(2)}</td>
                      <td>{product.stock}</td>
                      <td>{product.unit}</td>
                      <td>
                        <button onClick={() => startEdit(product)}>แก้ไข</button>{' '}
                        <button onClick={() => handleDelete(product.id)}>ลบ</button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
