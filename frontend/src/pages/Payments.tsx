import { useEffect, useState } from 'react';
import { DollarSign, Check, X } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

interface Payment {
  id: string;
  amount: number;
  status: string;
  receipt_photo?: string;
  created_at: string;
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await axios.get(`${API_URL}/payments`);
      if (response.data.success) {
        setPayments(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await axios.patch(`${API_URL}/payments/${id}/confirm`, {
        admin_id: 'admin-id'
      });
      fetchPayments();
    } catch (error) {
      console.error('Failed to confirm payment:', error);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payments</h1>
        <p className="text-gray-500">Review and approve payments</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payments.map((payment) => (
            <div key={payment.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <DollarSign size={24} className="text-gray-400" />
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    payment.status === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : payment.status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {payment.status}
                </span>
              </div>

              <p className="text-2xl font-bold mb-1">{payment.amount.toLocaleString()} so'm</p>
              <p className="text-xs text-gray-500 mb-4">
                {new Date(payment.created_at).toLocaleString()}
              </p>

              {payment.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirm(payment.id)}
                    className="flex-1 btn-primary flex items-center justify-center gap-1"
                  >
                    <Check size={16} />
                    Confirm
                  </button>
                  <button className="flex-1 btn-secondary flex items-center justify-center gap-1 text-red-600">
                    <X size={16} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}

          {payments.length === 0 && (
            <div className="col-span-full card text-center py-12 text-gray-500">
              No payments yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
